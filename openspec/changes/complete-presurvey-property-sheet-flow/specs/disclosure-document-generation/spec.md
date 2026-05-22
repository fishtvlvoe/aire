## ADDED Requirements

### Requirement: Disclosure output SHALL support pre-survey property sheet state

PDF 與預覽 SHALL 支援物調表階段輸出，允許顯示已帶入、待確認、需補件與查詢失敗欄位。

#### Scenario: Pre-survey PDF includes available data

- **GIVEN** 案件已有地政或公開候選資料
- **WHEN** 使用者產出 PDF
- **THEN** PDF SHALL 顯示目前可用資料
- **AND** 尚未確認欄位 SHALL 標示待確認或保留空白框
