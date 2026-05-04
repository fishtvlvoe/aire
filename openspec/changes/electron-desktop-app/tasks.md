## 1. Electron 基礎架構（d1：electron 架構）

- [ ] 1.1 初始化 Electron 專案結構（electron/main.ts, preload.ts），設定 electron-builder 打包配置（Win NSIS + Mac DMG），修改 next.config.ts 加入 output: 'standalone'。實現 d1：electron 架構。對應 Requirements "Build standalone desktop application"、"Next.js standalone integration"、"Desktop shortcut creation" [Tool: sonnet]
- [ ] 1.2 建立 desktop-launcher 模組（electron/launcher.ts）：啟動 Next.js standalone server → 偵測 ready → 開 BrowserWindow，含 splash screen 顯示。實現 d1：electron 架構。對應 Requirements "One-click application launch"、"Splash screen during startup" [Tool: sonnet]

## 2. License Server API（d2：license server api（部署在 vercel））

- [ ] 2.1 建立 server/ 目錄結構，初始化 Vercel serverless functions，設定 KV 或 Supabase 連接。實現 d2：license server api（部署在 vercel）。對應 Requirement "Server-side license activation" [Tool: copilot-codex]
- [ ] 2.2 實作 POST /api/license/activate — 接收 email + license_key，綁定並記錄 allowed_cidr。實現 d2：license server api（部署在 vercel）。對應 Requirements "Server-side license activation"、"License includes IP CIDR field" [Tool: copilot-codex]
- [ ] 2.3 實作 POST /api/license/verify — 檢查 email + key + IP CIDR + 過期日，回傳狀態。實現 d2：license server api（部署在 vercel）。對應 Requirements "Server-side license verification"、"Offline lockout" [Tool: copilot-codex]
- [ ] 2.4 修改本機 Next.js middleware，從本地 Ed25519 驗證改為呼叫 Server API + 快取結果。實現 d2：license server api（部署在 vercel）。對應 Requirements "License verification moved to server-side"、"Login requires valid license as precondition" [Tool: copilot-codex]

## 3. 功能開關系統（d4：功能開關機制）

- [ ] 3.1 實作 GET /api/features — 根據 license_key 回傳啟用功能列表。實現 d4：功能開關機制。對應 Requirement "Remote feature flag synchronization" [Tool: copilot-codex]
- [ ] 3.2 建立 client 端功能同步模組：啟動時拉取 → 本地快取 → 供 middleware 和 UI 使用。實現 d4：功能開關機制。對應 Requirement "Remote feature flag synchronization" [Tool: copilot-codex]
- [ ] 3.3 修改 Next.js middleware 加入功能路由攔截（未授權功能 redirect 首頁）。實現 d4：功能開關機制。對應 Requirement "Hide disabled features from UI" [Tool: copilot-codex]
- [ ] 3.4 修改導航選單元件，只渲染已授權功能的選單項。實現 d4：功能開關機制。對應 Requirement "Hide disabled features from UI" [Tool: copilot-codex]
- [ ] 3.5 建立管理員面板 /admin/features — 顯示所有 License 及功能開關，支援 toggle。實現 d4：功能開關機制。對應 Requirement "Admin feature management panel" [Tool: copilot-codex]

## 4. 自動更新機制（d3：自動更新流程）

- [ ] 4.1 建立 GitHub Actions workflow（.github/workflows/release.yml）：tag push → electron-builder 打包 → 上傳至 R2 releases/ 目錄 → 更新 latest.json。實現 d3：自動更新流程。對應 Requirement "One-click update installation" [Tool: copilot-codex]
- [ ] 4.2 實作 GET /api/updates/check — 驗 License 後回傳最新版本號 + R2 簽名下載 URL。實現 d3：自動更新流程。對應 Requirements "Automatic update check on startup"、"Update requires valid license" [Tool: copilot-codex]
- [ ] 4.3 建立 Electron auto-updater 模組（electron/updater.ts）：啟動時自動檢查 + 下載 + hash 驗證 + 安裝重啟。實現 d3：自動更新流程。對應 Requirements "Automatic update check on startup"、"One-click update installation" [Tool: sonnet]
- [ ] 4.4 前端新增「檢查更新」按鈕 + 更新進度 UI（進度條 + 狀態文字）。實現 d3：自動更新流程。對應 Requirement "Manual update check button" [Tool: copilot-codex]

## 5. Codex CLI 整合（d5：codex cli 整合）

- [ ] 5.1 將 @openai/codex 加入 dependencies 並調整 electron-builder 打包配置確保含入。實現 d5：codex cli 整合。對應 Requirement "Codex CLI bundled in application" [Tool: copilot-codex]
- [ ] 5.2 建立首次設定精靈 UI（/setup 路由）：Step 1 License → Step 2 OpenAI OAuth/手動 Key → Step 3 完成。實現 d5：codex cli 整合。對應 Requirements "First-time OpenAI authorization setup"、"Manual API key entry"、"Client must have ChatGPT Plus subscription" [Tool: copilot-codex]
- [ ] 5.3 實作 OpenAI OAuth 流程：開系統瀏覽器授權 → callback 接收 token → 加密存本地。實現 d5：codex cli 整合。對應 Requirement "First-time OpenAI authorization setup" [Tool: sonnet]
- [ ] 5.4 修改 llm-backend-adapter：加入環境判斷，production 模式鎖定 Codex adapter。實現 d5：codex cli 整合。對應 Requirements "Client version locked to Codex"、"Environment-based adapter locking" [Tool: copilot-codex]

## 6. 開發者設定面板（d5：codex cli 整合）

- [ ] 6.1 建立 /settings 頁面：LLM 切換下拉選單 + Debug toggle + 溫度/模型參數調整，僅 development 模式可見。實現 d5：codex cli 整合。對應 Requirements "Developer settings panel"、"LLM backend switching"、"Debug mode toggle"、"Production mode LLM selection" [Tool: copilot-codex]

## 7. 安全與清理（d6：程式碼混淆、d7：清理硬寫名稱）

- [ ] 7.1 設定 build 後程式碼混淆（javascript-obfuscator 或 terser mangle），確認混淆後功能正常。實現 d6：程式碼混淆。對應 Requirement "Build standalone desktop application" [Tool: copilot-codex]
- [ ] 7.2 全域搜尋清除硬寫名稱（「老魚」等），建立 config/branding.json 統一管理系統名稱。實現 d7：清理硬寫名稱。對應 Requirement "Build standalone desktop application" [Tool: copilot-codex]

## 8. 整合測試

- [ ] 8.1 E2E 測試：模擬首次安裝流程（License 啟用 → OpenAI 授權 → 啟動系統 → 功能權限驗證）。覆蓋 Requirements "Server-side license activation"、"First-time OpenAI authorization setup"、"One-click application launch"、"Remote feature flag synchronization" [Tool: sonnet]
- [ ] 8.2 E2E 測試：模擬更新流程（偵測新版 → 下載 → 安裝 → 重啟後版本號更新）。覆蓋 Requirements "Automatic update check on startup"、"Manual update check button"、"One-click update installation"、"Update requires valid license" [Tool: sonnet]
