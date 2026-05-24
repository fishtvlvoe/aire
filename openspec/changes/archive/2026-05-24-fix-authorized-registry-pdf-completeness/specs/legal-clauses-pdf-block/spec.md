## ADDED Requirements

### Requirement: Legal clauses PDF block SHALL render the complete configured legal set

法規告知 PDF 區塊 SHALL 使用目前 legal clauses source of truth 的完整法規集合，不得只輸出少量 hardcoded 條文而無缺漏警示。

#### Scenario: Legal clauses are synced

- **GIVEN** 本地 legal clauses cache 有完整法規集合
- **WHEN** PDF 匯出
- **THEN** 法規告知頁 SHALL 顯示完整集合
- **AND** PDF SHALL 顯示法規版本或同步日期

#### Scenario: Legal clauses are incomplete

- **GIVEN** 法規同步失敗或本地 cache 不完整
- **WHEN** PDF 匯出
- **THEN** PDF SHALL 顯示缺漏或待同步狀態
- **AND** 系統 SHALL NOT 默默只輸出部分法規
