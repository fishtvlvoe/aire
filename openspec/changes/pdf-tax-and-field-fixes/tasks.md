## 1. 申報地價解析（transcript-parser.ts）

- [x] 1.1 [P] 依「申報地價 regex 擴充」設計決策，在 `src/lib/parsers/transcript-parser.ts` 的 `findFirstNumberNear()` 呼叫中為 `announced_land_price` 新增 `/申報地價/` 與 `/當期申報地價/` 兩個 keyword regex，實現 announced-land-price-parsing 需求 [Tool: copilot-codex]
- [x] 1.2 [P] 在 `src/lib/parsers/__tests__/transcript-parser.test.ts` 新增單元測試：輸入含「當期申報地價：115年01月10,188.0元／平方公尺」→ `announced_land_price` 等於 10188；缺此字串時為 undefined，驗證 announced-land-price-parsing 需求 [Tool: copilot-codex]

## 2. 土地增值稅同步試算（tax-calculator.ts + build-input.ts）

- [x] 2.1 [P] 依「土地增值稅同步試算加入 document-generator/tax-calculator.ts」設計決策，在 `src/lib/document-generator/tax-calculator.ts` 新增同步函式 `calculateLandValueIncrement(input: { previous_transfer_value?: number }): { general: number; selfUse: number } | null`；公式：general = previous_transfer_value × 0.1，selfUse × 0.08；任一缺值或 NaN 回傳 null，實現 land-value-increment-approximation 需求 [Tool: copilot-codex]
- [x] 2.2 [P] 在 `src/lib/document-generator/build-input.ts` 的 `computeSystemComputed()` 呼叫 `calculateLandValueIncrement()`，結果存入 `computed_land_increment_general_approx` 與 `computed_land_increment_self_use_approx`；任一缺值則兩欄均省略（不寫入 null）[Tool: copilot-codex]
- [x] 2.3 在 `src/lib/document-generator/__tests__/tax-calculator.test.ts` 新增測試：前次移轉現值 5000000 → general=500000, selfUse=400000；缺值 → null，覆蓋 null-output-for-missing-inputs 及 land-value-increment-approximation 邊界條件 [Tool: copilot-codex]

## 3. LLM Prompt 全面禁用雜訊文字（dossier-building.ts）

- [x] 3.1 [P] 依「LLM Prompt 全面禁用雜訊文字」設計決策，在 `src/lib/document-generator/pdf/dossier-building.ts` 刪除所有「標注（OCR讀取，請確認）」指示，改為「直接使用值，不加任何來源標注」，實現 no-internal-annotations-in-pdf 需求 [Tool: copilot-codex]
- [x] 3.2 [P] 修改章節 4 prompt 範例格式：禁止輸出 `（英文key：值）` 括號結構，只輸出中文內容本身（例：「交易方式：買賣。」），實現 no-json-key-leak-in-output 需求 [Tool: copilot-codex]
- [x] 3.3 修改章節 7 prompt：「公告現值」改為「公告土地現值（每平方公尺，土地專屬，不含建物評定現值）」，實現 disclosed-land-value-semantics 需求 [Tool: copilot-codex]
- [x] 3.4 修改章節 8 prompt：無資料欄位的「狀態」與「備註」欄留空，禁止填入「資料不足」或任何說明文字，實現 no-internal-annotations-in-pdf 章節 8 部分 [Tool: copilot-codex]
- [x] 3.5 修改章節 10 prompt：明確引用 system_computed 欄位名稱（computed_deed_tax、computed_stamp_tax_buyer、computed_stamp_tax_seller、computed_registration_fee、computed_escrow_fee_each）；無值時儲存格完全留空，禁止任何說明文字，實現 null-output-for-missing-inputs 及 no-internal-annotations-in-pdf 需求 [Tool: copilot-codex]
- [x] 3.6 修改章節 12 prompt：引用 `computed_land_increment_general_approx`（一般稅率）與 `computed_land_increment_self_use_approx`（自用稅率）；有值填入，無值留空；加固定 footnote「以上土地增值稅為試算近似值，以主管機關核定為準」，實現 chapter12-land-increment-display 需求 [Tool: copilot-codex]
- [x] 3.7 修改章節 14 prompt：無具體距離數字時禁止輸出「（距離）」字樣；禁止輸出「（已確認）」等確認標記，實現 no-placeholder-distance-in-chapter14 及 no-confirmed-marker-in-chapter14 需求 [Tool: copilot-codex]

## 4. 封面表格重構（dossier.html + dossier.ts）

- [x] 4.1 [P] 在 `src/lib/pdf-generator/templates/dossier.html` 的 H1「不動產說明書」正後方新增 `<p class="dossier-subtitle">{{PROPERTY_NAME}}</p>`，實現 property-name-subtitle 需求 [Tool: copilot-codex]
- [x] 4.2 [P] 修改 `src/lib/pdf-generator/templates/dossier.html` 封面 table：移除「地址」列；「案件編號」th 改為「物件編號」；公司名稱改為獨立一列（th + td colspan=3）；原「負責業務」列替換為無 th 的 3 格並排列（`<td>承辦人：{{CASE_HANDLER}}</td><td>店長：{{SHOP_MANAGER}}</td><td>經紀人：{{AGENT_NAME}}</td>`），實現 cover-table-fields 需求 [Tool: copilot-codex]
- [x] 4.3 [P] 在 `src/lib/pdf-generator/dossier.ts` 的 `buildFullHtml()` 新增 `{{CASE_HANDLER}}` 與 `{{SHOP_MANAGER}}` 佔位符替換（`supplementary.case_handler` / `supplementary.shop_manager`，缺值為空字串），實現 cover-table-fields 承辦人/店長欄位 [Tool: copilot-codex]

## 5. 端對端驗收

- [ ] 5.1 以含有完整 supplementary_data（sale_price、house_assessed_value、previous_transfer_value、case_handler、shop_manager、agent_name）的測試 listing 生成完整 PDF，截圖確認：(1) 全文無「OCR讀取，請確認」；(2) 章節 4 無英文 key 括號；(3) 章節 8 空白列備註欄空白；(4) 章節 10 契稅顯示金額；(5) 章節 14 無「（距離）」「（已確認）」；(6) 封面顯示正確 4 列結構 [Tool: sonnet]
