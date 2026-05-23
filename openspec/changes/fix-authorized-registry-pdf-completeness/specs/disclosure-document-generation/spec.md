## ADDED Requirements

### Requirement: Disclosure PDF SHALL use trusted registry data when available

PDF 組裝 SHALL 優先使用 trusted `moi_api` 或 manual-confirmed 資料；若只有 candidate，系統 SHALL 嘗試正式 pull 或標示尚未正式查詢。

#### Scenario: Candidate exists but trusted data is absent

- **GIVEN** 案件已有地址候選資料但沒有 trusted registry entries
- **WHEN** 使用者產出客戶 PDF
- **THEN** PDF assembly SHALL NOT 只因 `land_registry_data` 存在而跳過 `land_registry_pull_data`
- **AND** 成功取得的正式資料 SHALL 填入 PDF
- **AND** 無法取得的欄位 SHALL 顯示待補件或查詢失敗原因

### Requirement: Disclosure PDF SHALL include complete configured brand and realtor fields

PDF 封面與簽章欄 SHALL 使用設定頁保存的經紀與公司資訊。

#### Scenario: Brand profile is configured

- **GIVEN** 設定頁已有承辦人、經紀人、經紀人證號、不動產業者、經紀業者編號、公司地址、公司電話
- **WHEN** PDF 匯出
- **THEN** 封面與簽章欄 SHALL 顯示這些欄位
- **AND** 不得只顯示空白 label
