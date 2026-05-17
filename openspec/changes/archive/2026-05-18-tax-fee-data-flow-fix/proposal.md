## Problem

`test-html-pdf.ts` 的 `taxCalculation` 測試資料使用 `sellerFees`/`buyerFees` 陣列格式，但 `HtmlTaxFee` 元件期望獨立欄位（`landValueIncrementTax`、`stampTax`、`deedTax` 等），導致 PDF 稅費頁所有數值欄位渲染為空白底線「________________」。建物版測試資料完全缺少 `taxCalculation`，稅費頁不會出現。

## Root Cause

1. `scripts/test-html-pdf.ts` 的測試資料結構與 `CaseDossierData.taxCalculation` 型別定義不一致 — 用了 `sellerFees`/`buyerFees` 陣列而非 `landValueIncrementTax`、`deedTax` 等獨立欄位
2. `assemble-dossier-data.ts` 沒有呼叫 `calculateTaxFees()` 將輸入參數轉成 `CaseDossierData.taxCalculation` 格式
3. 建物版測試資料缺少 `taxCalculation` 欄位，PDF 不會產生稅費頁

## Proposed Solution

- 修正 `scripts/test-html-pdf.ts` 的測試資料，使用符合 `CaseDossierData.taxCalculation` 型別定義的獨立欄位格式
- 在 `assemble-dossier-data.ts` 中呼叫 `calculateTaxFees()` 將 supplementary_data 的輸入轉成正確的 taxCalculation 結構
- 補上建物版測試資料的 taxCalculation 欄位
- 驗證 PDF 輸出：稅費頁顯示正確的 NT$ 金額

## Non-Goals

- 不修改 `CaseDossierData.taxCalculation` 型別定義
- 不修改 `HtmlTaxFee` 元件的渲染邏輯
- 不新增稅種或調整稅率公式
- 不實作從 UI 輸入觸發稅費計算的互動流程

## Success Criteria

- `npx tsx scripts/test-html-pdf.ts` 產出的土地版和建物版 PDF 均包含稅費頁
- 稅費頁的「叁、土地增值稅概算表」顯示一般稅率和優惠稅率的 NT$ 金額（非底線）
- 稅費頁的「貳、費用一覽表」賣方費用和買方費用各項目顯示正確金額
- `assemble-dossier-data.ts` 在有 sale_price 和 house_assessed_value 時自動呼叫 calculateTaxFees() 填入 taxCalculation

## Impact

- Affected specs: `tax-fee-auto-calculation`（修改：補強 assemble 階段的自動計算觸發條件）
- Affected code:
  - Modified: `scripts/test-html-pdf.ts`、`src/lib/pdf-engine/assemble-dossier-data.ts`
  - New: 無
  - Removed: 無
- Dependencies 新增: 無
- 環境變數新增: 無
