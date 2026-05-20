## Context

`renderDisclosureHtml()` 是 `/cases/:id/preview` 與 Step 5 web preview 使用的 HTML renderer。上一個 SR 只把 `floorPlanPhoto` 接進 React PDF 文件樹，因此匯出的 PDF 有圖，但 HTML 預覽沒有同頁面。

## Decisions

### Decision: HTML 預覽沿用既有圖片頁 pattern

新增 `HtmlFloorPlanPhoto`，放在 `location-and-exterior.tsx`，沿用 `HtmlLocationMap`、`HtmlAerialPhoto`、`HtmlExteriorPhoto` 的資料型態與頁面視覺：固定高度圖片框、`objectFit: contain`、無圖時顯示佔位文案。

### Decision: 頁面位置對齊 PDF 文件樹

`renderDisclosureHtml()` 在 `HtmlExteriorPhoto` 後插入一頁 `HtmlFloorPlanPhoto`。住宅案 title 為 `格局圖`，土地案 title 為 `土地規劃圖`，與 `PdfDocument` 中 `FloorPlanPhotoPage` 的位置與命名一致。

### Decision: Data URL 使用既有 browser-safe helper

HTML renderer 直接復用 `uint8ToDataUrl()`，避免 PNG/JPEG mime 判斷在 HTML 與 React PDF 各自分叉。
