## Why

說明書 Key-in 頁面的稅費 tab 已有 transaction_price / transfer_date / usage_type 欄位，但 DisclosureHtmlPreview 的 taxInputs prop 尚未與 formState 連接，費用一覽表永遠顯示「—」。業務填完欄位後看不到即時計算結果，等同功能缺失。

## What Changes

`KeyinSplitPage.tsx` 新增 `formStateToTaxInputs` 純函式，將 formState 的數字/字串欄位轉換為 `TaxInputs`；派生值若任一必要欄位（contractPrice / officialLandValue / buildingCurrentValue）為 0 則回傳 `undefined`（預覽繼續顯示「—」）。轉換結果直接傳入 `DisclosureHtmlPreview` 的 `taxInputs` prop，不需任何按鈕觸發。

## Capabilities

### New Capabilities

- `keyin-tax-inputs-binding`: KeyinSplitPage derives TaxInputs from formState and passes to DisclosureHtmlPreview; fee table auto-updates as user fills 稅費 tab fields

### Modified Capabilities

- `disclosure-html-preview`: receives live-computed taxInputs instead of always-undefined

## Impact

- Affected specs: keyin-tax-inputs-binding (new), disclosure-html-preview (modified)
- Affected code:
  - New: (none)
  - Modified: src/components/KeyinSplitPage.tsx
  - Removed: (none)
