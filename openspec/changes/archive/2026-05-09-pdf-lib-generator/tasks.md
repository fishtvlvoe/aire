# Tasks — pdf-lib-generator

## 1 準備中文字型

- [x] 1.1 下載 Noto Sans TC Regular（Google Fonts）到 `public/fonts/NotoSansTC-Regular.ttf`，加入 `.gitignore` 排除大檔 [Tool: copilot]

## 2 實作 pdf-lib PDF 生成器

- [x] 2.1 安裝 `@pdf-lib/fontkit` 套件，支援自訂字型嵌入 [Tool: copilot]
- [x] 2.2 建立 `src/lib/pdf-generator/pdflib-dossier.ts`：實作 `generateDossierPDFLib(markdown, listingId, input)` 函式，功能包含：(a) 建立 A4 PDF 文件 (b) 嵌入 cover 背景圖為第一頁底圖 (c) 嵌入 content 背景圖為第二頁底圖 (d) 在 content 頁的欄位座標位置疊加文字（從 `field-layouts.ts` 讀取座標）(e) LLM Markdown 內文用 `marked` 轉純文字後逐行排版到後續頁面 (f) 每頁加頁首（公司名 + 頁碼）和頁尾（日期 + AI 警語）(g) 載入 Noto Sans TC 字型處理中文 [Tool: sonnet]
- [x] 2.3 修改 `src/lib/pdf-generator/dossier.ts` 的 `generateDossierPDF()`：改呼叫 `generateDossierPDFLib()` 並回傳結果，保持原函式簽名不變 [Tool: copilot]

## 3 背景圖整合

- [x] 3.1 從 DB `feature_flags` 讀取 `doc_bg_cover` 和 `doc_bg_content` 的圖片 URL，下載圖片二進位資料嵌入 PDF；若無背景圖則跳過（純白底）[Tool: sonnet]

## 4 驗收

- [x] 4.1 登入後瀏覽器訪問 `/api/listings/3/pdf` 確認回傳 PDF 檔案而非 500 [Tool: sonnet]
- [x] 4.2 開啟 PDF 確認：封面有背景圖、內文有中文、欄位值正確填入 [Tool: sonnet]
- [x] 4.3 `npm run build` 通過零錯誤 [Tool: copilot]
