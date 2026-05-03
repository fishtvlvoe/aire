## 1. Wave 1：核心模組與資料層（可並行）

- [x] [P] 1.1 新建 `src/lib/document-generator/tax-calculator.ts`，export `calculateTaxFees(input: { sale_price?: number; house_assessed_value?: number }): TaxResult`。TaxResult 包含：`deed_tax: number|null`（= house_assessed_value × 0.06），`stamp_tax_buyer: number|null`（= sale_price × 0.0005）、`stamp_tax_seller: number|null`（同上），`registration_fee: number|null`（= sale_price × 0.001），`escrow_fee_each: number|null`（= sale_price × 0.0006 / 2）。任一輸入為空/NaN 則對應欄位為 null。同步撰寫 `src/lib/document-generator/__tests__/tax-calculator.test.ts`，涵蓋：全輸入、缺 sale_price、缺 house_assessed_value、兩者皆缺 4 個情境。[Tool: sonnet]
- [x] [P] 1.2 修改 `src/lib/schemas/supplementary-schema.ts`，新增 4 組 optional string 欄位：身份資訊（company_name, property_name, case_number, agent_name, agent_phone），交易資訊（sale_price_text, transaction_type, deed_fee_split, other_terms），建物補充（ancillary_building_area, common_area_ping, land_use_zone, announced_land_value），周遭機能（school_distance, park_distance, transport_description, shopping_description）。所有欄位為 `z.string().optional()`，不影響現有必填驗證。[Tool: copilot]
- [x] [P] 1.3 修改 `src/lib/document-generator/pdf/dossier-building.ts`，從 LLM system prompt 中移除所有含「老魚」或個人稱謂的句子。在 prompt 中加入指令：「請勿使用任何稱呼或問候語，直接從章節 1 開始輸出內容。」[Tool: copilot]

## 2. Wave 2：補件表單 UI（依賴 Wave 1）

- [x] 2.1 修改 `src/app/listings/[id]/supplementary/page.tsx`，新增 4 個摺疊面板（Accordion）：「身份資訊」、「交易資訊」、「建物補充」、「周遭機能」。每個面板包含對應欄位的 `<input type="text">` 元件，label 使用繁體中文。sale_price_text 顯示「成交價（萬元）」。所有欄位為非必填，不加紅色必填標記。儲存時將新欄位合併入現有 supplementary_data 送出。[Tool: copilot]

## 3. Wave 3：HTML 模板調整（依賴 Wave 1）

- [x] [P] 3.1 在 `src/lib/document-generator/pdf/` 的說明書 HTML 模板中，將所有 `{{待補}}` 或 `待補` 佔位符替換為 `<span data-field-id="[唯一 ID]" class="pdf-blank">______</span>`。field-id 命名規則：`chapter[N]-[field-key]`（例如 `chapter1-case-number`、`chapter5-building-number`、`chapter10-deed-tax`）。同步更新 CSS：`.pdf-blank { border-bottom: 1px solid #333; min-width: 80px; display: inline-block; }`。[Tool: copilot]
- [x] [P] 3.2 修改說明書 HTML 模板封面 header 表格，從 `DocumentGeneratorInput` 帶入：物件名稱（`supplementary_data.property_name`）、案件編號（`supplementary_data.case_number`）、地址（`field_visit_data.address` 或 `extracted_data.address`）、公司名稱（`supplementary_data.company_name`，缺則留 data-field-id span）。移除 `{{COMPANY_NAME}}` 字串。[Tool: copilot]

## 4. Wave 4：AcroForm 覆蓋模組（依賴 Wave 3）

- [x] 4.1 新建 `src/lib/document-generator/pdf/acroform-overlay.ts`，export `overlayAcroForm(pdfBytes: Uint8Array, fieldMap: FieldCoordMap): Promise<Uint8Array>`。使用 `pdf-lib` 在 pdfBytes 上逐頁疊加 AcroForm text field：每個 field 設定 `PDFTextField`，`fieldName` = fieldId，位置依 FieldCoordMap 的 x/y/width/height/page。AcroForm text field 無邊框（`borderWidth: 0`），字型大小 10pt，中文字體使用 StandardFonts.Helvetica（fallback）。FieldCoordMap 型別：`Record<string, { x: number; y: number; width: number; height: number; page: number }>`。新增 `package.json` 相依：`pdf-lib`（若尚未安裝）。[Tool: sonnet]

## 5. Wave 5：Pipeline 整合（依賴 Wave 3 + Wave 4）

- [x] [P] 5.1 修改 `src/lib/document-generator/pdf/dossier.ts` 中的 `generateDossierPDF()` 函數：在 Puppeteer `page.goto()` 後、`page.pdf()` 前，新增 `page.evaluate()` 呼叫，取得所有 `[data-field-id]` 元素的 `getBoundingClientRect()`，建立 FieldCoordMap（需換算 HTML px → PDF pt，比例 = 72/96）。`page.pdf()` 產生 pdfBytes 後，呼叫 `overlayAcroForm(pdfBytes, coordMap)` 得到最終 pdfBytes。[Tool: sonnet]
- [x] [P] 5.2 修改 `src/lib/document-generator/build-input.ts` 的 `buildDocumentInput()`，新增 tax 計算：從 `supplementary_data.sale_price_text` 解析 `sale_price`（× 10000 還原萬元），從 `supplementary_data.house_assessed_value`（或 `extracted_data.house_assessed_value`）取得房屋現值，呼叫 `calculateTaxFees()` 並將結果附加至 `system_computed`（keys: `computed_deed_tax`、`computed_stamp_tax_buyer`、`computed_stamp_tax_seller`、`computed_registration_fee`、`computed_escrow_fee`）。[Tool: copilot]

## 6. Wave 6：驗收測試（依賴 Wave 5）

- [x] 6.1 新增 `src/lib/document-generator/__tests__/acroform-overlay.test.ts`：用 `pdf-lib` 建立最小 PDF，呼叫 `overlayAcroForm` 傳入 2 個欄位的 coordMap，再用 `pdf-lib` 讀取結果 PDF 確認 AcroForm 欄位數量 = 2、fieldName 正確。[Tool: sonnet]
- [x] 6.2 確認 `npm run build` 通過（0 errors），`npm test` 全綠（含 1.1 tax-calculator、6.1 acroform-overlay 新增測試）。[Tool: copilot]
