## ADDED Requirements

### Requirement: Real price query SHALL provide dossier-eligible nearby sale data from free sources

系統 SHALL 以免費資料來源提供與地址相關的附近實價登錄行情，供 UI 顯示、案件保存與 dossier / PDF 使用。

#### Scenario: Nearby real price records are shown from free query

- **GIVEN** 使用者輸入台灣地址
- **WHEN** 系統執行 `query_real_price`
- **THEN** 系統 SHALL 回傳與該地址行政區與路名相關的成交資料
- **AND** SHALL 將結果用於 `/cases/new` 與 dossier snapshot

#### Scenario: Real price query returns no records

- **GIVEN** 免費實價登錄查詢沒有命中資料
- **WHEN** 系統完成查詢
- **THEN** 系統 SHALL 顯示空結果語意
- **AND** SHALL NOT 以固定 mock fixture 冒充成交行情
