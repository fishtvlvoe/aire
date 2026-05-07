## ADDED Requirements

### Requirement: 啟動時自動檢查更新

Electron app SHALL 在每次啟動時自動檢查是否有新版本。

#### Scenario: 發現新版本

- **WHEN** app 啟動且 License Server 回報有更新可用
- **THEN** 顯示通知「發現新版本 v{version}，要更新嗎？」，提供「立即更新」和「稍後提醒」按鈕

##### Example: 從 0.1.0 更新到 0.2.0

- **GIVEN** 客戶端版本 0.1.0，License Server 最新版本 0.2.0
- **WHEN** app 啟動，呼叫 POST /api/license/check-update 帶 currentVersion: "0.1.0"
- **THEN** Server 回 { available: true, version: "0.2.0", downloadUrl: "https://r2.example.com/...", sha256: "abc123..." } → app 顯示通知「發現新版本 v0.2.0，要更新嗎？」

#### Scenario: 已是最新版

- **WHEN** app 啟動且無新版本
- **THEN** 靜默通過，不顯示任何通知

##### Example: 版本相同

- **GIVEN** 客戶端版本 0.2.0，License Server 最新版本 0.2.0
- **WHEN** app 啟動，呼叫 POST /api/license/check-update 帶 currentVersion: "0.2.0"
- **THEN** Server 回 { available: false } → app 不顯示任何通知，正常進入主畫面

#### Scenario: 檢查失敗（網路問題）

- **WHEN** 無法連線到 License Server
- **THEN** 靜默通過，不阻擋使用，下次啟動再檢查

##### Example: 離線啟動

- **GIVEN** 客戶電腦未連接網路
- **WHEN** app 啟動，HTTP 請求 timeout（5 秒）
- **THEN** 記錄 log「更新檢查失敗：網路無法連線」→ 正常載入主畫面，不顯示錯誤

### Requirement: 手動檢查更新

系統 SHALL 提供「檢查更新」按鈕，用戶可主動檢查。

#### Scenario: 手動檢查無更新

- **WHEN** 用戶點擊「檢查更新」且已是最新版
- **THEN** 顯示「已是最新版本 v{currentVersion}」

##### Example: 手動確認已是最新

- **GIVEN** 客戶端版本 0.2.0，Server 最新也是 0.2.0
- **WHEN** 用戶在設定頁點擊「檢查更新」按鈕
- **THEN** 顯示 toast 訊息「已是最新版本 v0.2.0」，3 秒後自動消失

### Requirement: 一鍵下載安裝

更新過程 SHALL 顯示下載進度並自動安裝。

#### Scenario: 正常更新流程

- **WHEN** 用戶點擊「立即更新」
- **THEN** 顯示下載進度條 → 下載完成後驗證 SHA-256 → 安裝 → 重啟 app

#### Scenario: 下載失敗

- **WHEN** 下載過程中網路中斷
- **THEN** 顯示「更新下載失敗，請檢查網路連線」並提供「重試」按鈕

##### Example: 下載中斷重試

- **GIVEN** 用戶點擊「立即更新」，開始下載 150MB 更新檔
- **WHEN** 下載到 60% 時網路中斷
- **THEN** 進度條停止 → 3 秒後顯示「更新下載失敗，請檢查網路連線」+ 「重試」按鈕 → 用戶點重試後從頭下載

#### Scenario: 雜湊驗證失敗

- **WHEN** 下載完成但 SHA-256 不匹配
- **THEN** 刪除已下載檔案，顯示「更新檔案損毀，請重試」

### Requirement: 更新檔存放

更新檔 SHALL 存放在 Cloudflare R2，透過 License Server 的簽署 URL 存取。

#### Scenario: 未授權下載

- **WHEN** 無有效授權的客戶端嘗試下載更新檔
- **THEN** License Server 不回傳下載 URL，回傳 HTTP 403
