## ADDED Requirements

### Requirement: Nationwide free pre-survey SHALL remain available before any paid formal query

系統 SHALL 在全台地址輸入流程中，先提供免費前查能力，包括地址候選、附近實價登錄與免費可得的補齊欄位，且在使用者未明確選擇付費正式查詢前不得產生成本。

#### Scenario: Free pre-survey runs before paid formal query

- **GIVEN** 使用者在 `/cases/new` 輸入任一台灣地址
- **WHEN** 系統執行地址前查
- **THEN** 系統 SHALL 先顯示免費可得的候選資料與附近實價登錄
- **AND** SHALL NOT 自動觸發付費正式查詢

#### Scenario: User saves case using only free pre-survey data

- **GIVEN** 使用者已確認候選物件，但不打算執行付費正式查詢
- **WHEN** 使用者保存案件或進入預覽
- **THEN** 系統 SHALL 允許以免費前查資料繼續流程
- **AND** SHALL 將資料標示為 reference / pre-survey，而非 trusted COP
