## ADDED Requirements

### Requirement: Desktop real price source parity SHALL hold across web, local runtime, and desktop app

系統 SHALL 在 web、local runtime 與 desktop app 上，對同一地址使用一致的地址解析、dataset mapping、排序規則與來源邊界，不得讓不同 runtime 顯示互相矛盾的固定資料。

#### Scenario: Same address uses the same real-price source rules across runtimes

- **GIVEN** 同一地址在 web、local runtime 與 desktop app 被查詢
- **WHEN** 系統執行實價登錄附近行情查詢
- **THEN** 各 runtime SHALL 使用同一套 city / district / keyword 解析與 dataset mapping 規則
- **AND** SHALL 不再退回舊的 mock fixture

#### Scenario: City-specific dataset mapping remains extensible

- **GIVEN** 某城市需要專用 dataset 才能取得較新的成交資料
- **WHEN** 實作 real-price source parity
- **THEN** 系統 SHALL 保留 city-specific dataset mapping 擴充點
- **AND** fallback dataset 仍必須是免費真資料來源
