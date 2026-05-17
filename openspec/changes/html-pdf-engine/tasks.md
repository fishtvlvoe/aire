# Tasks: html-pdf-engine

## 1. HTML 渲染核心元件

- [ ] [P] 1.1 [Tool: Copilot] 建立 HTML 主題 token 模組 `src/lib/pdf-engine/html-themes.ts`：匯出 `getHtmlThemeTokens(themeId: string)` 函式，回傳含 primary/text/textMuted/bg/bgAlt/border/fontFamily 的物件；不存在的 themeId fallback 到 theme-a-minimal。驗證：`import { getHtmlThemeTokens } from './html-themes'; getHtmlThemeTokens('theme-b-professional').primary === '#1E3A5F'` 且 `getHtmlThemeTokens('nonexistent').primary === '#3B82F6'`。

- [ ] [P] 1.2 [Tool: Copilot] 建立 HTML 基礎元件 `src/lib/pdf-engine/html-components.tsx`：實作 HtmlCover、HtmlPageHeader、HtmlPageFooter、HtmlSection、HtmlFieldTable、HtmlSignatureBlock 六個 React 元件，輸出 HTML div/span/table 結構（非 react-pdf View/Text）。每個元件接收 tokens prop 控制配色。CSS 使用 inline style 或 CSS 變數。驗證：`import { renderToStaticMarkup } from 'react-dom/server'; renderToStaticMarkup(<HtmlCover .../>)` 產出含 "不動產說明書" 文字的 HTML 字串。

- [ ] 1.3 [Tool: Copilot] 建立 HTML 文件組裝器 `src/lib/pdf-engine/html-renderer.tsx`：匯出 `renderDisclosureHtml(data: CaseDossierData, options: { themeId: string; generatedAt: string }): string` 函式。內部用 renderToStaticMarkup 把所有頁面元件組裝成完整 HTML（含 `<html><head><style>@page{size:A4;margin:0}...</style></head><body>...</body></html>`）。依 data.propertyType 區分土地版/建物版頁面排列。驗證：呼叫函式傳入測試資料 → 回傳字串含 `@page` 且含 `class="page"` div 數量 ≥ 3。

## 2. PDF 匯出機制

- [ ] 2.1 [Tool: Copilot] 建立 PDF 匯出模組 `src/lib/pdf-engine/html-export.ts`：匯出 `exportPdfFromHtml(html: string, outputPath: string): Promise<void>` 函式。偵測環境：Node.js 時用 Playwright `chromium.launch()` → `page.setContent(html)` → `page.pdf({ format: 'A4', printBackground: true })`；Tauri 環境時呼叫 `window.__TAURI__` print API（或 fallback 到 window.print()）。Playwright 未安裝時拋 PdfExportError code "BROWSER_NOT_FOUND"。驗證：在 Node 環境跑 `exportPdfFromHtml('<html>...<body>測試</body></html>', '/tmp/test.pdf')` → 檔案存在且 > 0 bytes。

## 3. 預覽頁整合

- [ ] 3.1 [Tool: Copilot] 修改 `src/app/(dashboard)/cases/[id]/preview/page.tsx`：移除 PdfPreviewer（react-pdf blob URL）引用，改為直接 render HTML。使用 `renderDisclosureHtml()` 取得 HTML 字串後用 `dangerouslySetInnerHTML` 或 iframe srcdoc 渲染。保留匯出按鈕，改呼叫 `exportPdfFromHtml()`。保留主題切換、縮放功能。驗證：啟動 dev server → 瀏覽預覽頁 → DOM 中存在 `.page` 元素且含中文文字。

## 4. 端到端驗證

- [ ] 4.1 [Tool: Copilot] 建立測試腳本 `scripts/test-html-pdf.ts`：用 tsx 執行，建構測試用 CaseDossierData → 呼叫 renderDisclosureHtml → 呼叫 exportPdfFromHtml 寫到 `/tmp/aire-html-land.pdf` 和 `/tmp/aire-html-building.pdf`。console.log 輸出檔案路徑和大小。驗證：`npx tsx scripts/test-html-pdf.ts` 執行成功，兩個 PDF 檔案 > 10KB。

- [ ] 4.2 [Tool: 主對話] 跑 `npx tsx scripts/test-html-pdf.ts` 產出 PDF，用 Chrome MCP 開啟驗證中文字正確顯示。確認 `npm run build` 零錯誤。
