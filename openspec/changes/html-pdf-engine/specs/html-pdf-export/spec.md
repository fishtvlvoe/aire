## ADDED Requirements

### Requirement: 開發環境 Playwright PDF 匯出

系統 SHALL 提供 `exportPdfFromHtml(html, outputPath)` 非同步函式，在開發/CI 環境使用 Playwright chromium 將 HTML 轉為 PDF 並寫入指定路徑。

#### Scenario: 正常匯出

- **WHEN** 傳入有效 HTML 字串和輸出路徑
- **THEN** 產出 A4 格式 PDF 檔案到指定路徑
- **THEN** PDF 檔案大小 > 0 bytes

#### Scenario: Playwright 未安裝

- **WHEN** 環境中未安裝 Playwright chromium binary
- **THEN** 拋出 PdfExportError，code 為 "BROWSER_NOT_FOUND"

#### Scenario: 磁碟空間不足

- **WHEN** 輸出路徑所在磁碟空間不足
- **THEN** 拋出 PdfExportError，code 為 "DISK_FULL"

### Requirement: 生產環境 Tauri WebView 列印

系統 SHALL 在 Tauri App 環境中使用 WebView 的列印功能產出 PDF，不依賴 Playwright。前端觸發 `window.print()` 或 Tauri plugin API。

#### Scenario: Tauri 環境匯出

- **WHEN** 用戶在 Tauri App 內點選「匯出 PDF」按鈕
- **THEN** 系統透過 WebView print 機制產出 PDF 到用戶指定路徑
- **THEN** 不彈出系統列印對話（靜默輸出），或如無法靜默則 fallback 到系統列印對話

### Requirement: 匯出環境自動偵測

系統 SHALL 自動偵測執行環境（Tauri App vs Node.js/CI），選擇對應的匯出策略。偵測依據為 `window.__TAURI__` 是否存在。

#### Scenario: Tauri 環境偵測

- **WHEN** `window.__TAURI__` 存在
- **THEN** 使用 Tauri WebView print 策略

#### Scenario: Node.js 環境偵測

- **WHEN** 在 Node.js 環境執行（無 window 物件）
- **THEN** 使用 Playwright 策略
