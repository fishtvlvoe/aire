## Context

html-pdf-engine 已建立 HTML 渲染核心（html-themes.ts、html-components.tsx、html-renderer.tsx、html-export.ts）。目前 html-renderer.tsx 只渲染 4 頁基礎結構。需要把 src/lib/pdf-blocks/ 下的 9 個 react-pdf 元件 1:1 轉為 HTML 版。

## Goals / Non-Goals

**Goals:**
- 所有 9 個頁面區塊轉為 HTML 版
- html-renderer.tsx 整合完整頁面排列（土地版 ~12 頁、建物版 ~18 頁）
- 產出的 PDF 內容與 react-pdf 版完全一致（1:1 對等）

**Non-Goals:**
- 不刪除 react-pdf 版
- 不改資料結構
- 不加新功能

## Decisions

### 檔案結構：html-blocks/ 子目錄

所有 HTML 版頁面放 `src/lib/pdf-engine/html-blocks/`，命名對應舊版。用 `index.ts` barrel export。

### 轉換規則

- react-pdf `View` → HTML `div`
- react-pdf `Text` → HTML `span` / `p` / `div`
- react-pdf `Page` → `div className="page"`
- Style 物件 → React inline style（CSSProperties）
- 所有色彩從 HtmlThemeTokens 讀取
- 字型用 tokens.fontFamily（CSS font-family 字串）

### 頁面排列（土地版）

封面 → 法規告知 → 物件資料表 → 土地標示/權利/使用管制 → 費用一覽表 → 增值稅概算表 → 現況調查表(多頁) → 成交行情 → 生活機能 → 位置圖 → 外觀圖 → 簽章欄

## Implementation Contract

### 行為

`renderDisclosureHtml(data, options)` 回傳的 HTML 包含完整頁面結構（土地版 12+ 頁、建物版 15+ 頁）。每頁有 header/footer。

### 驗收標準

1. `npx tsx scripts/test-html-pdf.ts` 產出 PDF 頁數 ≥ 10（土地版）
2. pymupdf 提取文字包含各區塊關鍵字：「物件資料」「費用一覽」「增值稅」「現況調查」「成交行情」「生活機能」
3. `npm run build` 零錯誤

### Scope 邊界

- In scope: 9 個 HTML blocks + renderer 整合
- Out of scope: 新增頁面、改資料結構、刪除舊版

## Risks / Trade-offs

- [風險] 現況調查表 35/58 題 checkbox 渲染在 HTML 中需要 ☐/☑ Unicode 字元 → 直接用 Unicode ☐ ☑
- [Trade-off] 1:1 轉換可能保留原有排版問題 → 接受，後續修正
