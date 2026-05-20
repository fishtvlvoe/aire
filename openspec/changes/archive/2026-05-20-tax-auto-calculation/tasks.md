## 1. TDD 紅燈測試（依賴：設計文件）

- [x] [P] 1.1 完成「formState-to-tax-inputs-binding」TDD 紅燈：建立 `src/components/__tests__/KeyinSplitPage.taxinputs.test.tsx`，測試 `formStateToTaxInputs` 純函式：(1) 含有效 transaction_price=1000000/tax_land_value=800000/tax_building_value=200000/usage_type="residential"/transfer_date="2024-01-01" → 回傳 TaxInputs{contractPrice:1000000,officialLandValue:800000,shareRatio:1,buildingCurrentValue:200000,transactionDate:"2024-01-01",usage:"residential"}；(2) transaction_price=0 → undefined；(3) tax_land_value=0 → undefined，驗收：npx vitest run KeyinSplitPage.taxinputs 全部失敗
- [x] [P] 1.2 完成「keyin-preview-live-tax-display」TDD 紅燈：建立 `src/components/__tests__/KeyinSplitPage.preview.test.tsx`，mock map-api + useDraftAutosave + loadDraft + Tauri invoke，傳入 formState{transaction_price:1000000,tax_land_value:800000,tax_building_value:200000,usage_type:"residential"}，驗 data-testid="fee-stamp-tax" 含"1800"；再傳空 formState 驗 "—" 文字存在，驗收：npx vitest run KeyinSplitPage.preview 全部失敗

## 2. 實作（依賴：1.1 + 1.2）

- [x] 2.1 完成「formState-to-tax-inputs-binding」+「keyin-preview-live-tax-display」實作：在 `src/components/KeyinSplitPage.tsx` 新增 `formStateToTaxInputs(formState: Record<string, unknown>): TaxInputs | undefined` 純函式（contractPrice=transaction_price, officialLandValue=tax_land_value, buildingCurrentValue=tax_building_value, shareRatio=share_ratio??1, transactionDate=transfer_date??"", usage=usage_type==="commercial"?"commercial":"residential"，三者任一=0回傳undefined），用 useMemo 計算 taxInputs 傳入 DisclosureHtmlPreview，驗收：npx vitest run KeyinSplitPage 全部通過
