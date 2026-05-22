## ADDED Requirements

### Requirement: Settings SHALL separate personal, registry authorization, and plan upgrade

設定頁 SHALL 分離個人設定、地政授權、方案升級與開發中功能，不得在資料來源或工作頁顯示設定內容。

#### Scenario: User opens settings page

- **GIVEN** 使用者進入設定相關頁面
- **WHEN** 頁面載入
- **THEN** 個人資料、密碼、品牌色、地政授權與方案升級 SHALL 各自位於清楚分區
- **AND** 開發中功能 SHALL 顯示目前正在開發中
