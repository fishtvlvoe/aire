## Problem

不動產說明書 PDF 生成時有十個問題：

**LLM 雜訊文字（需移除）：**
1. **章節 4「成交條件」**：LLM 輸出格式出現 `（transaction_type：買賣）`、`（deed_fee_split：雙方各半）` 等 JSON key:value 括號結構，應只輸出中文內容本身。
2. **章節 8「建物現況調查」**：當 field_visit_data 欄位無資料時，LLM 在備註欄填入「資料不足」字樣，應留空白。
3. **章節 10「稅費/規費」**：LLM 自行填入「待系統計算」文字；房屋稅、地價稅無資料時不應出現任何說明文字，應留空。
4. **章節 12「土地增值稅」**：缺值時應整列留空，不出現說明文字。
5. **章節 14「周邊機能」**：無具體距離數字時出現「（距離）」字樣；有已確認地標時出現「（已確認）」標記，均應移除。
6. **全文「OCR讀取，請確認」**：`dossier-building.ts` prompt 指示 LLM 標注來源，導致此內部訊息出現在正式 PDF 中。

**資料計算未接入：**
7. **章節 10 契稅**：`system_computed` 已含 `computed_deed_tax`，但 LLM prompt 未引用該欄位，LLM 無法填入。
8. **章節 12 土地增值稅**：`document-generator/tax-calculator.ts` 尚未實作土地增值稅同步試算，`system_computed` 缺少對應欄位。
9. **申報地價未解析**：謄本 OCR 含「當期申報地價：115年01月10,188.0元／平方公尺」，`transcript-parser.ts` 未解析出 `announced_land_price`。

**封面表格重設計：**
10. **封面資訊表格**：現有表格欄位不符業務需求（公司名稱溢出、顯示地址、欄位標籤錯誤、缺乏承辦人/店長角色）；需重構為：物件編號／物件名稱／公司名稱／承辦人+店長+經紀人三格並排，並在 H1 下方加入物件名稱副標題。

## Root Cause

- `dossier-building.ts` prompt 多處使用「資料不足」、「（OCR讀取，請確認）」、「（距離）」、「（已確認）」等文字指示，LLM 照樣輸出至正式 PDF。
- prompt 中章節 4 的範例格式包含 `（英文key：值）` 結構，LLM 依格式輸出。
- `build-input.ts` 的 `computeSystemComputed()` 缺少土地增值稅同步計算，且 prompt 未告知 LLM `computed_deed_tax` 等欄位名稱。
- `transcript-parser.ts` 的 regex 未涵蓋「申報地價」關鍵字。
- `dossier.html` 封面 table 結構過時，`dossier.ts` 缺少承辦人/店長佔位符替換邏輯。

## Proposed Solution

**Step A — 解析申報地價**：在 `src/lib/parsers/transcript-parser.ts` 加入 `/申報地價/`、`/當期申報地價/` regex，存入 `announced_land_price`。

**Step B — 擴充 system_computed**：在 `src/lib/document-generator/build-input.ts` 新增同步土地增值稅試算（general = previous_transfer_value × 0.1；selfUse × 0.08），存入 `computed_land_increment_general_approx` 與 `computed_land_increment_self_use_approx`。

**Step C — 修正 LLM prompt**（`src/lib/document-generator/pdf/dossier-building.ts`）：
- 移除所有「（OCR讀取，請確認）」指示，改為「直接使用值，不加任何來源標注」。
- 章節 4：範例格式改為只輸出中文值，禁止出現 `（英文key：值）` 括號結構。
- 章節 8：無資料時狀態欄和備註欄留空，禁止填入任何說明文字。
- 章節 10：引用 `computed_deed_tax` 等具體欄位名稱；無值時儲存格留空，禁止填說明文字。
- 章節 12：引用 `computed_land_increment_general_approx` / `computed_land_increment_self_use_approx`；缺值留空；加免責footnote。
- 章節 14：無具體距離數字時不輸出「（距離）」；禁止輸出「（已確認）」等確認標記。
- 章節 7：「公告現值」改為「公告土地現值（每平方公尺，土地專屬，不含建物評定現值）」。

**Step D — 封面表格重構**（`src/lib/pdf-generator/templates/dossier.html` + `src/lib/pdf-generator/dossier.ts`）：
- H1 下方新增 `<p class="dossier-subtitle">{{PROPERTY_NAME}}</p>`。
- 封面 table 改為：物件編號 / 物件名稱 / 公司名稱 / 承辦人+店長+經紀人三格並排，移除地址列。
- `buildFullHtml()` 新增 `{{CASE_HANDLER}}` 與 `{{SHOP_MANAGER}}` 佔位符替換（取自 `supplementary_data`，缺值為空字串）。

## Non-Goals

- 不新增房屋稅、地價稅自動計算。
- 不實作補件流程重排。
- 不修改 PDF 頁首頁尾或視覺版型。
- 前次移轉現值為空時不強制業務補填。
- 不新增後台 UI 補填承辦人/店長的入口。

## Success Criteria

1. 章節 4：輸出格式無任何 `（英文key：值）` 括號結構。
2. 章節 8：無資料的列，狀態欄和備註欄均為空白，不出現「資料不足」。
3. 章節 10：契稅顯示計算金額（有值時）；房屋稅、地價稅欄位完全空白，不出現任何說明文字。
4. 章節 12：有試算值時顯示數字；缺值時整列空白，不出現說明文字。
5. 章節 14：無距離數字時不出現「（距離）」；不出現「（已確認）」。
6. PDF 全文不出現「OCR讀取，請確認」字樣。
7. 封面表格：顯示物件編號、物件名稱、公司名稱、承辦人/店長/經紀人三格，H1 下有物件名稱副標題。
8. transcript-parser.ts 測試：「當期申報地價：115年01月10,188.0元／平方公尺」→ announced_land_price = 10188。

## Impact

- Affected code:
  - Modified: src/lib/parsers/transcript-parser.ts
  - Modified: src/lib/document-generator/build-input.ts
  - Modified: src/lib/document-generator/pdf/dossier-building.ts
  - Modified: src/lib/pdf-generator/templates/dossier.html
  - Modified: src/lib/pdf-generator/dossier.ts
  - Modified: src/lib/document-generator/tax-calculator.ts
