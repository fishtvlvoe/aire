## Why

`@react-pdf/renderer` v4.5.1 的 CJK 字型子集化引擎有根本性缺陷 — 所有中文字在 PDF 內嵌字型表損壞，導致 Chrome/Acrobat 開啟顯示空白或亂碼。macOS Preview 靠系統 fallback 可顯示，但實際字型表已壞（pymupdf 回報 `broken table`）。嘗試 OTF/TTF/Variable→Static/手動 Subset 全部失敗。改用 HTML + 瀏覽器原生 PDF 列印是唯一可行方案。

## What Changes

- **BREAKING** 移除 `@react-pdf/renderer` 依賴，以 HTML + CSS `@page` 規則重新實作所有 PDF 頁面元件
- 新增 HTML 預覽層 — 在 Tauri WebView 內即時渲染不動產說明書（WYSIWYG，像桌面版 Canva）
- 新增 PDF 匯出 — 使用 Tauri WebView 原生列印功能（`webview.print()`）或 Playwright（開發/CI 環境）將 HTML 轉為 PDF
- 修改 `src/lib/pdf-engine/document.tsx` — 從 react-pdf Document/Page 改為 HTML div + CSS @page
- 保留現有資料組裝層 `src/lib/pdf-engine/assemble-dossier-data.ts` 不動
- 保留 5 主題 token 系統（只改渲染方式，配色邏輯不變）

## Non-Goals

- 不重寫資料組裝邏輯（assemble-dossier-data.ts 保持不動）
- 不改 Tauri IPC / SQLite / 地政 API 層
- 不做雲端 PDF 渲染（serverless-pdf spec 獨立追蹤）
- 不做 PDF 表單欄位（fillable-pdf-output spec 獨立追蹤）
- 不加新的不動產說明書頁面（那屬於 disclosure-smart-draft change）

## Capabilities

### New Capabilities

- `html-pdf-renderer`: HTML + CSS @page 的 PDF 渲染引擎，取代 react-pdf。負責將 CaseDossierData 轉為 A4 分頁 HTML，支援中文字型、頁首頁尾、表格、簽章欄
- `html-pdf-export`: PDF 匯出機制 — Tauri WebView print（生產）+ Playwright page.pdf()（開發/CI/測試）

### Modified Capabilities

- `disclosure-html-preview`: 原 spec 為 TBD，本次填入完整需求 — WebView 內即時預覽不動產說明書，支援分頁、縮放、主題切換
- `react-pdf-render-engine`: 標記為 deprecated，不再維護

## Impact

- Affected specs: `html-pdf-renderer`（新）、`html-pdf-export`（新）、`disclosure-html-preview`（修改）、`react-pdf-render-engine`（deprecated）
- Affected code:
  - New: `src/lib/pdf-engine/html-renderer.tsx`、`src/lib/pdf-engine/html-components.tsx`、`src/lib/pdf-engine/html-export.ts`、`src/lib/pdf-engine/html-themes.ts`
  - Modified: `src/lib/pdf-engine/document.tsx`、`src/app/cases/[id]/disclosure/page.tsx`（改接 HTML 預覽）
  - Removed: `src/lib/pdf-engine/react-pdf-init.ts`、`src/lib/pdf-engine/react-pdf-components.tsx`（Phase 結束後移除）
- Dependencies 新增: 無（Playwright 已是 devDependency；Tauri WebView print 為內建 API）
- Dependencies 移除: `@react-pdf/renderer`、`@react-pdf/font`（完成後移除）
