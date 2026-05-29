## ADDED Requirements

### Requirement: Paid query consent and cost SHALL be explicit before formal COP runs

系統 SHALL 在使用者執行付費正式查詢前，明確揭露查詢用途、費用與計費風險，且未經確認不得發動 formal COP。

#### Scenario: User sees cost before paid formal query

- **GIVEN** 案件已具備 confirmed registry key
- **WHEN** 使用者點擊正式查詢
- **THEN** 系統 SHALL 顯示本次查詢要取得的資料、預估費用與是否可能失敗仍計費
- **AND** 僅在使用者確認後才可執行付費正式查詢

#### Scenario: User skips paid formal query

- **GIVEN** 使用者不確認付費
- **WHEN** 正式查詢對話框關閉
- **THEN** 系統 SHALL 不執行 formal COP
- **AND** 案件仍可保留免費前查資料繼續後續流程
