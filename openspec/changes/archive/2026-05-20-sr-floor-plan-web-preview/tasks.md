## 1. Artifact 與一致性

- [x] 1.1 建立 `sr-floor-plan-web-preview` proposal/design/spec/tasks，並以 `spectra analyze sr-floor-plan-web-preview --json` 確認沒有 Critical finding。

## 2. HTML renderer 測試

- [x] 2.1 Requirement: Web preview shows uploaded floor-plan photo / Decision: Data URL 使用既有 browser-safe helper：新增 `html-renderer-floor-plan-photo` 測試，住宅資料含 `floorPlanPhoto` 時 HTML 包含 `格局圖`、`alt="格局圖"` 與 `data:image/png;base64,`。
- [x] 2.2 Requirement: Web preview shows uploaded floor-plan photo：新增土地測試，土地資料無 `floorPlanPhoto` 時 HTML 包含 `土地規劃圖` 與 `請上傳規劃圖`。

## 3. HTML renderer 實作

- [x] 3.1 Requirement: Web preview shows uploaded floor-plan photo / Decision: HTML 預覽沿用既有圖片頁 pattern / Decision: Data URL 使用既有 browser-safe helper：新增 `HtmlFloorPlanPhoto` HTML block，支援 `{ photo, title, tokens }`、共用 image data URL helper 與 title-specific 佔位文字。
- [x] 3.2 Requirement: Web preview shows uploaded floor-plan photo / Decision: 頁面位置對齊 PDF 文件樹：在 `renderDisclosureHtml()` 的建物外觀頁後插入格局圖/土地規劃圖頁，頁碼與 footer 正常遞增。

## 4. 驗證

- [x] 4.1 跑 `npm test -- html-renderer-floor-plan-photo`。
- [x] 4.2 跑 `npm test -- html-renderer-floor-plan-photo floor-plan-photo-page document.test.tsx`。
- [x] 4.3 跑 `npm run type-check`。
- [x] 4.4 用 DOM 檢查 `/cases/:id/preview`：有上傳圖時 HTML DOM 包含 `img[alt="格局圖"]`，手機/桌機無水平 overflow，console/page error 為空。
