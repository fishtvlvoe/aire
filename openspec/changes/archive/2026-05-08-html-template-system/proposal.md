## Why

目前文件產出（不動產說明書等）使用固定的 HTML 模板，客戶無法自訂文件的排版風格。不同房仲公司有各自的品牌形象和版面偏好，需要一套模板管理機制讓管理員上傳自訂 HTML 模板，業務人員在產出文件時可選擇模板、預覽效果、確認後下載 PDF。

## What Changes

1. **模板管理後台**：管理員可上傳 HTML 模板檔案，管理（新增/刪除/設為預設）多套模板
2. **模板變數引擎**：系統將物件欄位資料（地址、坪數、權利範圍等）透過 Mustache 語法注入模板
3. **即時預覽**：業務在文件產出頁面選擇模板後，可在瀏覽器內預覽「實際資料 + 模板樣式」的渲染結果
4. **PDF 下載**：預覽滿意後一鍵將渲染結果透過 Puppeteer 轉成 PDF 下載

## Non-Goals

- 不做所見即所得（WYSIWYG）的視覺化模板編輯器，模板以 HTML 原始碼方式管理
- 不做模板版本控管或 diff 功能
- 不做跨客戶的模板市集或分享機制
- 不改動 AI 文案生成的 prompt 或內容邏輯，模板只負責排版外觀

## Capabilities

### New Capabilities

- `template-management`: 管理員上傳、列表、刪除、設定預設 HTML 模板
- `template-rendering`: 將物件欄位資料注入 HTML 模板並渲染為完整 HTML
- `template-preview`: 業務在瀏覽器預覽模板 + 實際資料的渲染結果
- `template-pdf-export`: 將渲染後的 HTML 透過 Puppeteer 轉成 PDF 並下載

### Modified Capabilities

- `document-generation`: 文件產出流程新增模板選擇步驟

## Impact

- Affected specs: template-management, template-rendering, template-preview, template-pdf-export, document-generation
- Affected code:
  - New: src/app/admin/templates/page.tsx, src/app/api/admin/templates/route.ts, src/app/api/admin/templates/[id]/route.ts, src/app/api/documents/preview/route.ts, src/app/api/documents/export-pdf/route.ts, src/lib/template-engine.ts, src/components/TemplatePreview.tsx
  - Modified: src/app/listings/[id]/documents/page.tsx, src/lib/db/index.ts
  - Removed: （無）
