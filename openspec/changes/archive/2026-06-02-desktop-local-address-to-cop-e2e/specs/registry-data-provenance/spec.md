## ADDED Requirements

### Requirement: Extended address-discovery fields SHALL carry provenance before PDF use

系統 SHALL 在 `registry provenance` 與案件保存資料中，記錄地址查詢與正式地政查詢鏈上的延伸欄位來源，至少包含土地面積、公告現值、公告地價與實價登錄。

#### Scenario: Discovery values are stored as reference provenance

- **GIVEN** 地址查詢候選回傳 `land_area_sqm`, `announced_land_current_value`, `announced_land_value`
- **WHEN** 使用者確認或保存候選資料
- **THEN** 系統 SHALL 將這些值保存為 reference provenance
- **AND** SHALL 保留其 source、query status、source run id、cost、cache hit
- **AND** SHALL NOT 將其直接標記為 formal trusted COP data

#### Scenario: Real price records are stored as dossier-eligible provenance

- **GIVEN** 系統成功取得 `query_real_price` 回傳結果
- **WHEN** 案件資料被保存或組裝成 dossier snapshot
- **THEN** 系統 SHALL 保存最近一次實價登錄查詢結果或其摘要
- **AND** SHALL 標示來源為 real-price query
- **AND** SHALL 允許 PDF 使用，但不得冒充地政正式謄本欄位
