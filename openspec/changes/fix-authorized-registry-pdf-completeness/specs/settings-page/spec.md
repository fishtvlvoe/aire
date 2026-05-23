## ADDED Requirements

### Requirement: Settings SHALL store full realtor and company profile

設定頁 SHALL 提供並持久化 PDF 交付所需的經紀與公司欄位。

#### Scenario: User saves realtor profile

- **GIVEN** 使用者在設定頁輸入承辦人、經紀人、經紀人證號、不動產業者、經紀業者編號、公司地址、公司電話
- **WHEN** 使用者儲存設定
- **THEN** 系統 SHALL 持久化所有欄位
- **AND** PDF assembly SHALL 可讀取這些欄位
