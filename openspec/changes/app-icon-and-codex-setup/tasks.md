## 1. 依賴安裝與基礎設定

- [x] 1.1 安裝 png2icons 為 devDependency，對應 D1: Icon 產出工具鏈 決策 [Tool: copilot-codex]

## 2. App Icon 資源產出

- [x] [P] 2.1 設計 1024x1024 App icon（深藍 #1a365d 底色、白色建築輪廓 + AI 電路圖樣），存為 build/icon.png，對應 App icon design specification [Tool: copilot-codex]
- [x] [P] 2.2 建立 scripts/generate-icons.ts 腳本，讀取 build/icon.png 產出 build/icon.icns 和 build/icon.ico，對應 App icon asset generation [Tool: copilot-codex]
- [x] 2.3 更新 package.json electron-builder build 欄位，設定 icon 路徑為 build/icon.png、directories.buildResources 為 build，對應 D2: Icon 存放路徑 和 App 品牌設定（electron-packaging MODIFIED）[Tool: copilot-codex]

## 3. API Key 加密存放模組

- [x] 3.1 建立 src/lib/codex-client/key-store.ts，實作 AES-256-GCM 加解密，密鑰由 hostname + username + salt 經 scryptSync 衍生，對應 D3: API Key 加密存放方式 和 API Key encrypted storage [Tool: copilot-codex]
- [x] 3.2 處理解密失敗情境（不同機器），自動清除損壞密文並回傳 null，對應 Decryption failure on different machine scenario [Tool: copilot-codex]

## 4. API Key 驗證端點

- [x] 4.1 建立 src/app/api/setup/verify-openai/route.ts，POST 端點呼叫 OpenAI GET /v1/models 驗證 key 有效性，含 5 秒 timeout，對應 D4: API Key 驗證方式 和 API Key verification endpoint [Tool: copilot-codex]

## 5. Codex Setup 頁面

- [x] 5.1 建立 src/app/setup/codex/page.tsx，包含 API Key 輸入框（type=password）、驗證按鈕、跳過按鈕，對應 D5: Setup 頁面流程設計 和 Codex setup page [Tool: copilot-codex]
- [x] 5.2 修改 src/app/setup/page.tsx，License 完成後 router.push 到 /setup/codex，對應 D5: Setup 頁面流程設計 和 First-time OpenAI authorization setup [Tool: copilot-codex]

## 6. 生產模式鎖定

- [x] 6.1 修改 src/lib/codex-client/index.ts，當 NEXT_PUBLIC_APP_MODE=production 時強制使用 Codex adapter，對應 D6: 生產模式鎖定 和 生產模式鎖定（生產模式強制 Codex adapter scenario）[Tool: copilot-codex]
- [x] 6.2 在 setup/codex 頁面和設定頁面中，production mode 時隱藏其他 LLM provider 選項，對應 生產模式隱藏設定 scenario [Tool: copilot-codex]

## 7. 單元測試

- [x] [P] 7.1 撰寫 key-store.ts 單元測試：加密/解密往返、不同機器解密失敗、key 不存在回傳 null，對應 API Key encrypted storage [Tool: sonnet]
- [x] [P] 7.2 撰寫 verify-openai route 單元測試：valid key、invalid key、timeout，mock OpenAI API，對應 API Key verification endpoint [Tool: sonnet]
- [x] [P] 7.3 撰寫 generate-icons.ts 單元測試：PNG 不存在時 exit 1、尺寸錯誤時 exit 1，對應 App icon asset generation [Tool: sonnet]

## 8. electron-builder icon 驗證

- [x] 8.1 執行 electron-builder --dir（不打包 installer）確認 icon 正確嵌入 .app bundle，對應 electron-builder icon resolution scenario [Tool: copilot-codex]

## 9. Code Review

- [x] 9.1 Kimi CLI Code Review：全部新增/修改檔案，確認加密邏輯、API 驗證、icon 設定無 Critical [Tool: kimi-cli]
