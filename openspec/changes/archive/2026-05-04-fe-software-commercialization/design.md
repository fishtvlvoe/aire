## Context

`AIRE` 目前是針對單一客戶硬編碼的工具，所有 API routes 均無驗證保護，PDF 生成使用 `puppeteer` 全裝（需下載 ~300MB Chromium），無法部署至 Vercel。本次設計目標是在最小侵入性原則下，補足三個商業化缺口：授權序號、用戶登入、Serverless PDF。

## Goals / Non-Goals

**Goals:**

- 透過 Ed25519 離線序號驗簽，防止未授權使用
- 透過 Auth.js Credentials Provider 實現帳號密碼登入，保護所有 pages 與 API routes
- 將 PDF 生成改為可在 Vercel Serverless 運行（50MB 限制內）
- 不中斷現有房源 / 文件生成功能

**Non-Goals:**

- 多租戶 SaaS 架構（單公司部署）
- RBAC 角色分離
- 線上序號撤銷/軟啟用限制
- AWS Lambda 非同步 PDF 佇列

## Decisions

### 授權序號：Ed25519 非對稱簽章

使用 `@noble/ed25519`，以私鑰簽署 payload（公司名 + 到期日 + 版本號），公鑰嵌入應用程式。啟用時用公鑰驗簽後存入 SQLite `licenses` 表；每次 HTTP 請求由 Next.js Middleware 讀取 DB 快照驗證是否到期。

**Alternatives Considered:**
- HMAC-SHA256：對稱金鑰，反編譯即可偽造序號，安全性不足
- Keygen.sh 商用 API：需連網，不符客戶可能離線使用的需求，且增加月費成本

**SQLite DDL（licenses 表）：**
```sql
CREATE TABLE IF NOT EXISTS licenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  serial_key TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  expires_at TEXT NOT NULL,  -- ISO 8601, Asia/Taipei 時區
  activated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_licenses_serial_key ON licenses(serial_key);
```

### 用戶登入：Auth.js Credentials Provider + 雙 Token

使用 Auth.js 4.x（`next-auth`）Credentials Provider，密碼以 `bcryptjs`（cost=12）hash 後存入 SQLite `users` 表。Auth.js 內建 Session 策略選 `jwt`（不額外使用 Auth.js 的 DB Session 表），但應用層另外實作 Refresh Token 白名單（SQLite `refresh_tokens` 表），在 `/api/auth/refresh` 輪轉。

**Alternatives Considered:**
- Redis Session：可實現即時踢人，但增加基礎設施維護成本（客戶需自架 Redis）
- 純 JWT 無狀態（無 Refresh Token）：無法在員工離職時撤銷 token，安全風險過高

**SQLite DDL（users + refresh_tokens 表）：**
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
  token_hash TEXT NOT NULL UNIQUE,  -- SHA-256 of raw token
  expires_at TEXT NOT NULL,         -- Asia/Taipei, 7 days from creation
  revoked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
```

**Token 有效期：**
- Access Token（JWT，記憶體）：15 分鐘
- Refresh Token（HttpOnly Cookie）：7 天

### Serverless PDF：puppeteer-core + @sparticuz/chromium

移除 `puppeteer`（含 bundled Chromium），改用 `puppeteer-core`。新增 `chromium-launcher.ts` 抽象層，依 `CHROMIUM_MODE` env 回傳 executablePath：
- `local`（預設）：回傳 `process.env.PUPPETEER_EXECUTABLE_PATH` 或 `/usr/bin/chromium`
- `serverless`：呼叫 `@sparticuz/chromium` 取得 path（自動從 S3 下載約 50MB）

**@sparticuz/chromium 與 puppeteer-core 版本對齊：**
- `@sparticuz/chromium@131` 對應 `puppeteer-core@23.x`（需嚴格鎖版本）

**Alternatives Considered:**
- Gotenberg 容器：需自架獨立 Server，增加部署複雜度，不適合顧問小型專案
- DocRaptor API：按次計費，客戶 PDF 量大時成本不可控

### Next.js Middleware 攔截策略

`src/middleware.ts` 依序執行兩層檢查：

1. **License 層**：讀取 SQLite `licenses` 表（每次請求）。若無有效授權 → 301 重導 `/setup/license`。豁免路徑：`/setup/*`、`/api/setup/*`
2. **Auth 層**：用 Auth.js `getToken()` 檢查 Access Token。若未登入 → 301 重導 `/login`。豁免路徑：`/login`、`/api/auth/*`、靜態資源

執行順序：License 檢查優先於 Auth 檢查（序號無效時不需要登入）。

## Risks / Trade-offs

- [Risk] SQLite 每次 HTTP 請求都讀 licenses 表造成效能負擔 → Mitigation：Middleware 中使用模組層級快取（`licenseCache`），TTL 60 秒，只在快取過期時重新查詢
- [Risk] `@sparticuz/chromium` 版本與 `puppeteer-core` 版本不一致導致 Chromium 啟動失敗 → Mitigation：在 `package.json` 固定兩者版本，不使用 `^` 前綴；CI 加 `npm ci` 驗證
- [Risk] Vercel Serverless 60 秒 Timeout，複雜 PDF 可能超時 → Mitigation：限制 PDF API route 的 `maxDuration = 60`（Vercel Pro），並在前端加 loading + timeout 提示
- [Risk] Refresh Token 若從 Cookie 中洩漏（XSS）可被濫用 → Mitigation：Cookie 設 `HttpOnly + Secure + SameSite=Strict`；配合 NEXTAUTH_SECRET 128-bit 隨機字串

## Migration Plan

**部署步驟（客戶新裝）：**
1. 設定環境變數：`COMPANY_NAME`, `NEXTAUTH_SECRET`（128-bit random），`NEXTAUTH_URL`，`LICENSE_PUBLIC_KEY`（Ed25519 公鑰 hex），`CHROMIUM_MODE=local`（本機）或 `serverless`（Vercel）
2. 執行 `npm install`（安裝 puppeteer-core、@sparticuz/chromium、next-auth、bcryptjs）
3. 啟動應用，`src/lib/db/index.ts` 會在初次連線時自動執行 migration 建立 licenses / users / refresh_tokens 表
4. 執行 `node scripts/create-admin.ts`（建立初始管理員帳號）
5. 啟動應用後前往 `/setup/license` 輸入序號完成啟用

**升級舊版本（已有資料）：**
1. 備份 `*.db` 資料庫檔案
2. 啟動新版本應用，`initDb()` 自動偵測並新增 3 個新資料表（不刪除現有資料）
3. 驗證：`curl /api/health` 回傳 200

**回滾策略：**
- 若新版本啟動失敗，回退 `package.json` lock 版本，還原 DB 備份
- `licenses` / `users` / `refresh_tokens` 均為新增資料表，回滾時只需 `DROP TABLE`，不影響現有房源資料
