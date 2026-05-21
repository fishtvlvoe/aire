## Problem

瀏覽器版 `@react-pdf/renderer` 產生 PDF 時，位置圖、空拍圖、建物外觀三頁的圖片完全空白（顯示佔位文字）。即使 `assembleDossierData` 成功取得 `Uint8Array` 圖片資料，PDF 中仍無圖片。

## Root Cause

三個 PDF block 元件（`location-map.tsx`、`aerial-photo-page.tsx`、`exterior-photo-page.tsx`）使用 Node.js 專屬語法：
```
src={{ data: Buffer.from(bytes), format: "png" as const }}
```
此語法僅在 Node.js 環境（Tauri 桌面版）有效；瀏覽器版 `@react-pdf/renderer` 不支援 `{ data: Buffer, format }` 物件，會靜默忽略圖片。

額外問題：`ExteriorPhotoPage` 將街景圖（Google Street View API 回傳 JPEG）標記為 `format: "png"`，格式不符。

## Proposed Solution

已修復（commit `7c87f99`）：

1. 三個元件各自加入 `uint8ToDataUrl(bytes: Uint8Array): string` helper，以 magic bytes 偵測格式（`FF D8` → JPEG；其他 → PNG），轉為 `data:image/…;base64,…` 字串。
2. `Image` 元件改傳 data URL 字串，相容 Node.js 與瀏覽器環境。

## Success Criteria

- 下載的 PDF 在「位置圖」頁出現 OpenStreetMap 地圖圖片（非「待取得地圖資料後自動填入」佔位）
- 下載的 PDF 在「空拍圖」頁出現國土測繪中心正射影像（非「正在從政府圖資服務取得…」佔位）
- 下載的 PDF 在「建物外觀」頁出現 Google Street View 街景圖（非「請於現場拍攝後上傳」佔位）
- TypeScript build 0 errors
- 現有 react-pdf render engine 相關測試全數通過

## Impact

- Affected code:
  - Modified: src/lib/pdf-blocks/location-map.tsx
  - Modified: src/lib/pdf-blocks/aerial-photo-page.tsx
  - Modified: src/lib/pdf-blocks/exterior-photo-page.tsx
