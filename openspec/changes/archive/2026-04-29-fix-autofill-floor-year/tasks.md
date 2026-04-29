## 1. OCR Field Key Mapping Fix

- [x] 1.1 修改 `src/lib/ocr/field-mapping.ts`：將 `OCR_TO_FORM_KEY['stories']` 從 `'floor_count'` 改為 `'floor_total'`（OCR Field Key Mapping）[Tool: copilot-codex]
- [x] 1.2 更新 `src/lib/ocr/__tests__/e2e-autofill.spec.ts`：所有 `floor_count` 參照改為 `floor_total`（OCR Prefill — Compound Field Sub-Key Fill 驗證）[Tool: copilot-codex]

## 2. OCR Value Normalization for year_built

- [x] 2.1 新增 `normalizeRocYear(raw: string): number | null` 函式至 `src/lib/ocr/normalize.ts`（OCR Value Normalization for year_built）[Tool: copilot-codex]
- [x] 2.2 修改 `src/lib/ocr/parsers/building-parser.ts`：匯入 `normalizeRocYear`，`completion_date` 解析改用 `normalizeRocYear` [Tool: copilot-codex]
- [x] 2.3 更新 `src/lib/ocr/__tests__/normalize.test.ts`：新增 `normalizeRocYear` 測試，覆蓋完整年份、年月、省略前綴、無效輸入 [Tool: copilot-codex]
- [x] 2.4 更新 `src/lib/ocr/__tests__/building-parser.test.ts`：`completion_date.value` 期望值改為 `90`（整數）[Tool: copilot-codex]

## 3. Provenance Badge for Compound Floor Field

- [x] 3.1 修改 `src/components/forms/FieldVisitForm.tsx`：`floor_count` 欄位的 `fieldProvenance` 改查 `mergedFields?.floor_total ?? mergedFields?.floor_current`（Provenance Badge for Compound Floor Field）[Tool: copilot-codex]

## 4. Verification

- [x] 4.1 確認 commit `fix(autofill): 謄本帶入樓層/建築年份欄位未更新` 已存在，git log 可見 [Tool: copilot-codex]
