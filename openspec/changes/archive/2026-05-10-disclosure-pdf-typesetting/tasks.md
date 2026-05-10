## 1 排版基礎建設

- [x] [P] 1.1 Implement PDF content pages SHALL use formal document typesetting: 建立排版常數模組 typesetting.ts; Decision 1: 排版常數抽出為獨立模組 typesetting.ts; Decision 3: content margin 定義為 A4 頁面百分比; 介面 / 資料形狀 [Tool: copilot]
  建立 `src/lib/pdf-generator/typesetting.ts`，匯出 `TYPESET` 常數物件（介面/資料形狀），包含：
  - `margin`: `{ top: 101, bottom: 84, left: 71, right: 48 }`（A4 頁面的 12%/10%/12%/8%，單位 pt）
  - `fontSize`: `{ heading: 16, body: 12, label: 12, headerFooter: 9 }`
  - `lineHeight`: 1.5（倍數）
  - `paragraphSpacing`: 12（pt）
  - `labelWidth`: 80（pt）
  - `pageSize`: `{ width: 595.28, height: 841.89 }`（A4 pt）
  對應 spec: PDF content pages SHALL use formal document typesetting — Content margin constrains all text placement。
  行為：其他模組 import TYPESET 後可取得所有排版參數。
  驗證：`import { TYPESET } from './typesetting'` 編譯通過、`npm run build` 無錯誤。

- [x] [P] 1.2 Implement Bold font fallback to Regular when unavailable: 下載 NotoSansTC-Bold.ttf; Decision 2: 用 NotoSansTC-Bold.ttf 做標題加粗 [Tool: copilot]
  從 Google Fonts 下載 NotoSansTC-Bold.ttf 放到 `public/fonts/NotoSansTC-Bold.ttf`。
  確認 `.gitignore` 不排除 `public/fonts/` 目錄（字體需隨專案交付）。
  對應 spec: Bold font fallback to Regular when unavailable。
  行為：檔案存在於 `public/fonts/NotoSansTC-Bold.ttf`，大小 > 5MB。
  驗證：`ls -la public/fonts/NotoSansTC-Bold.ttf` 確認檔案存在且大小合理。

## 2 markdown token 解析與正式排版

- [x] 2.1 Implement System generates 16-chapter Markdown disclosure document: 重構 markdown 解析為 token-based; Decision 4: markdown 解析改為結構化 token 再渲染 [Tool: sonnet]
  修改 `src/lib/pdf-generator/pdflib-dossier.ts` 中的內容渲染邏輯：
  - 引入 `marked.lexer()` 將 markdown 轉為 token 陣列
  - 建立 `renderTokens(pdfDoc, page, tokens, fonts, typeset)` 函式，根據 token.type 分流：
    - `heading` → 呼叫 heading 渲染（置中、Bold、16pt）
    - `paragraph` → 呼叫 paragraph 渲染（左對齊、Regular、12pt、1.5x 行距）
    - `list` → 呼叫 list 渲染（帶縮排和項目符號）
    - `hr` → 跳過（章節分隔線不渲染）
    - `space` → 加段落間距
  - 偵測段落內「標籤：值」格式（含中文冒號），套用標籤值對齊排版（標籤固定 80pt 寬度）
  對應 spec: System generates 16-chapter Markdown disclosure document（透過 token-based markdown 解析實現 PDF 正式排版）。
  對應 spec: PDF content pages SHALL use formal document typesetting — 所有 scenario（Section heading renders centered and enlarged、Body paragraph renders with proper line spacing、Label-value pair renders with aligned layout、Header and footer use small unobtrusive text）。
  行為：PDF 中章節標題置中加大、段落有間距、標籤值對齊。
  驗證：`pdftotext /tmp/test.pdf -` 確認標題和內文文字都有渲染；視覺檢查 PDF 標題置中。

## 3 背景圖鋪設與分頁

- [x] 3.1 Implement Admin uploads and manages disclosure template background images: 每頁都鋪底圖; Decision 5: 背景圖從「只鋪前兩頁」改為「每頁都鋪」; Decision 6: 自動分頁時保持背景圖 [Tool: sonnet]
  修改 `src/lib/pdf-generator/pdflib-dossier.ts` 中 `generateDossierPDFLib` 函式：
  - 第 1 頁維持用 cover 底圖
  - 第 2 頁起每一頁都鋪 content 底圖（不只第 2 頁）
  - 自動分頁時（文字超出 content area 下邊界），新增頁面並先鋪 content 底圖再繼續排文字
  - 背景圖層級設為最底層（先 drawImage 再 drawText）
  對應 spec: Admin uploads and manages disclosure template background images — Content background applied to all content pages、maintains typesetting without background images on fallback。
  行為：PDF 每一頁都有背景圖；`pdfimages -list` 顯示每頁都有對應圖片。
  驗證：`pdfimages -list /tmp/test.pdf` 輸出的圖片數量 = PDF 頁數。

- [x] 3.2 修改頁首頁尾樣式 [Tool: copilot]
  修改 `src/lib/pdf-generator/pdflib-dossier.ts` 中頁首頁尾渲染：
  - 字體大小改為 9pt（從 typesetting.ts 讀取 TYPESET.fontSize.headerFooter）
  - 頁首位置：頁面最上方 margin 外（y = pageHeight - 30pt）
  - 頁尾位置：頁面最下方 margin 外（y = 25pt）
  - 頁首內容：「不動產仲介」靠左、「第 N 頁 / 共 M 頁」靠右
  - 頁尾內容：「製表日期：YYYY/MM/DD | ⚠ 本文件由 AI 輔助產出...」置中
  對應 spec: PDF content pages SHALL use formal document typesetting — Header and footer use small unobtrusive text。
  行為：頁首頁尾文字小而不搶眼，位置在 content margin 外。
  驗證：視覺檢查 PDF 頁首頁尾不侵入主內容區域。

## 4 Fallback 與整合測試

- [x] 4.1 Implement PDF SHALL maintain typesetting without background images: 確保無底圖時排版不變 [Tool: copilot]
  確認 `src/lib/pdf-generator/pdflib-dossier.ts` 在 feature_flags 沒有背景圖設定時：
  - 頁面背景為白色
  - content margin、字體大小、行距、段距、標題置中等排版規格完全不變
  - drawBackground 函式在 bytes=null 時靜默跳過（現有行為維持）
  對應 spec: PDF SHALL maintain typesetting without background images — No background image configured produces clean typeset PDF、content margin and typography remain unchanged。
  對應 spec: Admin uploads and manages disclosure template background images — No background uploaded fallback scenario。
  對應失敗模式：背景圖載入失敗 → 靜默跳過，生成無底圖但排版正確的 PDF。
  行為：無底圖 PDF 與有底圖 PDF 的文字排版完全一致，只差背景。
  驗證：移除 feature_flags 中的 doc_bg_cover/doc_bg_content 後重新生成 PDF，用 `pdftotext` 確認文字內容一致。

- [x] 4.2 更新 pdflib-dossier 測試 [Tool: sonnet]
  修改 `src/lib/pdf-generator/__tests__/pdflib-dossier.test.ts`：
  - 新增測試：驗證 PDF 頁數 > 2 時每頁都有背景圖（mock feature_flags + 測試用圖片）
  - 新增測試：驗證無底圖時 PDF 正常生成且大小 < 200KB
  - 新增測試：驗證 Bold 字體不存在時 fallback 到 Regular 不拋錯（對應 spec: Bold font fallback to Regular when unavailable — Bold font missing triggers graceful fallback）
  對應 spec: Bold font fallback to Regular when unavailable（測試覆蓋字體缺失 fallback 機制）。
  - 保留既有測試不破壞
  對應驗收標準：`npm run test` 中 pdflib-dossier 相關測試全部通過。
  對應範圍邊界：In scope 的測試更新。
  行為：所有新增和既有測試通過。
  驗證：`npm run test -- --grep pdflib` 全綠。

- [x] 4.3 端對端驗證：curl 測試 PDF API [Tool: copilot]
  執行端對端測試流程（對應可觀察行為全部 7 項）：
  1. 啟動 dev server
  2. curl 登入取 session
  3. `curl /api/listings/{id}/pdf?type=disclosure` 下載 PDF（使用 dev seed 資料中的任意 listing ID，例如 `1`）
  4. `pdfinfo` 確認頁數 = 11、檔案 > 1MB
  5. `pdfimages -list` 確認每頁有圖片
  6. `pdftotext` 確認章節標題和內文都有渲染
  7. 視覺檢查 PDF 排版品質
  行為：PDF API 回 HTTP 200，產出符合正式文件排版標準的 PDF。
  驗證：以上 7 個檢查項目全部通過。
