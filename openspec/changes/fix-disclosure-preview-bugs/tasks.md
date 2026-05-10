# Tasks — fix-disclosure-preview-bugs

## 1 修正背景圖上傳 TypeError

- [ ] 1.1 修正 `src/app/admin/(dashboard)/templates/page.tsx` 的 stale event reference：在 async 邊界前捕獲 `const input = event.currentTarget`，`finally` 區塊改用 `input.value = ''` [Tool: copilot]

## 2 修正預覽欄位顯示

- [ ] [P] 2.1 重啟 dev server（清除 `.next` 快取 + `ulimit -n 65536`），確認 DisclosureFieldOverlay Fragment 修正生效 [Tool: sonnet]
- [ ] 2.2 用瀏覽器開啟 `/listings/3/documents/preview`，截圖確認欄位是否正確定位在 A4 頁面上 [Tool: sonnet]
- [ ] 2.3 若欄位仍不顯示，檢查 PreviewPage 的 `<div className="absolute inset-0">` 是否正確傳遞定位上下文給 Fragment 內的 absolute 子元素，必要時加 debug 樣式確認 [Tool: sonnet]

## 3 驗收

- [ ] 3.1 截圖驗證預覽頁面：有資料欄位顯示文字、無資料欄位顯示灰色 placeholder [Tool: sonnet]
- [ ] 3.2 截圖驗證背景圖上傳功能無 TypeError [Tool: sonnet]
- [ ] 3.3 `npm run build` 通過零錯誤 [Tool: copilot]
