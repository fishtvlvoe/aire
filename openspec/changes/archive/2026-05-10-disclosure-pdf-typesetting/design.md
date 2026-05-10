## Context

目前 `pdflib-dossier.ts`（約 418 行）負責將 markdown 內容轉為 PDF。現況問題：
- 背景圖只鋪第 1-2 頁（cover + content），第 3-11 頁純白
- 文字排版像 markdown 筆記直接貼上：標題左對齊、無段距、標籤值未對齊
- 頁首頁尾佔太多空間，搶主內容
- 客戶要印出來給買方看，品質不及格

技術約束：macOS Sequoia 封殺 headless Chromium（SIGABRT），已確認只能用 pdf-lib 純 Node.js 方案。字體固定 NotoSansTC-Regular.ttf（public/fonts/）。

參考樣本：`docs/demo/不動產說明書-樣本.pdf` — 每頁有底圖、文字在中央白色區域、標題置中、段落有間距。

## Goals / Non-Goals

**Goals:**

- PDF 每頁都鋪底圖（第 1 頁 cover、第 2 頁起每頁 content）
- 沒有底圖時仍使用相同排版規格（margin、字體、間距）
- 章節標題置中、字體加大（16pt）、加粗效果（用 NotoSansTC-Bold 或用描邊模擬）
- 段落內文有行距（1.5 倍）、段距（段落間留白 12pt）
- 「標籤：值」排版：標籤固定寬度靠左、值接在冒號後延伸
- 頁首頁尾縮小（9pt）、位置在頁面邊緣
- 文字排在 content margin 內，避開底圖四周裝飾邊框

**Non-Goals:**

- 不改 HTML 預覽元件（前端渲染獨立於 PDF 生成）
- 不改 markdown 16 章節內容生成邏輯
- 不改 feature_flags 或背景圖上傳 API
- 不改第 1 頁封面欄位座標定位（field-layouts.ts）
- 不支援自訂字體
- 不做分頁控制的高級排版（如避免標題落在頁底孤行）— 留給未來優化

## Decisions

### Decision 1: 排版常數抽出為獨立模組 typesetting.ts

將所有排版相關常數（margin、字體大小、行距、段距、對齊規則）集中到 `src/lib/pdf-generator/typesetting.ts`，與 pdflib-dossier 的邏輯分離。

理由：排版參數未來會隨客戶需求調整（不同客戶可能要不同 margin），集中管理比散落在渲染函式中容易維護。

替代方案：直接寫在 pdflib-dossier 裡 — 拒絕，因為該檔案已 418 行，再加排版常數會更難維護。

### Decision 2: 用 NotoSansTC-Bold.ttf 做標題加粗

下載 NotoSansTC-Bold.ttf 放到 `public/fonts/`，標題用 Bold 字體、內文用 Regular。

理由：pdf-lib 不支援 CSS font-weight，必須嵌入不同字體檔案才能區分粗細。描邊模擬（stroke）在 CJK 字體上效果差。

替代方案：用描邊模擬粗體 — 拒絕，CJK 筆畫多，描邊後字形會糊掉。

### Decision 3: content margin 定義為 A4 頁面百分比

根據樣本 PDF 的底圖白色區域，定義 content margin：
- 左 margin: 12%（約 71pt）
- 右 margin: 8%（約 48pt）
- 上 margin: 12%（約 101pt）
- 下 margin: 10%（約 84pt）

這些百分比值存在 typesetting.ts 中，可依客戶底圖調整。

理由：用百分比而非固定 pt 值，未來支援不同紙張大小時不需重新計算。

### Decision 4: markdown 解析改為結構化 token 再渲染

目前 pdflib-dossier 直接逐行處理 markdown 文字。改為先用 `marked.lexer()` 將 markdown 解析為 token 陣列（heading / paragraph / list / etc.），再根據 token 類型套用不同排版規則。

理由：逐行處理無法區分標題和段落，導致所有文字用同一個樣式。token 化後可精確控制每種元素的字體、大小、對齊、間距。

### Decision 5: 背景圖從「只鋪前兩頁」改為「每頁都鋪」

修改 `generateDossierPDFLib` 中的背景圖邏輯：
- 建立所有內容頁後，對第 2 頁起的每一頁都呼叫 `drawBackground(contentBg)`
- 第 1 頁維持用 cover 底圖
- 背景圖層級設為最底層（先畫背景再畫文字）

### Decision 6: 自動分頁時保持背景圖

當文字超過一頁的 content area 時，自動新增頁面並鋪上 content 底圖，然後繼續排文字。分頁邏輯在渲染迴圈中處理：每次 drawText 前檢查 currentY 是否超出下 margin，超出則新增頁面。

## Implementation Contract

### 可觀察行為

1. **PDF 每頁都有底圖**：第 1 頁用 cover 底圖，第 2 頁起每頁用 content 底圖。用 `pdfimages -list` 驗證每頁都有對應圖片。
2. **無底圖 fallback**：feature_flags 沒有底圖設定時，PDF 仍正常生成，排版規格（margin、字體、間距）不變，只是沒有背景圖。
3. **章節標題置中**：markdown `## 章節 N：標題` 渲染為置中、16pt、Bold 字體。用 `pdftotext` 驗證標題文字存在。
4. **段落有間距**：段落間有 12pt 留白、行距 1.5 倍。視覺驗證 PDF 不是文字擠在一起。
5. **標籤值對齊**：「交易方式：待補」格式的行，標籤靠左、值接在冒號後。
6. **頁首頁尾縮小**：9pt 字體、位置在 margin 外緣（頁面最上/最下方），不侵入 content area。
7. **content margin 生效**：所有文字排在定義的 margin 範圍內，不會被底圖裝飾邊框擋住。

### 介面 / 資料形狀

- `typesetting.ts` 匯出常數物件 `TYPESET`，包含：`margin`（上下左右 pt 值）、`fontSize`（heading / body / label / headerFooter）、`lineHeight`（倍數）、`paragraphSpacing`（pt）、`labelWidth`（pt）
- `pdflib-dossier.ts` 的 `generateDossierPDFLib()` 函式簽名不變（入參：markdown, listingId, input → 回傳 Uint8Array）

### 失敗模式

- Bold 字體檔案不存在 → fallback 到 Regular 字體，不中斷生成
- 背景圖載入失敗 → 靜默跳過，生成無底圖但排版正確的 PDF（現有行為維持）
- markdown token 解析失敗 → fallback 到原始文字逐行渲染

### 驗收標準

1. `npm run test` 中 pdflib-dossier 相關測試全部通過
2. `curl` 打 `/api/listings/{id}/pdf?type=disclosure` 回 200、檔案 > 1MB（含底圖）
3. 用 `pdfimages -list` 驗證 PDF 每頁都有背景圖
4. 用 `pdftotext` 驗證章節標題和內文都有渲染
5. 視覺檢查 PDF：標題置中、段落有間距、文字在 margin 內、頁首頁尾不搶眼

### 範圍邊界

- In scope: pdflib-dossier.ts 排版重寫、typesetting.ts 新建、Bold 字體下載、測試更新
- Out of scope: HTML 預覽、markdown 內容生成、背景圖上傳 API、封面欄位座標

## Risks / Trade-offs

- [NotoSansTC-Bold.ttf 約 10MB] → 會增加 repo 大小。緩解：用 Google Fonts CDN 下載放 public/fonts/，不進 git（加入 .gitignore），部署時下載
- [content margin 硬編碼] → 不同客戶的底圖白色區域不同。緩解：margin 值集中在 typesetting.ts，未來可改為從 DB 讀取
- [pdf-lib 文字排版能力有限] → 不支援 justify 對齊、不支援 hyphenation。緩解：目前需求只需 left-align 和 center，足夠用
- [自動分頁可能在標題後立即斷頁] → 標題落在頁底、內文在下一頁。緩解：Non-Goal 中已排除，留給未來優化
