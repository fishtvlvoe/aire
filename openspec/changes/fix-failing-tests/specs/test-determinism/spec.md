## ADDED Requirements

### Requirement: Test suite is deterministic and self-contained

The test suite SHALL pass deterministically without relying on external file fixtures, real-time clock conditions that the test does not control, or implementation behaviour that contradicts test intent.

每個測試 SHALL 滿足以下條件：
- 不依賴測試目錄外的檔案存在性
- 對於依賴時間的 SQL 條件，測試 SHALL 控制 `created_at` 等時間欄位的值（透過 SQL UPDATE 或 mock）以確保條件穩定生效
- 實作行為與測試期望必須一致；當兩者衝突時，必須先確認哪邊正確（透過呼叫鏈分析）再修正

#### Scenario: transcript parser YAML test runs without filesystem fixture

- **WHEN** `npm test` 執行 `transcript-parser.test.ts` 的 YAML 測試
- **THEN** 測試 SHALL 通過，不需要實際的 fixture 檔案
- **AND** `readFile` SHALL 被 mock，回傳內嵌的 YAML 字串

#### Scenario: list-recent filter test controls created_at

- **WHEN** `npm test` 執行 `list-recent.test.ts` 中「過濾 24 小時以前的空 draft」測試
- **THEN** 測試 SHALL 將空 draft 的 `created_at` 設為 25 小時前
- **AND** `executeListRecentListings` SHALL 回傳 3 筆（排除 2 筆空 draft）

#### Scenario: normalizeInitialData skips nested object/array

- **WHEN** `npm test` 執行 `field-visit-form.test.ts` 的「nested object/array 跳過」測試
- **THEN** `normalizeInitialData({ a: { x: 1 }, b: [1,2,3], c: 'ok', d: 0 })` SHALL 回傳 `{ c: 'ok', d: '0' }`
- **AND** 實作 SHALL 對 `typeof value === "object"` 直接 `continue`，不再 `JSON.stringify` 納入

#### Scenario: full test suite passes

- **WHEN** 開發者跑 `npm run test`
- **THEN** 結果 SHALL 為 220/220 測試通過、40/40 檔案通過、0 failures
