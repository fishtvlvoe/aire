## MODIFIED Requirements

### Requirement: Create case flow

新增案件流程 SHALL 以地址建立候選案件，但不得把地址候選資料標記成正式謄本查詢完成。使用者提供屋主姓名並完成授權後，系統 SHALL 提供正式地政查詢路徑。

#### Scenario: Address lookup creates candidate only

- **GIVEN** 使用者在 `/cases/new` 輸入地址與屋主姓名
- **WHEN** 系統完成地址判斷並建立案件
- **THEN** 案件 SHALL 保存地址候選資料
- **AND** 案件 SHALL NOT 保存會阻斷正式 pull 的終局 failed ownership payload
- **AND** 物件審核頁 SHALL 顯示可執行正式地政查詢的狀態
