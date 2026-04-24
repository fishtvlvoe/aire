## Problem

目前 `npm run test` 有 3 個測試檔共 6 個測試失敗（37/40 檔案通過、214/220 測試通過）：

1. **transcript-parser.test.ts（4 個失敗）**：`parseTranscript()` 的 YAML 格式測試中，`readFile` 嘗試讀取不存在的 fixture 檔案導致拋錯。
2. **list-recent.test.ts（1 個失敗）**：`executeListRecentListings()` 預期回傳 3 筆但得到 5 筆。SQL 條件 `created_at < now - 24h` 在測試環境中永遠為 false（測試資料剛插入），導致空 draft 未被過濾。
3. **field-visit-form.test.ts（1 個失敗）**：`normalizeInitialData()` 的「nested object/array 應跳過」測試失敗。實作用 `JSON.stringify` 將 nested object 納入（回傳 `{a:'{"x":1}', b:'[1,2,3]', c:'ok', d:'0'}`），但測試期望跳過（只回傳 `{c:'ok', d:'0'}`）。

## Root Cause

### transcript-parser（4 failures）
測試呼叫 `parseTranscript(filePath, 'yaml')` 時，函式內部用 `readFile(input, 'utf-8')` 讀取檔案，但測試沒有建立對應的 fixture 檔或 mock `readFile`。

### list-recent（1 failure）
`executeListRecentListings()` 的 SQL WHERE 條件為：
```sql
NOT (status = 'draft' AND field_visit_data IN (NULL, '', '{}') AND created_at < datetime('now', '-24 hours'))
```
測試資料在當下時間插入，`created_at >= now`，導致整個 NOT 條件為 true，5 筆全部回傳。測試期望排除 2 筆空 draft，但時間條件讓排除邏輯失效。

### field-visit-form（1 failure）
實作 (`src/components/forms/FieldVisitForm.tsx` L124-131) 對 `typeof value === "object"` 用 `JSON.stringify(value)` 納入結果。
測試期望跳過 nested object/array。

呼叫鏈分析：實際使用中，`form.layout` / `form.photos` 在寫進 form state 前已經 `JSON.stringify` 過（fill page 的 setForm 邏輯，L451 / L542），存進 DB 是字串、讀回也是字串，傳給 `normalizeInitialData` 時 `typeof` 永遠是 `string` 不會走 object 分支。**實作的 object 分支是 dead code**。

## Proposed Solution

### Fix 1: transcript-parser.test.ts

用 `vi.mock('fs/promises')` mock `readFile`，讓它回傳測試用 YAML 字串（包含建物面積、停車位、竣工日期、擔保債權等欄位）。同時 mock `node:fs/promises` 別名。

### Fix 2: list-recent.test.ts

在測試中插入空 draft 資料時，用 SQL 將 `created_at` 設為 `datetime('now', '-25 hours')`（比 24 小時門檻舊），確保時間條件生效後該 draft 被過濾。

### Fix 3: field-visit-form.test.ts（改實作而非改測試）

將 `src/components/forms/FieldVisitForm.tsx` 的 `normalizeInitialData` 對 nested object/array 直接 `continue` 跳過，移除 `JSON.stringify` 分支（dead code，無呼叫者依賴）。

## Non-Goals

- 不改變業務邏輯（除 normalizeInitialData 移除 dead code 外，無其他實作異動）
- 不新增測試覆蓋率
- 不重構測試結構
- 不修其他既有的 TypeScript 警告或 lint 問題（另外 change 處理）

## Impact

- 影響的 specs：test-determinism（新增）
- 影響的程式碼：
  - Modified: `src/lib/__tests__/parsers/transcript-parser.test.ts`
  - Modified: `src/lib/db/__tests__/list-recent.test.ts`
  - Modified: `src/components/forms/FieldVisitForm.tsx`（normalizeInitialData L124-131）
  - Removed: 無
- 期望結果：`npm run test` 結果為 220/220 通過、40/40 檔案通過、0 failures
