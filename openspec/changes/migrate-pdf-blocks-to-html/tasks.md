# Tasks: migrate-pdf-blocks-to-html

## 1. 小型頁面元件（並行）

- [x] [P] 1.1 [Tool: Codex] 建立 `src/lib/pdf-engine/html-blocks/property-data-sheet.tsx`：讀取 `src/lib/pdf-blocks/property-data-sheet.tsx` 的結構，轉為 HTML 版元件 HtmlPropertyDataSheet。接收 tokens + data props，用 HtmlSection + HtmlFieldTable 渲染物件資料表。驗證：renderToStaticMarkup 產出含「產權調查」文字的 HTML。

- [x] [P] 1.2 [Tool: Codex] 建立 `src/lib/pdf-engine/html-blocks/transaction-history.tsx`：讀取 `src/lib/pdf-blocks/transaction-history-page.tsx`，轉為 HTML 版 HtmlTransactionHistory。渲染多欄表格（地址/面積/總價/單價/日期），標題「附近地段實價登錄成交行情」。驗證：renderToStaticMarkup 產出含「成交行情」和 `<table` 的 HTML。

- [x] [P] 1.3 [Tool: Codex] 建立 `src/lib/pdf-engine/html-blocks/life-amenities.tsx`：讀取 `src/lib/pdf-blocks/life-amenities.tsx`，轉為 HTML 版 HtmlLifeAmenities。渲染周邊設施分類表。驗證：renderToStaticMarkup 產出含「生活機能」文字的 HTML。

- [x] [P] 1.4 [Tool: Codex] 建立 `src/lib/pdf-engine/html-blocks/location-map.tsx` + `src/lib/pdf-engine/html-blocks/exterior-photo.tsx`：讀取對應 react-pdf 版，轉為 HTML 版。無圖片時顯示中文佔位文字。驗證：renderToStaticMarkup 產出含「位置圖」和「外觀照片」佔位文字。

## 2. 稅費頁面

- [x] [P] 2.1 [Tool: Codex] 建立 `src/lib/pdf-engine/html-blocks/tax-fee.tsx`：讀取 `src/lib/pdf-blocks/tax-fee-page.tsx`（286 行），轉為 HTML 版。匯出 HtmlTaxFeeOverview（費用一覽表：賣方/買方分列）和 HtmlLandValueTax（增值稅概算表）。驗證：renderToStaticMarkup 產出含「費用一覽」和「增值稅」文字。

- [x] [P] 2.2 [Tool: Codex] 建立 `src/lib/pdf-engine/html-blocks/signature-block.tsx`：讀取 `src/lib/pdf-blocks/signature-block.tsx`（148 行），轉為 HTML 版 HtmlSignatureBlockFull（完整四方簽章 + 日期 + 備註）。驗證：renderToStaticMarkup 產出含「不動產經紀業」「經紀人」「買方」「賣方」四個簽章區塊。

## 3. 現況調查表（大型，各自一包）

- [x] 3.1 [Tool: Codex] 建立 `src/lib/pdf-engine/html-blocks/land-condition-survey.tsx`：讀取 `src/lib/pdf-blocks/land-condition-survey.tsx`（283 行），轉為 HTML 版 HtmlLandConditionSurvey。渲染 35 題 checkbox 問卷，草稿模式全部 ☐。需要 2-3 頁分頁。驗證：renderToStaticMarkup 產出含「現況調查」文字且 ☐ 出現 35 次以上。

- [x] 3.2 [Tool: Codex] 建立 `src/lib/pdf-engine/html-blocks/building-condition-survey.tsx`：讀取 `src/lib/pdf-blocks/building-condition-survey.tsx`（317 行），轉為 HTML 版 HtmlBuildingConditionSurvey。渲染成屋版問卷（38 題 + 建物補充題）。驗證：renderToStaticMarkup 產出含「現況調查」文字且 ☐ 出現 50 次以上。

## 4. 整合 renderer

- [ ] 4.1 [Tool: Codex] 建立 `src/lib/pdf-engine/html-blocks/index.ts` barrel export，並修改 `src/lib/pdf-engine/html-renderer.tsx`：import 所有 html-blocks 元件，組裝完整頁面排列。土地版：封面→法規→物件資料表→土地標示→費用一覽→增值稅概算→現況調查(多頁)→成交行情→生活機能→位置圖→外觀圖→簽章欄。建物版類似但用建物調查表。驗證：`renderDisclosureHtml(landData)` 回傳 HTML 含 page div ≥ 10 個。

## 5. 端到端驗證

- [ ] 5.1 [Tool: 主對話] 修改 `scripts/test-html-pdf.ts` 加入完整測試資料（含 fees、taxCalculation、surveyData、amenities 等），重新產出 PDF 驗證頁數 ≥ 10 且 pymupdf 提取文字包含各區塊關鍵字。確認 `npm run build` 通過。
