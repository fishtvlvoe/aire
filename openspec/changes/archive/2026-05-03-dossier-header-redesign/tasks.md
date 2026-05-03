## 1. HTML 模板重構（dossier.html）

- [ ] 1.1 [P] 在 `src/lib/pdf-generator/templates/dossier.html` 的 H1「不動產說明書」正後方新增 `<p class="dossier-subtitle">{{PROPERTY_NAME}}</p>`，實現 property-name-subtitle 需求 [Tool: copilot-codex]
- [ ] 1.2 [P] 修改 `src/lib/pdf-generator/templates/dossier.html` 的封面 table：移除「地址」列；將「案件編號」欄 th 文字改為「物件編號」；移除公司名稱與地址共行的結構，改為「公司名稱」獨立一列（th + td colspan=3）；將原「負責業務」列替換為無 th 標籤的 3 格並排列（`<td>承辦人：{{CASE_HANDLER}}</td><td>店長：{{SHOP_MANAGER}}</td><td>經紀人：{{AGENT_NAME}}</td>`），實現 cover-table-fields 需求 [Tool: copilot-codex]

## 2. 佔位符替換邏輯（dossier.ts）

- [ ] 2.1 [P] 在 `src/lib/pdf-generator/dossier.ts` 的 `buildFullHtml()` 中新增兩組替換：`result = result.replace('{{CASE_HANDLER}}', caseHandler)` 與 `result = result.replace('{{SHOP_MANAGER}}', shopManager)`；`caseHandler` 取自 `supplementary.case_handler`，缺值時為空字串；`shopManager` 取自 `supplementary.shop_manager`，缺值時為空字串，實現 cover-table-fields 中承辦人/店長欄位需求 [Tool: copilot-codex]
- [ ] 2.2 [P] 在 `src/lib/pdf-generator/dossier.ts` 的 `buildFullHtml()` 中新增 `result = result.replace('{{PROPERTY_NAME_SUBTITLE}}', propertyName || '')` 替換邏輯（或直接複用既有 `propertyName` 變數），確保 subtitle 佔位符被正確替換，實現 property-name-subtitle 需求 [Tool: copilot-codex]

## 3. 視覺驗收

- [ ] 3.1 以含有 property_name、case_number、company_name、case_handler、shop_manager、agent_name 的測試 listing 生成 PDF，截圖確認：(1) 副標題顯示物件名稱；(2) 表格顯示 4 列（物件編號/物件名稱/公司名稱/三格人員）；(3) 無地址列；(4) 三格人員欄位正確顯示承辦人、店長、經紀人 [Tool: sonnet]
