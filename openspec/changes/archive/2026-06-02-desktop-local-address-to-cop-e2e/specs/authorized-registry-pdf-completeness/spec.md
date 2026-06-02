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

#### Scenario: Formal pull returns a different doorplate than the case address

- **GIVEN** 案件地址已保存為使用者輸入的門牌
- **AND** 使用者以已確認候選執行正式地政查詢
- **WHEN** formal COP 回傳的建物門牌與案件地址門牌不一致
- **THEN** 系統 SHALL 顯示地政查詢失敗原因與實際扣款資訊
- **AND** SHALL NOT 將該次正式資料寫入 trusted PDF data
- **AND** 使用者 SHALL 能回到候選確認入口重新查詢便民系統候選

### Requirement: Formal ownership and other-right data SHALL be post-signing supplement data

The system SHALL reserve formal ownership, other-right, mortgage, and electronic transcript data for the post-signing supplement stage. Pre-signing PDFs SHALL show those sections as pending formal supplement items when they are needed, and SHALL NOT claim they were queried or trusted unless the post-signing formal query succeeded.

#### Scenario: Pre-signing PDF omits trusted ownership data

- **GIVEN** a case has only free pre-survey data
- **WHEN** the user exports a pre-signing PDF
- **THEN** the PDF SHALL NOT mark ownership, other-right, mortgage, or electronic transcript data as trusted
- **AND** the PDF SHALL label those sections as requiring post-signing formal supplement when needed

#### Scenario: Signed case imports formal transcript data

- **GIVEN** a case has entered the signed supplement stage
- **AND** the user confirms a paid formal transcript query
- **WHEN** the formal query succeeds
- **THEN** the system SHALL save returned ownership and other-right data as trusted formal data
- **AND** the PDF SHALL prefer that trusted formal data over pre-survey reference data
