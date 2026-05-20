## Why

上一個 SR 已完成 Step 3 上傳、持久化與 PDF 匯出嵌入，但 DOM 驗證發現 `/cases/:id/preview` 的 HTML 預覽仍只顯示既有 disclosure HTML，沒有呈現 `floorPlanPhoto`。這會讓使用者在網頁預覽中看不到剛上傳的格局圖/土地規劃圖，雖然實際 PDF 匯出已經包含圖片。

## What Changes

- 在 HTML 預覽 renderer 中加入 Step 3 直接上傳圖片頁。
- 住宅案顯示標題 `格局圖`，土地案顯示標題 `土地規劃圖`。
- 有 `floorPlanPhoto` 時顯示實際 `<img>` data URL；沒有圖片時顯示對應佔位文字。
- 新增 renderer 測試，防止網頁預覽與 PDF 匯出再次漂移。

## Impact

- Affected specs:
  - `sr-floor-plan-web-preview`
- Affected code:
  - `src/lib/pdf-engine/html-blocks/location-and-exterior.tsx`
  - `src/lib/pdf-engine/html-renderer.tsx`
  - `src/lib/pdf-engine/__tests__/html-renderer-floor-plan-photo.test.tsx`
