## 1. Single Instance Lock

- [ ] 1.1 在 electron/main.ts 的 app.whenReady() 之前加入 app.requestSingleInstanceLock()，取得失敗則 app.quit()；取得成功時監聽 second-instance 事件，focus 現有 mainWindow [Tool: Copilot]
- [ ] 1.2 驗證 Single Instance Lock：build 後連續開啟 App 3 次，確認 Dock 只有 1 個實例，第 2、3 次開啟時現有視窗被 focus [Tool: 主對話]

## 2. Standalone Server Packaging

- [ ] [P] 2.1 修正 Next.js standalone integration：檢查 electron-builder.json 的 files 設定，確認 .next/standalone/ 目錄會被包含在 app.asar 或 asar.unpacked 中；如果缺少，補上正確的 glob pattern [Tool: Copilot]
- [ ] [P] 2.2 檢查 package.json 的 electron:build script，確認執行順序為 next build → obfuscate → electron:compile → electron-builder；如果 next build 沒有產出 .next/standalone/，script 應中止 [Tool: Copilot]
- [ ] 2.3 執行 npm run electron:build，確認 build 成功且產出的 app.asar 包含 .next/standalone/server.js [Tool: 主對話]

## 3. 端到端驗證

- [ ] 3.1 開啟打包好的 App，確認能正常啟動並顯示 UI（License 啟用頁或主頁），不再出現 crash loop [Tool: 主對話]
- [ ] 3.2 Code Review：檢查 electron/main.ts 和 electron-builder.json 的改動是否符合 proposal 和 spec [Tool: Kimi]
