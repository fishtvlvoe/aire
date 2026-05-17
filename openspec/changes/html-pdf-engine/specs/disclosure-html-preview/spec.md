## MODIFIED Requirements

### Requirement: 案件預覽頁渲染不動產說明書

系統 SHALL 在 `cases/[id]/preview` 路由直接渲染 HTML 版不動產說明書（取代原有的 react-pdf blob URL 預覽）。預覽內容與匯出 PDF 使用同一套 React HTML 元件，確保所見即所得。

#### Scenario: 預覽頁載入

- **WHEN** 用戶導航到案件預覽頁
- **THEN** 頁面在 500ms 內渲染出完整的不動產說明書 HTML
- **THEN** 渲染結果為 A4 比例的多頁排版

#### Scenario: 主題即時切換

- **WHEN** 用戶在預覽頁切換主題
- **THEN** 所有頁面的配色即時更新（不需重新載入）

#### Scenario: 縮放預覽

- **WHEN** 用戶調整預覽縮放比例
- **THEN** HTML 透過 CSS `transform: scale()` 等比例縮放
- **THEN** 文字和圖片不失真

### Requirement: 匯出按鈕觸發 PDF 產出

系統 SHALL 在預覽頁提供「匯出 PDF」按鈕，點擊後呼叫 html-pdf-export 模組的匯出函式，將目前預覽的 HTML 轉為 PDF 並存檔。

#### Scenario: 匯出成功

- **WHEN** 用戶點擊「匯出 PDF」按鈕
- **THEN** 系統產出 PDF 到預設路徑（或用戶選擇路徑）
- **THEN** 顯示成功 toast 通知
- **THEN** 案件狀態更新為 "exported"

#### Scenario: 匯出失敗

- **WHEN** PDF 匯出過程發生錯誤
- **THEN** 顯示錯誤 toast 通知，包含錯誤原因
- **THEN** 案件狀態不變
