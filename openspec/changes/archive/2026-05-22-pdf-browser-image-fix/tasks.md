## 1. 驗證 PDF 圖片顯示

- [x] [P] 1.1 `uint8ToDataUrl()` 回傳正確 data URL：給定 PNG magic bytes（89 50 4E 47 開頭）輸入時 mime 為 `image/png`；給定 JPEG magic bytes（FF D8 開頭）輸入時 mime 為 `image/jpeg`。驗證方式：在 `src/lib/pdf-blocks/location-map.tsx`、`aerial-photo-page.tsx`、`exterior-photo-page.tsx` 各自提取 `uint8ToDataUrl` 至 `src/lib/pdf-blocks/__tests__/uint8-to-data-url.test.ts`，斷言對 4-byte PNG header 和 3-byte JPEG header 輸出正確 data URL prefix。2026-05-22 已跑 `pnpm test src/lib/pdf-blocks/__tests__/uint8-to-data-url.test.ts`，1 file / 2 tests passed。

- [ ] [P] 1.2 E2E 驗證 PDF 圖片非佔位頁：使用 `台南市永康區勝利街58巷4號1樓` 的 case（case ID `b24e336a-46db-4cf4-845d-cbd95abee3f8`），於 dev server 取 `/cases/{id}/preview` 頁面，點擊「匯出 PDF」，確認下載的 PDF 三個圖片頁（位置圖/空拍圖/建物外觀）至少有一頁顯示實際圖片（非「待取得」或「請上傳」佔位文字）。驗證方式：Chrome MCP 截圖 PDF 下載成功 toast，以及在 `assembleDossierData` 中 console.log 確認 `locationMapImage`、`aerialPhoto`、`exteriorPhoto` 為非 null 的 Uint8Array。

> Cleanup 2026-05-22: 程式與 unit test 已存在，但 E2E 圖片下載驗證尚未完成；此 SR 先停用到 parked，不封存為完成。
