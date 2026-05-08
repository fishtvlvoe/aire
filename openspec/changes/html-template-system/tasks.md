## 1. 資料庫 Schema 與模板引擎

- [ ] 1.1 在 src/lib/db/index.ts 新增 templates 表的 migration（CREATE TABLE IF NOT EXISTS templates: id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, doc_type TEXT NOT NULL DEFAULT 'disclosure', is_default INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT datetime('now'), updated_at TEXT NOT NULL DEFAULT datetime('now')），並新增 CRUD helper functions：getTemplate(id), getAllTemplates(docType?), createTemplate(meta), deleteTemplate(id), setDefaultTemplate(id, docType) [Design: D1] [Spec: template-management] [Tool: Copilot]
- [ ] [P] 1.2 建立 src/lib/template-engine.ts：(a) assembleContext(listing) 函式，從 field_visit_data、supplementary_data、pre_commission_data、listing 基本欄位合併為單一扁平物件，優先序為 field_visit_data > supplementary_data > pre_commission_data > listing 基本欄位；(b) renderTemplate(htmlContent, context) 函式，用 Handlebars 編譯模板並注入 context，缺失變數渲染為空字串（Handlebars 預設行為） [Design: D2] [Spec: template-rendering] [Tool: Copilot]

## 2. 模板管理 API

- [ ] 2.1 建立 src/app/api/admin/templates/route.ts：GET 回傳模板列表（支援 ?doc_type 篩選），POST 接受 multipart/form-data 上傳 HTML 檔案 + name + description + doc_type。POST 驗證：副檔名 .html/.htm、檔案大小上限 2MB、內容包含至少一個 {{ 標記、用 DOMPurify（isomorphic-dompurify）清理 script 標籤。驗證通過後寫入 DB 和 data/templates/{id}.html [Design: D1, D5] [Spec: template-management] [Tool: Copilot]
- [ ] [P] 2.2 建立 src/app/api/admin/templates/[id]/route.ts：DELETE 刪除模板（DB row + 檔案），PATCH 接受 { is_default: true } 設定預設（先將同 doc_type 其他模板 is_default=0 再設定目標 is_default=1）。DELETE 找不到模板回 404 [Design: D1, D6] [Spec: template-management] [Tool: Copilot]

## 3. 預覽與 PDF 匯出 API

- [ ] 3.1 建立 src/app/api/documents/preview/route.ts：POST 接受 { listingId, templateId }，讀取模板 HTML 檔案，用 template-engine assembleContext + renderTemplate 合併物件資料，回傳渲染後的 HTML（Content-Type: text/html）。listingId 或 templateId 不存在時回 404 [Design: D3] [Spec: template-preview] [Tool: Copilot]
- [ ] [P] 3.2 建立 src/app/api/documents/export-pdf/route.ts：POST 接受 { listingId, templateId }，渲染模板後用 Puppeteer page.setContent(html) + page.pdf({ format: 'A4', margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' } }) 產出 PDF，回傳 binary（Content-Type: application/pdf, Content-Disposition: attachment; filename=listing-{id}.pdf）。templateId 不存在時回 404 [Design: D4] [Spec: template-pdf-export] [Tool: Copilot]

## 4. 前端模板管理頁面

- [ ] 4.1 建立 src/app/admin/templates/page.tsx：管理員模板管理頁面，包含：(a) 模板列表（顯示 name、doc_type、is_default 標記、建立時間）；(b) 上傳按鈕，點擊後彈出表單填寫 name、description、doc_type 並選擇 HTML 檔案；(c) 每個模板有「設為預設」和「刪除」按鈕。頁面載入時檢查 user.role === 'admin'，非 admin redirect 到 /listings [Design: D1] [Spec: template-management] [Tool: Copilot]

## 5. 文件產出頁面整合

- [ ] 5.1 修改 src/app/listings/[id]/documents/page.tsx：(a) 新增模板選擇 dropdown（呼叫 GET /api/admin/templates?doc_type=disclosure 取得列表，預設選中 is_default=1 的模板）；(b) 選擇模板後呼叫 preview API 取得渲染 HTML；(c) 用 iframe srcdoc 顯示預覽結果；(d) 預覽下方顯示「下載 PDF」按鈕，點擊後呼叫 export-pdf API 觸發瀏覽器檔案下載。無自訂模板時隱藏 dropdown 使用內建 fallback 模板 [Design: D3, D4, D6] [Spec: template-preview, template-pdf-export, document-generation] [Tool: Copilot]
- [ ] 5.2 建立 src/components/TemplatePreview.tsx：接收 html string prop，用 iframe sandbox="allow-same-origin" + srcdoc 屬性渲染，自動調整 iframe 高度配合內容。元件提供 loading 狀態顯示 [Design: D3] [Spec: template-preview] [Tool: Copilot]

## 6. Sidebar 導航更新

- [ ] 6.1 在 src/components/Sidebar.tsx 的 admin 區塊新增「模板管理」連結指向 /admin/templates，僅 admin 角色可見 [Spec: template-management] [Tool: Copilot]

## 7. 驗證

- [ ] 7.1 啟動 dev server，以 admin 帳號登入，驗證：(a) 上傳 HTML 模板成功且出現在列表中 (b) 設為預設成功 (c) 文件產出頁面顯示模板 dropdown (d) 預覽渲染正確帶入物件資料 (e) PDF 下載成功且排版與預覽一致 (f) 刪除模板後列表更新 [Tool: 主對話]
