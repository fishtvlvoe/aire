## ADDED Requirements

### Requirement: Case management SHALL route each action to one clear destination

案件管理 SHALL 避免案件總覽、物調表、補件清單與 PDF 操作互相重複或導向同一個不明頁面。

#### Scenario: User opens a case action

- **GIVEN** 使用者在案件列表點擊物調表、補件或 PDF 操作
- **WHEN** 頁面切換
- **THEN** 系統 SHALL 開啟對應目的頁
- **AND** 頁面內容 SHALL 只顯示該目的所需功能
