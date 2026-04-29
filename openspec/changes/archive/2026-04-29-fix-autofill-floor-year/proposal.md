## Problem

上傳謄本 PDF 並完成 OCR 解析後，表單中「已從謄本帶入」badge 正常顯示，但對應欄位值為空：

- **層數（樓）**：所在樓層 / 總樓層 同時顯示 0，badge 存在
- **建築完成年份（民國）**：輸入框空白，badge 存在
- **結構**：同類問題（視謄本格式而定）

## Root Cause

**Bug 1 — floor_count 複合欄位 key 不符**

`src/lib/ocr/field-mapping.ts` 將 OCR key `stories`（謄本總樓層）映射到 `floor_count`。
但 `FieldVisitForm` 的複合欄位 `floor_count` 實際讀取 `form.floor_current`（所在樓層）與
`form.floor_total`（總樓層）兩個子 key。OCR 預填邏輯寫入 `form.floor_count`（幽靈 key），
渲染時永遠讀不到 → 欄位顯示 0/0，badge 卻存在。

**Bug 2 — completion_date 格式與 year_built 欄位不符**

`building-parser.ts` 呼叫 `normalizeDate()` 將謄本日期（如「民國90年6月30日」）轉成
西元 ISO 字串（"2001-06-30"）。`year_built` 欄位是 `type="number"` input，
瀏覽器無法顯示非數字字串 → 渲染為空白。
若謄本日期缺少「日」欄位，`normalizeDate()` 返回 null，
`makeField()` fallback 使用 rawValue（如「民國90年6月」），同樣是非數字字串。

## Proposed Solution

1. **`src/lib/ocr/field-mapping.ts`**：將 `stories` 映射目標從 `floor_count` 改為 `floor_total`，
   使 OCR 預填邏輯直接寫入正確的子 key。

2. **`src/lib/ocr/normalize.ts`**：新增 `normalizeRocYear(raw)` 純函式，
   從民國日期字串中萃取民國整數年份（如 "民國79年6月15日" → 79）。

3. **`src/lib/ocr/parsers/building-parser.ts`**：`completion_date` 改用 `normalizeRocYear`
   取代 `normalizeDate`，確保寫入 DB 的值為整數，符合 `type="number"` 的期望格式。

4. **`src/components/forms/FieldVisitForm.tsx`**：`floor_count` 複合欄位的 provenance badge
   改查 `mergedFields?.floor_total ?? mergedFields?.floor_current`，
   確保 badge 與實際填入的子 key 同步。

## Non-Goals

- 不處理「所在樓層（floor_current）」的 OCR 填入（謄本不含此資訊，需人工輸入）
- 不修改 `normalizeDate()` 函式本身（仍用於其他需要西元日期的欄位）
- 不處理其他欄位的 badge/fill 一致性問題（超出本 change 範圍）

## Success Criteria

- 上傳含「層數」資訊的謄本後，總樓層（`floor_total`）輸入框正確顯示數值（如 14）
- 上傳含「建築完成日期」的謄本後，年份欄位正確顯示民國整數年（如 79）
- 「已從謄本帶入」badge 在有值時顯示，badge 消失時值同步為空（前後一致）
- 396 個 unit tests 全數通過，無新增迴歸

## Impact

- Affected specs: pre-listing-data-collection（OCR 欄位映射）、field-visit-form（表單預填行為）
- Affected code:
  - Modified: src/lib/ocr/field-mapping.ts
  - Modified: src/lib/ocr/normalize.ts
  - Modified: src/lib/ocr/parsers/building-parser.ts
  - Modified: src/components/forms/FieldVisitForm.tsx
  - Modified: src/lib/ocr/__tests__/normalize.test.ts
  - Modified: src/lib/ocr/__tests__/building-parser.test.ts
  - Modified: src/lib/ocr/__tests__/e2e-autofill.spec.ts
