## Context

系統目前只能透過 Terminal 啟動（npm run dev），客戶是房仲業務員無技術背景。需要打包成桌面應用，提供一鍵安裝/啟動/更新體驗。已有 Cloudflare R2 設定（bucket: fishtv）可用於存放更新檔。已有 license-management 和 user-auth specs，需改為 Server 端驗證。客戶需自行訂閱 ChatGPT Plus ($20/月) 使用 Codex CLI。

## Goals / Non-Goals

**Goals:**

- 打包成 Electron 桌面應用（Win .exe + Mac .app），不依賴 Docker
- 提供首次安裝精靈（License → OpenAI 授權 → 完成）
- 實現 Server 端 License 驗證（Email + IP 段綁定 + 斷網鎖定）
- 功能模組開關（管理員遠端控制，客戶看不到被鎖功能）
- 自動更新機制（啟動自動檢查 + 手動按鈕，檔案存 R2）
- Codex CLI 打包進 App，首次一鍵 OAuth 授權
- 客戶版鎖定 Codex，開發版可切換 Claude/Gemini/Codex
- 程式碼混淆防翻看

**Non-Goals:**

- 不用 Docker（純 Electron）
- 不做雲端版本（純本機）
- 不代客戶付 AI 費用
- 不做硬體指紋綁定（用 Email + IP 段）
- 不做離線 AI（LLM 需網路）
- 不做多用戶管理（單機單帳號）

## Decisions

### D1：Electron 架構

```
electron/
├── main.ts          — 主進程（啟動 Next.js、管理視窗）
├── preload.ts       — 預載腳本（暴露安全 API 給渲染層）
├── updater.ts       — 自動更新邏輯
└── launcher.ts      — 啟動 Next.js standalone server
```

- 使用 `next build` with `output: 'standalone'` 產出最小化 server
- Electron 主進程啟動 Next.js server（child_process），等 ready 後開 BrowserWindow
- Chromium 由 Electron 自帶，Puppeteer PDF 生成複用 Electron 的 Chromium

### D2：License Server API（部署在 Vercel）

```
server/
├── api/license/activate.ts   — POST: 首次啟用（email + license_key + machine_fingerprint）
├── api/license/verify.ts     — POST: 每次啟動驗證（email + license_key + client_ip）
├── api/features/index.ts     — GET: 取得該 License 開放的功能列表
└── api/updates/check.ts      — GET: 檢查最新版本 + 回傳 R2 簽名下載連結
```

- License 資料存 Vercel KV 或 Supabase
- IP 段檢查：License 記錄允許的 CIDR，verify 時比對 client IP
- 斷網策略：App 啟動時必須連上 Server 驗證，失敗 = 鎖住畫面顯示「請連接網路」

### D3：自動更新流程

1. 你 push 新版 → GitHub Actions 觸發
2. electron-builder 打包 Win/Mac
3. 上傳至 R2 `releases/v{version}/`
4. 更新 `releases/latest.json`（版本號 + 檔名 + hash）
5. App 啟動時 → 問 Server `/api/updates/check`（帶 License）
6. Server 驗 License 有效 → 回傳 R2 簽名 URL + 版本資訊
7. App 下載 → 驗 hash → 安裝 → 重啟

### D4：功能開關機制

```typescript
// Server 端（Vercel）
features_config = {
  "license_001": ["disclosure-document"],           // 基本版
  "license_002": ["disclosure-document", "contract"] // 加購版
}

// Client 端（App 啟動時同步）
// 1. 拿到功能列表存本地 cache
// 2. Next.js middleware 攔截未授權路由 → redirect 404
// 3. 選單元件只渲染已授權功能
// 4. API route 檢查功能權限 → 未授權回 403
```

### D5：Codex CLI 整合

- 把 `@openai/codex` npm 套件打包進 Electron
- 首次設定精靈 Step 2：開系統瀏覽器跳轉 OpenAI OAuth 授權頁
- 授權完成後 token 存入 App 本地設定（加密）
- 客戶版環境變數 `NEXT_PUBLIC_APP_MODE=production` → LLM selector 鎖定 Codex

### D6：程式碼混淆

- build 時用 `javascript-obfuscator` 或 `terser` 的 mangle 選項
- 混淆對象：Next.js standalone output 中的 server 檔案
- 不混淆 node_modules（已被壓縮且混淆會壞）

### D7：清理硬寫名稱

- 全局搜尋「老魚」「Fish」等硬寫名稱
- 改為讀取設定檔 `config/branding.json`：`{ "systemName": "AI 不動產說明書系統", "adminName": "..." }`

## Implementation Distribution Strategy

| 任務類型 | 代理 | 理由 |
|---------|------|------|
| Electron 主程序 + 打包設定 | Sonnet 子代理 | 跨模組整合，需精密控制 |
| Server API（License/Features/Updates） | Copilot CLI | 標準 API CRUD |
| GitHub Actions workflow | Copilot CLI | CI 設定 |
| 首次設定精靈 UI | Copilot CLI | React 元件 |
| 功能開關 middleware | Copilot CLI | 業務邏輯 |
| 程式碼混淆 + 清理 | Copilot CLI | 設定類 |
| E2E 驗證（安裝→啟動→更新流程） | Sonnet 子代理 | 複雜整合測試 |

預估 Token：約 25K
