## 1. App Icon 製作（D4: App Icon + App 品牌設定）

- [ ] 1.1 製作 1024x1024 PNG app icon（App 品牌設定：建築輪廓 + AI 元素，深藍色調白色前景），存為 build/icon.png [Tool: copilot-codex]
- [ ] 1.2 從 build/icon.png 轉換產出 build/icon.icns（macOS）和 build/icon.ico（Windows），完成 D4: App Icon 設定 [Tool: sonnet]

## 2. Electron 主程序（D1: Electron 主程序架構 + D6: Port 衝突處理 + 一鍵啟動流程）

- [ ] 2.1 建立 electron/main.ts：依 D1: Electron 主程序架構，實作 Next.js Standalone Packaging 啟動邏輯（spawn .next/standalone/server.js）+ D6: Port 衝突處理（自動遞增 3000-3010）+ 等 server ready 後建立 BrowserWindow，完成一鍵啟動流程 [Tool: copilot-codex]
- [ ] 2.2 建立 electron/preload.ts：依 D1: Electron 主程序架構，透過 contextBridge 暴露 app.getVersion() 給 renderer，contextIsolation: true [Tool: copilot-codex]
- [ ] 2.3 實作一鍵啟動流程的啟動失敗場景：30 秒 timeout 顯示錯誤對話框「系統啟動失敗」（含重試和退出按鈕） [Tool: copilot-codex]
- [ ] 2.4 實作一鍵啟動流程的應用關閉場景：關閉視窗時終止 Next.js server 子程序後退出 app [Tool: copilot-codex]

## 3. 視窗與品牌設定（D5: 視窗設定 + D3: electron-builder 設定 + 無框視窗外觀 + App 品牌設定）

- [ ] 3.1 設定 BrowserWindow 無框視窗外觀：依 D5: 視窗設定，macOS hiddenInset title bar、Windows 標準框架、minWidth 1024 / minHeight 600、preload 路徑 [Tool: copilot-codex]
- [ ] 3.2 設定 D3: electron-builder 設定 + App 品牌設定：productName「不動產 AI 系統」、appId com.nucleusflow.real-estate-ai、mac target dmg、win target nsis [Tool: copilot-codex]

## 4. Codex CLI 整合（D7: Codex CLI 內包 + D8: ChatGPT 授權流程 + D9: 生產模式鎖定）

- [ ] 4.1 下載 Codex CLI binary 並設定 electron-builder extraResources，實作 D7: Codex CLI 內包——Codex CLI 內包至 resources/codex/ 目錄 [Tool: copilot-codex]
- [ ] 4.2 建立 src/app/setup/codex/page.tsx：依 D8: ChatGPT 授權流程，實作 ChatGPT 授權流程頁面（OAuth 重導 + 手動貼 API Key + 無效 API Key 錯誤提示）[Tool: copilot-codex]
- [ ] 4.3 實作訂閱驗證邏輯：檢查 ChatGPT Plus 訂閱狀態，無 Plus 則顯示升級提示並停用 AI 功能 [Tool: copilot-codex]
- [ ] 4.4 實作 D9: 生產模式鎖定——NEXT_PUBLIC_APP_MODE=production 時只用 Codex adapter、隱藏開發者設定 UI [Tool: copilot-codex]
- [ ] 4.5 實作 API Key 安全存放：macOS Keychain / Windows Credential Manager，不存明文檔案 [Tool: copilot-codex]

## 5. 打包腳本（D2: Next.js Standalone Mode + macOS 打包 + Windows 打包 + 開發模式快速啟動）

- [ ] 5.1 修改 next.config.ts 設定 output: 'standalone'，實現 D2: Next.js Standalone Mode [Tool: copilot-codex]
- [ ] [P] 5.2 新增 package.json scripts：dev:electron（開發模式快速啟動）、build:desktop、build:mac（macOS 打包 DMG 產出）、build:win（Windows 打包 NSIS 產出） [Tool: copilot-codex]
- [ ] 5.3 安裝 electron-builder devDependency，設定 tsconfig for electron/ 目錄 [Tool: copilot-codex]
- [ ] 5.4 執行 npm run build:mac 驗證 macOS 打包 .dmg 產出，確認 App 品牌設定 icon 正確顯示 + Codex CLI 內包存在 [Tool: sonnet]

## 6. 驗收測試

- [ ] 6.1 在本機雙擊 .app 測試完整一鍵啟動流程：splash → server ready → 主視窗顯示 → 應用關閉退出 [Tool: sonnet]
- [ ] 6.2 驗證無框視窗外觀 + D5: 視窗設定：無網址列、無瀏覽器 UI、macOS 交通燈按鈕正確顯示 [Tool: sonnet]
- [ ] 6.3 驗證 ChatGPT 授權流程：首次啟動 → /setup/codex 頁面 → OAuth 或手動 Key → 驗證成功 → 進入主畫面 [Tool: sonnet]
- [ ] 6.4 驗證生產模式鎖定：確認開發者設定 UI 隱藏、LLM 後端只有 Codex [Tool: sonnet]
