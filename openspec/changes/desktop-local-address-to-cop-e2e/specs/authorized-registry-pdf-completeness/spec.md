## ADDED Requirements

### Requirement: Formal registry pull SHALL use the confirmed registry key from address-first flow

系統 SHALL 僅在案件具備已確認的地段 / 地號 / 建號後，使用該 confirmed registry key 執行正式 COP pull，並把結果作為 PDF trusted source。

#### Scenario: Confirmed key drives formal pull

- **GIVEN** 案件已有 `confirmed_registry_match`
- **WHEN** 使用者執行正式地政查詢或產出客戶 PDF
- **THEN** 系統 SHALL 使用該 confirmed key 執行 formal COP pull
- **AND** 成功結果 SHALL 以 trusted registry data 保存
- **AND** PDF SHALL 以 trusted data 為正式欄位來源

#### Scenario: Missing confirmed key blocks formal pull

- **GIVEN** 案件尚未確認地段 / 地號 / 建號
- **WHEN** 使用者嘗試正式地政查詢或產出客戶 PDF
- **THEN** 系統 SHALL 阻止 formal COP pull
- **AND** SHALL NOT 將候選資料當成正式謄本輸出
