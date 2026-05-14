## 1. 補齊 disclosure template PDF 底板

- [x] [P] 1.1 從 `docs/0417-old/` 與 `docs/demo/` 既有範本中挑出最完整的成屋 19 頁底板 PDF，複製為 `src/resources/templates/residential.pdf`，使 disclosure template PDF assets SHALL exist on disk 的 residential scenario 通過。驗證：`pdf-lib` 的 `PDFDocument.load()` 對該檔回傳成功、不丟 `TemplateNotFoundError`；用 `ls -la src/resources/templates/residential.pdf` 確認檔案存在且 size > 0
- [x] [P] 1.2 從 `docs/0417-old/` 與 `docs/demo/` 既有範本中挑出最完整的土地 19 頁底板 PDF，複製為 `src/resources/templates/land.pdf`，使 disclosure template PDF assets SHALL exist on disk 的 land scenario 通過。驗證：`pdf-lib` 的 `PDFDocument.load()` 對該檔回傳成功；`ls -la src/resources/templates/land.pdf` 確認存在
- [x] 1.3 驗證缺檔錯誤路徑仍能丟出 typed error：暫時將 `src/resources/templates/residential.pdf` 改名後執行渲染器，確認丟 `TemplateNotFoundError` 且 `code` 等於 `TEMPLATE_MISSING`，不 crash host process；恢復檔名後驗證通過

## 2. 產出 NotoSansTC subset 字型

- [x] [P] 2.1 取得 NotoSansTC 源 OTF：優先用 `@fontsource/noto-sans-tc@^5.2.9` 已安裝的 ttf；若 fontsource 無 OTF，下載官方 NotoSansTC-Regular OTF 暫存到本機 build 用目錄（不入 git）。驗證：來源檔案能被 `fonttools` / `pyftsubset` 讀取
- [x] 2.2 跑既有 `python scripts/subset-font.py` 配合 `scripts/real-estate-chars.txt`，產出 `src/resources/fonts/NotoSansTC-Subset.ttf`，使 Subsetted Traditional Chinese font SHALL exist and stay under the size budget 的 subset font asset is present scenario 通過。驗證：`ls -la src/resources/fonts/NotoSansTC-Subset.ttf` 存在
- [x] 2.3 驗證 subset 字型 file size 嚴格 < 2,097,152 bytes：跑 `stat -f%z src/resources/fonts/NotoSansTC-Subset.ttf`（macOS）或 `stat -c%s`（Linux）；數字必須小於 2_097_152。對應 Subsetted Traditional Chinese font 的 size budget scenario
- [x] 2.4 驗證 subset 字型涵蓋 `scripts/real-estate-chars.txt` 內全部字元：寫一次性 fontTools 檢查或用 `@pdf-lib/fontkit` register 後渲染字元表所有字、確認無 tofu（missing-glyph box）。對應 Subsetted Traditional Chinese font 的 covers every required glyph scenario

## 3. 驗收：既有測試 + 真機 smoke

- [x] 3.1 執行既有 `src/lib/pdf-renderer.test.ts` 全部 case，使 Existing PDF renderer test suite SHALL pass after assets land 的 renderer test suite turns green scenario 通過。驗證：`npm test -- src/lib/pdf-renderer.test.ts` 全部綠燈、`git diff src/lib/pdf-renderer.test.ts` 為空（測試本身未被修改）
- [ ] 3.2 真機 smoke：跑 `npm run dev` 啟動 Tauri 殼、建立一個 dummy 案件、按「匯出 PDF」、檢查產出 PDF 能用 `pdf-lib` 或系統 PDF reader 開啟且不缺字。驗證：output PDF 第 1 頁含預期中文字、檔案 size > 0
