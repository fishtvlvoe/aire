## Context

three-ai 是一個 Next.js 16 + TypeScript 專案，目前只能透過 `npm run dev` 在本機啟動，再用瀏覽器連 localhost:3000 使用。客戶是房仲公司的非技術人員，需要雙擊桌面圖示就能使用。Electron 41.5.0 已加入 package.json 但尚未設定主程序和打包流程。

目標平台：macOS（Apple Silicon + Intel）、Windows 10/11。不做 Linux。

## Goals / Non-Goals

**Goals:**

- 雙擊「不動產 AI 系統.app」（macOS）或「不動產 AI 系統.exe」（Windows）即可啟動
- 視窗無網址列、無瀏覽器 UI，看起來像獨立桌面軟體
- Next.js server 由 Electron 主程序內部啟動，用戶不需要懂終端機
- 產出可發布的 `.dmg`（macOS）和 `.exe`（Windows NSIS installer）
- App icon 具專業質感，代表不動產 AI 系統品牌

**Non-Goals:**

- 不處理授權序號（由 `license-and-auto-update` change 負責）
- 不處理自動更新（由 `license-and-auto-update` change 負責）
- 不改動 Next.js 業務邏輯代碼
- 不做 Linux 打包
- 不做 code signing（Apple Developer / Windows Authenticode），首版用未簽名安裝檔

## Decisions

### D1: Electron 主程序架構

採用 `electron-main` + `preload` 雙層架構：

- `electron/main.ts`：啟動 Next.js server（`next start`）→ 等 server ready → 建立 BrowserWindow 載入 `http://localhost:3000`
- `electron/preload.ts`：透過 contextBridge 暴露最小 API 給 renderer（目前只需 `app.getVersion()`）
- 開發模式：`npm run dev` 啟動 Next.js dev server，Electron 連到 `localhost:3000`
- 生產模式：先 `next build` + `next start`，Electron 載入 standalone server

### D2: Next.js Standalone Mode

使用 `next.config.ts` 的 `output: 'standalone'` 模式，讓 Next.js build 產出自包含的 server（不依賴 node_modules）。Electron 打包時只需包含 `.next/standalone/` 目錄。

### D3: electron-builder 設定

```
productName: 不動產 AI 系統
appId: com.nucleusflow.real-estate-ai
directories.output: dist-electron
mac:
  target: dmg
  icon: build/icon.icns
  category: public.app-category.business
win:
  target: nsis
  icon: build/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  installerLanguages: [zh_TW]
```

### D4: App Icon

使用 1024x1024 PNG 主圖，透過工具轉換為 `.icns`（macOS）和 `.ico`（Windows）。圖示設計：簡潔的建築/房屋輪廓 + AI 元素，深藍色調，白色前景。

### D5: 視窗設定

```
BrowserWindow:
  width: 1280
  height: 800
  minWidth: 1024
  minHeight: 600
  titleBarStyle: hiddenInset (macOS)
  frame: true (Windows，保留最小化/最大化/關閉按鈕)
  webPreferences:
    preload: preload.js
    contextIsolation: true
    nodeIntegration: false
```

### D6: Port 衝突處理

Next.js server 預設用 3000 port，若被佔用則自動遞增嘗試 3001-3010。Electron 主程序記錄實際使用的 port 再載入對應 URL。

### D7: Codex CLI 內包

Codex CLI binary 打包進 Electron app 的 `resources/codex/` 目錄：

- macOS：`resources/codex/codex-darwin-arm64` + `resources/codex/codex-darwin-x64`
- Windows：`resources/codex/codex-win-x64.exe`
- electron-builder 設定 `extraResources` 將 codex binary 包進安裝檔
- `electron/main.ts` 啟動時設定 `PATH` 環境變數包含 codex 路徑

### D8: ChatGPT 授權流程

首次啟動且 Codex 未授權時，引導用戶至 `/setup/codex`：

- 方式一（推薦）：OAuth 重導——開啟系統瀏覽器到 ChatGPT 授權頁，callback 回 app
- 方式二（備用）：手動貼 API Key——用戶到 platform.openai.com 複製 key 貼回
- 驗證方式：用收到的 key/token 呼叫 OpenAI API 測試（GET /v1/models）
- 驗證 ChatGPT Plus 訂閱：確認帳號有 Plus 方案才允許使用 AI 功能
- key 存放：macOS Keychain / Windows Credential Manager（不存明文檔案）

### D9: 生產模式鎖定

`NEXT_PUBLIC_APP_MODE=production` 時：

- `src/lib/codex-client/index.ts` 只載入 Codex adapter，隱藏其他 LLM 選項
- `/setup` 頁面不顯示「開發者設定」區塊
- 遞補鏈停用（Codex 失敗直接報錯，不 fallback 到 Gemini/Claude/Ollama）

## Risks / Trade-offs

| 風險 | 影響 | 對策 |
|------|------|------|
| 安裝檔約 200MB（含 Chromium） | 客戶下載/拷貝時間較長 | 首次用隨身碟安裝，後續透過差量更新 |
| macOS 未簽名會跳 Gatekeeper 警告 | 客戶需右鍵開啟一次 | 首次安裝由 Fish 到場操作；後續版本考慮買 Apple Developer 證書 |
| Windows SmartScreen 警告 | 首次執行會提示「不明發行者」 | NSIS 安裝程式 + Fish 到場指導；後續考慮 EV 簽名 |
| Puppeteer（PDF 生成）需要 Chromium | 可能與 Electron 內建 Chromium 衝突 | Puppeteer 設定 `executablePath` 指向 Electron 自帶的 Chromium |
| Codex CLI binary 增加安裝檔大小 | 約多 50-100MB | 隨身碟安裝不受影響；後續差量更新 |
| ChatGPT Plus 要求客戶有訂閱 | 客戶需自行訂閱 $20/月 | Fish 在安裝時協助客戶註冊並授權 |
| API Key 安全存放 | 明文存檔可能被讀取 | 使用 OS 原生 Keychain/Credential Manager |
