## ADDED Requirements

### Requirement: Settings SHALL store fixed delivery profile

設定頁 SHALL 提供並持久化 PDF 交付所需的固定全域經紀與公司欄位。這些欄位 SHALL 作為所有案件共用的交付資訊，而不是每個案件重複填寫。

#### Scenario: User saves realtor profile

- **GIVEN** 使用者在設定頁輸入承辦人、經紀人、經紀人證號、不動產經紀業、經紀業證號、公司地址、公司電話
- **WHEN** 使用者儲存設定
- **THEN** 系統 SHALL 持久化所有欄位
- **AND** PDF assembly SHALL 可讀取這些欄位

#### Scenario: User finds fixed delivery profile from system settings

- **GIVEN** 使用者從側邊欄進入系統設定
- **WHEN** 使用者要設定不會隨案件改變的公司與經紀資料
- **THEN** 系統 SHALL 提供清楚的「品牌與交付資訊」或等價入口
- **AND** 欄位 label SHALL 與 PDF label 一致
- **AND** 系統 SHALL NOT 要求使用者在每個案件重複輸入這些固定資料

#### Scenario: Existing saved branding data remains usable

- **GIVEN** 使用者已經保存舊版品牌文字資料
- **WHEN** 系統升級固定交付資訊欄位
- **THEN** 舊資料 SHALL 被相容讀取或遷移
- **AND** PDF SHALL NOT 因欄位命名調整而清空公司/經紀資訊
