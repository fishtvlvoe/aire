## Context

AIRE 桌面 App 使用 `@react-pdf/renderer` v4.5.1 產出不動產說明書 PDF。該引擎的 CJK 字型子集化（fontkit/pdfkit）有根本性缺陷 — 嵌入的字型表損壞，Chrome/Acrobat 顯示空白或亂碼。

現有架構：
- `src/lib/pdf-engine/document.tsx` — react-pdf Document/Page 主模板
- `src/lib/pdf-engine/react-pdf-components.tsx` — 封面/頁首/頁尾/表格元件
- `src/lib/pdf-blocks/*.tsx` — 各頁面區塊（20+ 個檔案）
- `src/lib/pdf-engine/assemble-dossier-data.ts` — 資料組裝（API→欄位映射）
- `src/components/PdfPreviewer.tsx` — 用 react-pdf 的 blob URL 做預覽
- `src/app/(dashboard)/cases/[id]/preview/page.tsx` — 預覽頁路由
- `src-tauri/src/commands/pdf.rs` — Tauri IPC 寫 PDF bytes 到磁碟

經實測：HTML + Playwright `page.pdf()` 可完美渲染中文（已驗證 Demo 產出 744KB 4 頁 PDF）。Tauri 2.x WebView 本質是瀏覽器引擎，`window.print()` / `webview.print()` 支援 CSS @page。

## Goals / Non-Goals

**Goals:**

- 中文字（CJK）在 PDF 中正確顯示，Chrome/Acrobat/macOS Preview 皆正常
- WYSIWYG 預覽：案件預覽頁直接渲染 HTML（所見即所得，像桌面版 Canva）
- PDF 匯出：生產環境用 Tauri WebView print；開發/CI 用 Playwright
- 保留現有 5 主題 token 系統（配色邏輯不變）
- 保留資料組裝層不動（assemble-dossier-data.ts）

**Non-Goals:**

- 不改 Tauri IPC / SQLite / 地政 API 層
- 不做雲端 PDF 渲染
- 不做 PDF 表單欄位（fillable PDF）
- 不加新頁面（那屬於 disclosure-smart-draft change）
- 不做 electron-pdf 或 puppeteer 方案

## Decisions

### 渲染架構：React HTML 元件 + CSS @page

使用 React Server Components 或 Client Components 渲染 HTML 字串。每個 PDF 頁面是一個 `<div class="page">` + CSS `page-break-after: always`。

**替代方案**：pdfmake（也有 CJK 問題）、pdf-lib（手動排版過於複雜）、puppeteer（體積過大不適合桌面 App）。

### 預覽方式：直接在 Next.js 頁面內 render HTML

預覽頁直接渲染 HTML 元件（和 PDF 用同一套 React 元件），不需要 iframe 或 blob URL。用 CSS `transform: scale()` 實現縮放。

**替代方案**：iframe + srcdoc（額外隔離但增加複雜度，暫不需要）。

### PDF 匯出：雙軌策略

| 環境 | 方式 | 原因 |
|------|------|------|
| 生產（Tauri App） | `window.print()` + CSS @media print | 零依賴、體積小、系統列印對話可選印表機/PDF |
| 開發 / CI / 測試 | Playwright `page.pdf()` | headless、可自動化、截圖驗證 |

Tauri IPC `export_pdf` 指令改為接收「列印結果檔案路徑」，前端觸發 `window.print()` 後，由 Tauri 的 `print` 事件攔截寫入磁碟（或用 `tauri-plugin-printer`）。如果 Tauri WebView print 無法直接攔截 PDF bytes，fallback 為前端用 Playwright（bundled binary）。

### 字型策略：系統字型 + Web Font fallback

CSS `font-family: "Noto Sans TC", "Microsoft JhengHei", "PingFang TC", sans-serif`。瀏覽器引擎處理字型渲染，不需手動嵌入/子集化。

### 元件遷移：漸進式替換

1. 新建 `src/lib/pdf-engine/html-components.tsx`（HTML 版元件）
2. 新建 `src/lib/pdf-engine/html-renderer.tsx`（HTML 文件組裝）
3. 預覽頁改為引用 HTML renderer
4. 驗證通過後移除 react-pdf 相關檔案

## Implementation Contract

### 行為

- 用戶在案件預覽頁看到完整的不動產說明書 HTML 渲染（A4 比例、分頁、含所有章節）
- 用戶點「匯出 PDF」按鈕，系統產出 PDF 檔案儲存到指定路徑
- PDF 內所有中文字正確顯示（非亂碼、非空白）
- 5 個主題切換後，預覽和 PDF 同步更新配色

### 介面 / 資料形狀

```typescript
// html-renderer.tsx 的主要匯出
export function renderDisclosureHtml(data: CaseDossierData, options: {
  themeId: string;
  generatedAt: string;
}): string;
// 回傳完整 HTML 字串（含 <html><head><style>...</style></head><body>...</body></html>）

// html-export.ts 的主要匯出
export async function exportPdfFromHtml(html: string, outputPath: string): Promise<void>;
// 開發/CI 環境用 Playwright；生產環境用 Tauri print API

// html-components.tsx 匯出的元件
export function HtmlCover(props: HtmlCoverProps): React.ReactElement;
export function HtmlPageHeader(props: HtmlPageHeaderProps): React.ReactElement;
export function HtmlPageFooter(props: HtmlPageFooterProps): React.ReactElement;
export function HtmlSection(props: HtmlSectionProps): React.ReactElement;
export function HtmlFieldTable(props: HtmlFieldTableProps): React.ReactElement;
export function HtmlSignatureBlock(props: HtmlSignatureBlockProps): React.ReactElement;
```

### 失敗模式

- Playwright 未安裝（CI 缺 chromium）→ 拋 `PdfExportError` code `BROWSER_NOT_FOUND`，前端顯示提示
- 磁碟空間不足 → 維持現有 `DISK_FULL` 錯誤碼
- 主題 ID 不存在 → fallback 到 `theme-a-minimal`

### 驗收標準

1. 跑 `npx tsx scripts/test-html-pdf.ts` 產出土地版 + 建物版 PDF → 用 Chrome 開啟，中文字正確
2. 預覽頁 render 時間 < 500ms（CaseDossierData → HTML）
3. `npm run build` 零錯誤
4. 移除 react-pdf 後 bundle size 減少（react-pdf ~2MB）

### Scope 邊界

- In scope: PDF 渲染引擎替換、預覽頁改接 HTML、匯出機制雙軌
- Out of scope: 新頁面內容（現況調查表/稅費表等屬 disclosure-smart-draft）、表單 UI、Tauri IPC 新增（只改現有 export_pdf 行為）

## Risks / Trade-offs

- [風險] `window.print()` 會彈出系統列印對話 → 用戶需選「儲存為 PDF」而非直接印 → 緩解：研究 `tauri-plugin-printer` 或 Tauri 2.x 的 `WebviewWindow::print` 是否能靜默輸出 PDF
- [風險] CSS @page 在不同 WebView 版本表現不一致 → 緩解：只支援 Chromium WebView（Tauri 2.x Windows 用 WebView2 = Chromium，macOS 用 WKWebView = WebKit，需測試 Safari print）
- [風險] macOS WKWebView 的 CSS print 支援不如 Chromium → 緩解：macOS 如不支援靜默 PDF，改用 bundled Playwright（體積增加 ~50MB）
- [Trade-off] 放棄 react-pdf 意味著無法用其 yoga layout engine → 需自己用 CSS 控制分頁，但 CSS @page 已夠用

## Migration Plan

1. **Phase A**（本次 change）：建立 HTML renderer + 預覽頁改接，react-pdf 程式碼暫時保留不刪
2. **Phase B**（確認穩定後）：移除 `@react-pdf/renderer` 依賴、刪除 react-pdf-components.tsx 和 react-pdf-init.ts
3. **Rollback**：Phase A 期間如發現 HTML 方案不可行，預覽頁 import 路徑改回 react-pdf 即可恢復

## Open Questions

1. Tauri 2.x 的 `WebviewWindow::print()` 能否直接輸出 PDF bytes 到記憶體（不彈對話）？需實測
2. macOS WKWebView 對 CSS `@page { size: A4 }` 的支援程度？需實測
3. 是否需要在 Tauri App 裡 bundle Playwright chromium binary 作為 fallback？（體積 vs 可靠性）
