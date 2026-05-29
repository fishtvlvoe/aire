## ADDED Requirements

### Requirement: Dossier assembly SHALL include confirmed address-first land values and real price

系統 SHALL 在 dossier assembly 時，將地址優先流程確認的土地面積、公告現值、公告地價，以及實價登錄資料帶入 PDF 可用資料快照。

#### Scenario: Formal COP exists and reference fields also exist

- **GIVEN** 案件同時有 formal COP trusted data 與 confirmed address-first reference values
- **WHEN** 系統組裝 dossier data
- **THEN** 正式地政欄位 SHALL 優先使用 trusted COP data
- **AND** `land_area_sqm`, `announced_land_current_value`, `announced_land_value` 若 formal data 無對應值，可退回使用 confirmed reference values
- **AND** 每個退回值 SHALL 保留 provenance

#### Scenario: Real price query succeeds

- **GIVEN** `query_real_price` 回傳成交資料
- **WHEN** 系統組裝 dossier data
- **THEN** dossier snapshot SHALL 包含 recent sale records 或其統計摘要
- **AND** PDF 相關頁面 SHALL 可讀取這些資料

#### Scenario: Real price query returns empty

- **GIVEN** `query_real_price` 回傳空陣列
- **WHEN** 系統組裝 dossier data
- **THEN** dossier assembly SHALL 成功完成
- **AND** PDF SHALL 顯示空結果語意，而非崩潰或誤植舊資料
