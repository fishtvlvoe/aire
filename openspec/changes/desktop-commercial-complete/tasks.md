## 1. 套件與資料庫基礎（d1：middleware 雙層攔截、d2：next-auth 整合取代自製 session、d4：serverless pdf chromium-launcher）

- [x] 1.1 Package replacement：更新 package.json，移除 puppeteer，新增 puppeteer-core@23.11.1（固定版本）、@sparticuz/chromium@131.0.0（固定版本）、next-auth@4.24.11、electron-updater。驗證 npm install 無錯誤。實現 Package replacement requirement。[Tool: copilot-codex]
- [x] 1.2 授權與登入資料模型：建立 migrations/004_auth_license.sql，依 d2 決策中的 DDL 建立 users 和 refresh_tokens 兩張表（含 index）。修改 src/lib/db/index.ts 的 initDb() 啟動時自動執行此 migration。實現 Password storage requirement 和 Dual token mechanism requirement 的資料層。[Tool: copilot-codex]
- [x] 1.3 環境變數模板更新：更新 .env.example，新增 NEXTAUTH_SECRET、NEXTAUTH_URL、CHROMIUM_MODE 三個變數與說明註解。[Tool: copilot-codex]

## 2. Serverless PDF — Chromium 啟動抽象層（d4：serverless pdf chromium-launcher）

- [x] [P] 2.1 Dual-mode Chromium launcher：建立 src/lib/pdf-generator/chromium-launcher.ts，實作 launchBrowser() 函式，依 CHROMIUM_MODE env（local|serverless）切換 puppeteer-core 啟動方式。local 模式用 process.env.PUPPETEER_EXECUTABLE_PATH 或 /usr/bin/chromium；serverless 模式用 @sparticuz/chromium 取得 path 並加 serverless-optimized args。實現 Dual-mode Chromium launcher requirement。[Tool: copilot-codex]
- [x] [P] 2.2 PDF generator migration（dossier）：修改 src/lib/pdf-generator/dossier.ts，將 puppeteer.launch() 替換為 launchBrowser() import，保留 try/finally browser.close() 模式。實現 PDF generator migration requirement。[Tool: copilot-codex]
- [x] [P] 2.3 PDF generator migration（survey-sales）：修改 src/lib/pdf-generator/survey-sales.ts，將 puppeteer.launch() 替換為 launchBrowser() import，保留 try/finally browser.close() 模式。實現 PDF generator migration requirement。[Tool: copilot-codex]
- [x] 2.4 Container deployment CHROMIUM_MODE：修改 Dockerfile，在 runner stage ENV 區塊新增 CHROMIUM_MODE=local，安裝系統 chromium 套件，deps/builder stage 維持 PUPPETEER_SKIP_DOWNLOAD=true。實現 Docker image builds successfully for linux/amd64 requirement。[Tool: copilot-codex]

## 3. 用戶身份驗證（d2：next-auth 整合取代自製 session）

- [x] 3.1 Auth DB CRUD：將現有 src/lib/auth.ts 重構為 src/lib/auth/db.ts，保留 user CRUD（getUserByUsername、createUser），移除自製 session 邏輯，新增 createRefreshToken()、revokeRefreshToken()、getValidRefreshToken()。Password storage 使用 bcryptjs cost=12。實現 Password storage requirement 和 Admin account creation CLI requirement 的資料層。[Tool: copilot-codex]
- [x] 3.2 next-auth handler：建立 src/app/api/auth/[...nextauth]/route.ts，設定 Auth.js Credentials Provider，驗密碼後回傳 user object，session strategy 為 jwt，JWT 有效期 15 分鐘。實現 User login with credentials requirement。[Tool: copilot-codex]
- [x] 3.3 Refresh Token 輪轉 API：建立 src/app/api/auth/refresh/route.ts，POST endpoint 驗 Refresh Token（DB 白名單）→ 舊 token revoke → 新 token 產生並以 HttpOnly Secure SameSite=Strict cookie 回傳。實現 Dual token mechanism requirement。[Tool: copilot-codex]
- [x] 3.4 Login 頁面改造：修改 src/app/login/page.tsx，將現有 fetch /api/auth/login 改為呼叫 next-auth signIn("credentials")，失敗顯示錯誤，成功導向 /listings。實現 User login with credentials requirement 的 UI 層。[Tool: copilot-codex]
- [x] 3.5 Admin account creation CLI：建立 scripts/create-admin.ts，接受 --username 和 --password，bcrypt hash（cost 12）後呼叫 createUser()，username 已存在則 exit 1 並印 "Username already exists"。實現 Admin account creation CLI requirement。[Tool: copilot-codex]

## 4. Middleware 路由保護（d1：middleware 雙層攔截）

- [x] 4.1 Middleware 雙層攔截：建立 src/middleware.ts，依序執行 (1) License 檢查：呼叫 getCachedLicense()，無效/到期 redirect /setup；(2) Auth 檢查：用 next-auth getToken()，未登入 redirect /login。豁免路徑：/setup/*, /api/setup/*, /login, /api/auth/*, /_next/*, /favicon.ico。實現 Middleware license cache requirement、Auth middleware order requirement、Route protection scope requirement、Login requires valid license as precondition requirement。[Tool: copilot-codex]

## 5. License 序號產生工具（d5：序號產生與管理員 cli）

- [x] 5.1 License generation CLI：建立 scripts/generate-license.ts，接受 --company 和 --expires 參數，呼叫 License Server API 建立序號並輸出到 stdout。驗證 --expires 為未來的 ISO 8601 日期，過去日期 exit 1。實現 License generation CLI requirement。[Tool: copilot-codex]

## 6. 自動更新整合（d3：electron-updater 整合）

- [x] 6.1 electron-updater 整合：改造 electron/updater.ts，移除自製 HTTP 下載邏輯，改用 electron-updater autoUpdater API（checkForUpdates、downloadUpdate、quitAndInstall）。更新來源用 generic provider 指向 License Server /api/updates/check。保留現有 IPC 事件名稱 update-status。實現 Automatic update check on startup requirement 和 One-click update installation requirement。[Tool: sonnet]
- [x] 6.2 electron-builder publish 配置：在 package.json 的 build 設定中新增 publish 配置（generic provider），指向更新 server URL。實現 Build standalone desktop application requirement 的更新機制部分。[Tool: copilot-codex]

## 7. Electron Build 驗證（d6：electron build 驗證）

- [x] 7.1 macOS build 驗證：執行 electron-builder 打包 macOS DMG，驗證 DMG 檔案產出、.app 可啟動、Next.js server 正常運行、BrowserWindow 顯示系統畫面。實現 Build standalone desktop application requirement。[Tool: sonnet]
- [x] 7.2 前端更新 UI：新增「檢查更新」按鈕與更新進度 UI（進度條 + 狀態文字），接收 update-status IPC 事件顯示。實現 Manual update check button requirement。[Tool: copilot-codex]

## 8. 測試

- [x] [P] 8.1 Dual-mode Chromium launcher 單元測試：為 chromium-launcher.ts 撰寫 Vitest 單元測試，mock CHROMIUM_MODE env，驗證 local/serverless 分支各自呼叫正確 launch 參數。覆蓋 Dual-mode Chromium launcher requirement。[Tool: sonnet]
- [x] [P] 8.2 Auth + Middleware 整合測試：測試 middleware 雙層攔截邏輯——無 License redirect /setup、有 License 無 Auth redirect /login、兩者皆有通過。覆蓋 Middleware license cache requirement 和 Auth middleware order requirement。[Tool: sonnet]
- [x] 8.3 E2E 測試：模擬首次安裝流程（License 啟用 → 建管理員 → 登入 → 存取受保護頁面）。覆蓋 User login with credentials requirement、License activation flow requirement、Route protection scope requirement。[Tool: sonnet]
