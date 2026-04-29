## Problem

謄本上傳後，「持分/單獨所有」badge 從未出現；「所在樓層」欄位雖有謄本資料但永遠空白。

## Root Cause

**RC-1：語義錯誤映射**
`field-mapping.ts` 將 `owner_name` 和 `building_owner_name` 映射到 `ownership_scope`。人名（如「林＊＊」）不是持分類型（"單獨所有"/"持分共有"），即使 badge 出現，select 也無法匹配選項而顯示空白。

**RC-2：分數字串型別不符**
`rights_range` 產出 `"1/1"` 或 `"91/10000"` 等分數字串，映射後寫入 `ownership_scope`，但 select 期望 `"單獨所有"` 或 `"持分共有"`，導致欄位渲染為空。

**RC-3：所在樓層未提取**
`building-parser.ts` 的建物標示部未提取「層次：N層」欄位，`floor_current` 永遠不存在於 `merged_fields`，badge 和值均不出現。

## Proposed Solution

1. 新增 `normalizeOwnershipScope(raw)` 純函式：
   - `"全部"` 獨立出現 → `"單獨所有"`
   - `normalizeRightsRange(raw) === "1/1"` → `"單獨所有"`
   - 其他分數 → `"持分共有"`
   - 無法識別 → `null`

2. Land/building parser 在提取 `rights_range` 後，額外用 `normalizeOwnershipScope` 推導 `ownership_scope`（confidence 0.95），直接存入欄位（不再依賴 field-mapping 轉換）。

3. `field-mapping.ts` 移除：`owner_name → ownership_scope`、`rights_range → ownership_scope`、`building_owner_name → ownership_scope`、`building_rights_range → ownership_scope`。

4. `building-parser.ts` 建物標示部加入：`/層\s*次[：:]\s*(\d+)\s*層?/` → `floor_current`。

## Success Criteria

- 謄本 `1分之1`（全部所有）→ `ownership_scope.value === "單獨所有"`，badge 出現，select 自動選中
- 謄本 `10000分之91`（持分）→ `ownership_scope.value === "持分共有"`，badge 出現，select 自動選中
- 謄本「層次：3層」→ `floor_current.value === 3`，所在樓層欄位顯示 3
- 407 tests 全通過，無 regression

## Impact

- Affected code:
  - Modified: src/lib/ocr/normalize.ts
  - Modified: src/lib/ocr/field-mapping.ts
  - Modified: src/lib/ocr/parsers/land-parser.ts
  - Modified: src/lib/ocr/parsers/building-parser.ts
  - Modified: src/lib/ocr/__tests__/normalize.test.ts
  - Modified: src/lib/ocr/__tests__/land-parser.test.ts
  - Modified: src/lib/ocr/__tests__/building-parser.test.ts
  - Modified: src/lib/ocr/__tests__/e2e-autofill.spec.ts
