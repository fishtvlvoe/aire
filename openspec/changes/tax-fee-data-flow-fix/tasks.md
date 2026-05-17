## 1. 修正測試資料格式

- [ ] 1.1 修正 scripts/test-html-pdf.ts 土地版 taxCalculation：移除 sellerFees/buyerFees 陣列，改用 CaseDossierData.taxCalculation 型別定義的獨立欄位格式（landValueIncrementTax、landValueIncrementTaxPreferential、deedTax、stampTax、registrationFee、scrivenerFee、totalSellerCost、totalBuyerCost、warnings）。土地版不含契稅，deedTax 設為 0。[Tool: copilot]
- [ ] 1.2 補上 scripts/test-html-pdf.ts 建物版 taxCalculation 欄位：建物版需含 deedTax（assessedHouseValue x 6%），其餘欄位依 calculateTaxFees 邏輯填入合理測試值。[Tool: copilot]

## 2. 整合 assemble-dossier-data

- [ ] 2.1 整合 tax-calculation-from-inputs 與 null-output-for-missing-inputs：在 src/lib/pdf-engine/assemble-dossier-data.ts 的 assembleDossierData 函式中，當 supplementary_data 包含 sale_price 或 house_assessed_value 時，import 並呼叫 calculateTaxFees（來自 src/lib/tax-calculator.ts），將回傳值賦給 CaseDossierData.taxCalculation。缺少兩個輸入時 taxCalculation 設為 null。[Tool: copilot]

## 3. PDF 輸出驗證

- [ ] 3.1 執行 npx tsx scripts/test-html-pdf.ts，確認土地版和建物版 PDF 均產生稅費頁，且「叁、土地增值稅概算表」和「貳、費用一覽表」顯示 NT$ 金額而非底線。[Tool: sonnet]
