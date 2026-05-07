## ADDED Requirements

### Requirement: 一鍵啟動流程

Electron 主程序 SHALL 管理完整的應用啟動生命週期：啟動 Next.js server → 等待就緒 → 開啟視窗 → 關閉視窗時清理 server。

#### Scenario: 正常啟動

- **WHEN** 用戶雙擊 app icon
- **THEN** 顯示啟動畫面（splash）→ 背景啟動 Next.js server → server ready 後顯示主視窗 → 隱藏 splash

##### Example: 首次啟動完整流程

- **GIVEN** 用戶剛安裝完「不動產 AI 系統.app」，首次雙擊開啟
- **WHEN** Electron 主程序啟動
- **THEN** 顯示 splash 畫面（品牌 logo + 載入指示器）→ 背景 spawn server.js on port 3000 → HTTP GET localhost:3000 回 200 → 建立 BrowserWindow 載入頁面 → 隱藏 splash（總耗時約 3-8 秒）

#### Scenario: 啟動失敗

- **WHEN** Next.js server 無法在 30 秒內啟動
- **THEN** 顯示錯誤對話框「系統啟動失敗，請聯繫技術支援」並提供「重試」和「退出」按鈕

#### Scenario: 應用關閉

- **WHEN** 用戶關閉最後一個視窗（macOS 按 ⌘Q，Windows 按右上角 X）
- **THEN** Electron 主程序終止 Next.js server 子程序 → 退出 app

##### Example: macOS 關閉流程

- **GIVEN** app 正在執行，Next.js server 跑在 port 3000
- **WHEN** 用戶按 ⌘Q
- **THEN** Electron 送 SIGTERM 給 server.js 子程序 → 等待最多 5 秒 → 子程序結束 → app.quit() → port 3000 釋放

### Requirement: 開發模式快速啟動

開發時 SHALL 支援 `npm run dev:electron` 同時啟動 Next.js dev server 和 Electron 視窗，支援 Hot Reload。

#### Scenario: 開發模式

- **WHEN** 開發者執行 `npm run dev:electron`
- **THEN** 啟動 `next dev` + Electron 連接 `localhost:3000`，代碼修改後頁面自動刷新
