## Context

three-ai 是不動產媒合平臺，目標客戶是房仲業務員。目前系統有 Electron 外殼雛形（electron/ 目錄含 main.ts、launcher.ts、updater.ts、preload.ts）和 License Server 基礎（server/ 目錄含 Express + SQLite）。已有的 UI 頁面包括首次設定精靈（/setup）、登入頁（/login）、管理員功能面板（/admin/features）。但缺少 middleware 路由保護、正式 next-auth 登入、electron-updater 自動更新整合、Serverless PDF 能力、序號產生 CLI。本次合併兩個舊計畫，補齊所有缺口。

已存在的代碼：
- electron/main.ts（136 行）：Electron 主進程，含 splash window、IPC、OAuth URL scheme
- electron/launcher.ts（85 行）：啟動 Next.js standalone server + port 3000 polling
- electron/updater.ts（102 行）：自製 HTTP 下載更新邏輯（SHA256 驗證）
- src/lib/license/server-verify.ts（84 行）：呼叫 License Server API 驗證 + 24h 本地快取
- src/lib/auth.ts（56 行）：自製 session 管理（8h TTL，SQLite）
- src/app/login/page.tsx（77 行）：簡單登入表單
- server/src/：Express server 含 health、parse-transcript、real-price、earthquake routes
- 已裝：electron, electron-builder, bcryptjs, javascript-obfuscator
- 未裝：electron-updater, next-auth, puppeteer-core, @sparticuz/chromium

## Goals / Non-Goals

**Goals:**

- 補齊 middleware 雙層路由保護（License + Auth）
- 將自製 session 改為 next-auth Credentials Provider + 雙 Token
- 將自製 HTTP 更新改為 electron-updater 套件
- PDF 生成改為可在 Vercel Serverless 運行
- 提供序號產生和管理員帳號建立 CLI
- 驗證 Electron build 產出可安裝的 .app/.exe

**Non-Goals:**

- 不做多租戶、RBAC、離線驗證、OAuth 登入、Linux 版本

## Decisions

### D1：Middleware 雙層攔截

src/middleware.ts 依序執行兩層檢查：

1. License 層：呼叫 src/lib/license/server-verify.ts 的 getCachedLicense()（已有 24h 快取機制），無效則 redirect /setup
2. Auth 層：用 next-auth getToken() 檢查 JWT，無效則 redirect /login

豁免路徑：/setup/*, /api/setup/*, /login, /api/auth/*, /_next/*, /favicon.ico

執行順序：License 優先（序號無效不需登入）。

**替代方案**：在每個 API route 個別加驗證 → 太分散，容易漏；middleware 統一攔截更可靠。

### D2：next-auth 整合取代自製 session

現有 src/lib/auth.ts 是自製 session（cookie + SQLite，8h TTL）。改為 next-auth 4.x Credentials Provider：

- Session strategy: jwt（不用 next-auth DB session）
- Access Token（JWT）：15 分鐘有效
- Refresh Token：7 天有效，存 SQLite refresh_tokens 表（SHA-256 hash），HttpOnly + Secure + SameSite=Strict cookie
- src/app/api/auth/[...nextauth]/route.ts：Auth.js handler
- src/app/api/auth/refresh/route.ts：Refresh Token 輪轉
- 改造現有 src/app/login/page.tsx 呼叫 next-auth signIn()
- 現有 src/lib/auth.ts 改為 src/lib/auth/db.ts，保留 user CRUD 但移除 session 邏輯

SQLite DDL（新增至 migrations/004_auth_license.sql）：
```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  revoked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
```

**替代方案**：純 JWT 無 Refresh Token → 員工離職無法撤銷 token，安全風險高。

### D3：electron-updater 整合

現有 electron/updater.ts 是自製邏輯（fetch JSON → 下載 → SHA256 驗證 → 開 installer）。改為使用 electron-updater 套件：

- 安裝 electron-updater
- 改造 updater.ts 使用 autoUpdater API（checkForUpdates、downloadUpdate、quitAndInstall）
- 更新來源：generic provider，指向 License Server /api/updates/check（驗 License 後回傳 R2 簽名 URL）
- 保留現有 IPC 事件名稱（update-status）維持前端相容性
- electron-builder 設定加入 publish 配置

**替代方案**：保留自製更新邏輯 → 缺少差量更新、自動重啟、程式碼簽章驗證等 electron-updater 內建功能。

### D4：Serverless PDF chromium-launcher

新增 src/lib/pdf-generator/chromium-launcher.ts，依 CHROMIUM_MODE env 切換：

- local（預設）：puppeteer-core 使用 process.env.PUPPETEER_EXECUTABLE_PATH 或 /usr/bin/chromium
- serverless：@sparticuz/chromium 自動取得 path

修改 dossier.ts 和 survey-sales.ts 的 puppeteer.launch() 改用 launchBrowser() import。

版本鎖定：@sparticuz/chromium@131 對應 puppeteer-core@23.x。

package.json 移除 puppeteer，新增 puppeteer-core@23.11.1 + @sparticuz/chromium@131.0.0（固定版本，不用 ^）。

**替代方案**：Gotenberg 容器 → 需自架 server，不適合輕量部署。

### D5：序號產生與管理員 CLI

- scripts/generate-license.ts：接受 --company 和 --expires 參數，呼叫 License Server API 建立序號並輸出
- scripts/create-admin.ts：接受 --username 和 --password，bcrypt hash 後寫入 SQLite users 表

兩個 CLI 用 tsx 執行（已在 server/devDependencies）。

### D6：Electron Build 驗證

驗證 electron-builder 能打出：
- Mac：DMG 安裝檔（.app 在內）
- Win：NSIS installer（.exe）

驗證項目：安裝後能啟動、Next.js server 正常運行、能開 BrowserWindow 顯示系統畫面。

## Risks / Trade-offs

- [Risk] next-auth 改造可能破壞現有 /setup 頁面的 session 邏輯 → Mitigation：/setup 頁面不需要登入（在 middleware 豁免），只在完成設定後才需要 auth
- [Risk] puppeteer → puppeteer-core 替換可能影響現有 PDF 生成 → Mitigation：chromium-launcher 抽象層隔離，local 模式行為等同原本的 puppeteer
- [Risk] electron-updater 的 generic provider 需要正確的 latest.yml 格式 → Mitigation：GitHub Actions 打包時自動產生，在 CI 驗證格式
- [Risk] 自製 session → next-auth 遷移期間，已登入用戶會被登出 → Mitigation：可接受，客戶尚未正式使用

## Migration Plan

**本機開發（首次）：**
1. npm install（安裝新依賴）
2. 設定 .env：NEXTAUTH_SECRET（隨機 128-bit）、NEXTAUTH_URL=http://localhost:3000、CHROMIUM_MODE=local
3. 啟動應用，initDb() 自動跑 migration 建表
4. 執行 scripts/create-admin.ts 建管理員帳號
5. 登入測試

**客戶安裝（隨身碟）：**
1. 雙擊 .app/.exe 安裝
2. 首次啟動進入 /setup：輸入 License → 設定 OpenAI → 完成
3. 系統自動建立預設管理員帳號
4. 登入使用

**回滾：**
- users、refresh_tokens 為新表，回滾時 DROP 即可不影響房源資料
- puppeteer-core → puppeteer 還原只需改 package.json

## Implementation Distribution Strategy

| 任務類型 | 代理 | 理由 |
|---------|------|------|
| Middleware + next-auth 整合 | Copilot CLI | 標準 API 整合 |
| Auth DB CRUD + migration | Copilot CLI | SQLite CRUD |
| electron-updater 整合 | Sonnet 子代理 | 跨模組整合（Electron IPC + build config） |
| chromium-launcher + PDF migration | Copilot CLI | 單一抽象層 |
| CLI 工具（generate-license, create-admin） | Copilot CLI | 簡單腳本 |
| Login 頁改造（接 next-auth） | Copilot CLI | React 元件修改 |
| Electron build 驗證 | Sonnet 子代理 | 跨平台 build 驗證 |
| E2E 測試 | Sonnet 子代理 | 複雜整合測試 |
