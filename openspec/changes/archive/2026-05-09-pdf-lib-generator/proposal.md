## Problem

不動產說明書 PDF 生成依賴 Puppeteer + headless Chrome，但 macOS Sequoia 的安全機制（SIGABRT）kill 所有 headless Chromium 進程，導致 `/api/listings/[id]/pdf` 回 500。此專案最終以 Electron app 形式交付給客戶，客戶環境可能也遇到同樣問題。

## Root Cause

`chromium-launcher.ts` 啟動 headless Chrome 做 HTML→PDF 轉換。macOS Sequoia 25.3.0 安全機制對未簽署或從 CLI 啟動的 Chromium 進程發送 SIGABRT。所有 Chromium 變體（Google Chrome、Brave、Chrome for Testing、Electron）皆受影響。

## Proposed Solution

用 `pdf-lib`（已安裝 v1.17.1）純 Node.js 生成 PDF，完全移除 Puppeteer 依賴：

1. 新建 `src/lib/pdf-generator/pdflib-dossier.ts`：
   - 載入背景圖（cover + content 頁的 PNG/JPG）嵌入 PDF 作為每頁底圖
   - 在背景圖上方疊加文字（物件編號、公司名稱、經紀人等），座標對齊背景圖欄位位置
   - LLM 生成的 Markdown 內文轉為多頁 PDF 文字流（使用中文字型）
   - 頁首/頁尾加公司名、頁碼、日期

2. 修改 `dossier.ts` 的 `generateDossierPDF()`：
   - 改呼叫 pdf-lib 方案而非 Puppeteer
   - 保持相同的函式簽名，不影響 API route

3. 中文字型處理：
   - 嵌入 Noto Sans TC 子集字型（或 fontkit 動態載入）
   - pdf-lib 預設只支援 Latin 字型，需 fontkit 擴充

## Non-Goals

- 不移除 Puppeteer 相關檔案（survey/sales-dm 模板暫時保留）
- 不修改 HTML 預覽系統（DisclosurePreview 元件）
- 不改動 API route 介面

## Success Criteria

1. `GET /api/listings/3/pdf?type=disclosure` 在 macOS 本機回傳 PDF 檔案（不 500）
2. PDF 第一頁為封面背景圖 + 品牌資訊
3. PDF 第二頁起為不動產說明書內文，背景圖上疊加填入的欄位值
4. 中文文字正確顯示（不出現 tofu 方塊）

## Impact

- Affected code:
  - New: src/lib/pdf-generator/pdflib-dossier.ts
  - Modified: src/lib/pdf-generator/dossier.ts
  - New: public/fonts/NotoSansTC-Regular.ttf（或類似中文字型）
