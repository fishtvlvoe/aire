## 1. LLM 文件生成整合（disclosure_document）

- [x] [P] 1.1 [Tool: cursor] 修改 `src/lib/document-generator/codex-provider.ts`：在 `generate()` 中呼叫 `generateBuildingDossier` 或 `generateLandDossier`（依 `isLandType(input.property_type)` 判斷），取代 `'[PDF 由任務 10 實作]'` 佔位符 — Design: AI Prompt：固定 16 章 Markdown 結構；Requirement: Disclosure document prompt accepts structured data inputs
- [x] [P] 1.2 [Tool: cursor] 在 `src/lib/document-generator/pdf/dossier-building.ts` 確認 `runCodex` 呼叫已替換為使用 pluggable LLM adapter（`runLlm` 或 `LlmAdapter.generate`），以支援 gemini/claude-code/ollama 後端 — Design: AI Prompt：固定 16 章 Markdown 結構
- [x] [P] 1.3 [Tool: cursor] 在 `src/lib/document-generator/pdf/dossier-land.ts` 同上替換 LLM 呼叫 — Design: AI Prompt：固定 16 章 Markdown 結構；Requirement: System generates 16-chapter Markdown disclosure document
- [x] 1.4 [Tool: cursor] 在 `codex-provider.ts` 新增 `isLandType()` helper：輸入 `property_type` 字串，回傳 `true` if 農地/建地/商業地/工業地/鄉村區建地/其他土地 — Design: 建物版 vs 土地版分支

## 2. PDF 路由升級

- [x] [P] 2.1 [Tool: cursor] 修改 `src/app/api/listings/[id]/pdf/route.ts`：當 `type=disclosure` 且 `listing.generated_documents` 中 `disclosure_document` 非空時，改用 `generateDossierPDF`（來自 `src/lib/pdf-generator/dossier.ts`）而非直接用 `<pre>` 渲染純文字 — Design: HTML 模板：inline CSS + Puppeteer；Requirement: Disclosure document is downloadable as A4 PDF
- [x] [P] 2.2 [Tool: cursor] 在 PDF 路由中，傳入 `listingId`（數字）給 `generateDossierPDF(markdown, listingId)`，確保 PDF 輸出到正確目錄並以 stream 方式回傳給瀏覽器 — Design: HTML 模板：inline CSS + Puppeteer
- [x] 2.3 [Tool: cursor] 確認 `src/lib/pdf-generator/dossier.ts` 的 templates 目錄（`dossier.html`、`dossier.css`）存在且有效，若缺少則從現有 `pdf/route.ts` 的 inline HTML 提取基礎版；確認 Markdown to HTML 轉換使用 `marked` 套件（已有）或純 pre-wrap CSS 方式 — Design: HTML 模板：inline CSS + Puppeteer；Design: Markdown to HTML 轉換

## 3. PDF 模板 HTML/CSS 完善

- [x] [P] 3.1 [Tool: cursor] 在 `src/lib/pdf-generator/templates/dossier.html` 確認或建立 A4 頁面結構：`{{STYLES}}`、`{{#if LOGO_PATH}}` LOGO 區塊（右上）、`{{CONTENT}}` 主體 — Design: HTML 模板：inline CSS + Puppeteer；Requirement: Disclosure document is downloadable as A4 PDF
- [x] [P] 3.2 [Tool: cursor] 在 `src/lib/pdf-generator/templates/dossier.css` 確認或建立 CSS 樣式：Noto Serif TC（Google Fonts CDN 載入）、表格細線 + 淡灰表頭（`#F5F5F5`）、`待補` 高亮（`.pending { color: #d97706; }`）、章節分隔線（`border-top: 1px solid #ccc; margin: 1.5rem 0`）— Design: HTML 模板：inline CSS + Puppeteer
- [x] 3.3 [Tool: cursor] 在 `src/lib/pdf-generator/dossier.ts` 確認 Puppeteer 的 `headerTemplate` 與 `footerTemplate` 已正確設定：頁眉顯示「建安不動產 | 不動產說明書」+ 頁碼，頁腳顯示製表日期 — Design: HTML 模板：inline CSS + Puppeteer

## 4. 測試與驗證

- [x] [P] 4.1 [Tool: codex] 在 `src/lib/document-generator/__tests__/five-documents.test.ts` 確認測試涵蓋 `disclosure_document` 非佔位符；若測試缺失則補上：驗證 `generate()` 回傳的 `disclosure_document` 包含字串 `#### 章節 1：` — Requirement: System generates 16-chapter Markdown disclosure document；Requirement: Disclosure document is generated with 16-chapter structure
- [x] [P] 4.2 [Tool: codex] 新增 `isLandType()` helper 的單元測試：輸入 `'農地'` 回傳 `true`；輸入 `'公寓'` 回傳 `false`；輸入 `'建地'` 回傳 `true` — Requirement: System generates 16-chapter Markdown disclosure document
- [x] 4.3 [Tool: codex] 執行 `npm run build` 確認 TypeScript 零錯誤；執行 `npm test` 確認全部測試通過 — Requirement: AI-generated chapters contain only allowed content

## 5. UI 整合驗收

- [x] 5.1 [Tool: cursor] 確認 `src/app/listings/[id]/documents/page.tsx` 的 `disclosure_document` 卡片下方「下載 PDF」按鈕連結指向 `/api/listings/${listingId}/pdf?type=disclosure`（現有實作已有此連結，僅確認正確） — Requirement: Disclosure document is downloadable as A4 PDF
- [x] 5.2 [Tool: cursor] 在 documents 頁面的 `disclosure_document` 卡片上，新增「重新產生」按鈕（目前邏輯對 `disclosure_document` 沒有此按鈕），呼叫 `/api/listings/${listingId}/regenerate` with `{ documentType: 'disclosure_document' }` — Requirement: Property dossier is generated as a complete property profile
