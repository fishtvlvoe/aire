## Context

P1-b（dossier-missing-pages）已完成：
- `src/lib/tax-calculator.ts` 匯出 `stampTax`/`deedTax`/`buildingTax`/`landPriceTax` 純函式
- `DossierPage7FeeTable` 元件接收 `TaxInputs` 並顯示費用
- `DisclosureHtmlPreview` 接受 `taxInputs?: TaxInputs` prop（undefined 顯示「—」）
- `disclosure-form-residential` 稅費 tab 已有 `transaction_price`/`transfer_date`/`usage_type` 欄位

目前缺口：`KeyinSplitPage.tsx` 把 `formState` 傳給 `DisclosureHtmlPreview`，但 `taxInputs` 固定 undefined，費用頁永遠顯示「—」。

## Goals / Non-Goals

**Goals:**
- `KeyinSplitPage.tsx` 新增 `formStateToTaxInputs` 純函式，將 formState 轉為 `TaxInputs | undefined`
- 用 `useMemo` 監聽 formState 變化，即時更新 taxInputs 傳入 DisclosureHtmlPreview
- 任一必要欄位（contractPrice / officialLandValue / buildingCurrentValue）= 0 → 回傳 undefined

**Non-Goals:**
- 不修改 tax-calculator.ts 計算邏輯
- 不修改 DossierPage7FeeTable 渲染邏輯
- 不加 debounce（formState 已由 react-hook-form onChange 控制頻率）
- 不處理 disclosure-form-land.tsx（土地表單另行處理）

## Decisions

### formStateToTaxInputs 映射規則

```typescript
function formStateToTaxInputs(
  formState: Record<string, unknown>
): TaxInputs | undefined {
  const contractPrice = Number(formState.transaction_price ?? 0);
  const officialLandValue = Number(formState.tax_land_value ?? 0);
  const buildingCurrentValue = Number(formState.tax_building_value ?? 0);
  if (contractPrice === 0 || officialLandValue === 0 || buildingCurrentValue === 0) {
    return undefined;
  }
  return {
    contractPrice,
    officialLandValue,
    shareRatio: Number(formState.share_ratio ?? 1),
    buildingCurrentValue,
    transactionDate: String(formState.transfer_date ?? ""),
    usage: (formState.usage_type === "commercial" ? "commercial" : "residential"),
  };
}
```

### useMemo 依賴

`taxInputs` 由 `useMemo(() => formStateToTaxInputs(formState), [formState])` 產生，formState 已由 react-hook-form form.watch() 控制，每次欄位變更都會觸發重算。

## Implementation Contract

### C1: `formStateToTaxInputs` 函式

| 輸入 | 輸出 |
|------|------|
| `{transaction_price: 1000000, tax_land_value: 800000, tax_building_value: 200000, usage_type: "residential", transfer_date: "2024-01-01"}` | `TaxInputs { contractPrice: 1000000, officialLandValue: 800000, ... }` |
| `{transaction_price: 0, tax_land_value: 800000, tax_building_value: 200000}` | `undefined` |
| `{transaction_price: 1000000, tax_land_value: 0, tax_building_value: 200000}` | `undefined` |

### C2: `KeyinSplitPage` integration

- `taxInputs = useMemo(() => formStateToTaxInputs(formState), [formState])`
- `<DisclosureHtmlPreview formState={formState} propertyType={propertyType} taxInputs={taxInputs} />`
- 驗收：render 含有效 formState 後 `data-testid="fee-stamp-tax"` 顯示 1800
