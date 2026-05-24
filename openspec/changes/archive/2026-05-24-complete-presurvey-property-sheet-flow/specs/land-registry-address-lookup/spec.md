## ADDED Requirements

### Requirement: Land registry lookup SHALL return usable pre-survey status

地政地址查詢 SHALL 回傳物調表可使用的資料狀態、來源與費用資訊，且失敗時不得阻塞案件建立。

#### Scenario: Lookup partially succeeds

- **GIVEN** 地址查詢取得部分土地或建物線索
- **WHEN** 系統建立案件
- **THEN** 取得資料 SHALL 標示為已帶入或待確認
- **AND** 未取得資料 SHALL 標示為需補件或查詢失敗
