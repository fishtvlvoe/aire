## Why

目前 pdflib-dossier 產出的不動產說明書 PDF 排版品質不符合正式文件標準 — 章節標題左對齊與內文混在一起、段落缺少行距段距、標籤值未對齊、背景圖只鋪前兩頁。客戶需要將此文件印出來給買方看，必須達到正式公文/合約書的印刷品質。

## What Changes

- 重寫 `pdflib-dossier.ts` 的排版引擎，從「markdown 文字直接傾倒」改為「正式文件排版」
- 新增章節標題置中、加粗、大字體渲染邏輯
- 新增段落內文排版：適當行距（1.5 倍）、段距（段落間留白）、自動換行在 content margin 內
- 新增「標籤：值」對齊排版（標籤固定寬度靠左、值往右延伸）
- 修改背景圖邏輯：第 1 頁用 cover 底圖、第 2 頁起每頁都鋪 content 底圖（不只第 2 頁）
- 新增 content margin 定義：文字排在底圖中央白色區域內，四周留出裝飾邊框空間
- 修改頁首頁尾：字體縮小、位置調到邊框外緣、不搶主內容
- 新增無底圖 fallback：沒有底圖時仍使用相同排版規格（margin、字體大小、對齊方式）

## Non-Goals

- 不改 HTML 預覽元件（DisclosurePreview / DisclosureFieldOverlay）— 預覽走前端渲染，與 PDF 生成獨立
- 不改 markdown 內容生成邏輯（16 章節結構不變）
- 不改 feature_flags 資料庫結構或背景圖上傳 API
- 不改第 1 頁封面的欄位座標定位邏輯（field-layouts.ts）
- 不支援自訂字體上傳 — 固定使用 NotoSansTC
- 不做 Puppeteer/Chrome PDF 方案 — macOS Sequoia 不支援 headless Chromium，已確認放棄

## Capabilities

### New Capabilities

- `pdf-formal-typesetting`: 定義 PDF 正式文件排版規格 — 標題置中層次、段落間距、標籤值對齊、content margin、頁首頁尾樣式、無底圖 fallback

### Modified Capabilities

- `disclosure-document-generation`: 修改 PDF 渲染行為 — 每頁鋪底圖、文字排在 content margin 內、排版從「文字傾倒」改為「正式文件」
- `disclosure-template-background`: 修改背景圖套用邏輯 — 從「只鋪前兩頁」改為「第 1 頁 cover、第 2 頁起每頁都鋪 content」

## Impact

- Affected specs: `pdf-formal-typesetting`（新建）、`disclosure-document-generation`（修改渲染行為）、`disclosure-template-background`（修改鋪圖邏輯）
- Affected code:
  - Modified: src/lib/pdf-generator/pdflib-dossier.ts
  - New: src/lib/pdf-generator/typesetting.ts（排版常數與工具函式：margin、字體大小、行距、對齊計算）
  - Modified: src/lib/pdf-generator/__tests__/pdflib-dossier.test.ts
- Dependencies 新增：無（pdf-lib + fontkit 已安裝）
- 環境變數新增：無
