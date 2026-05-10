## Problem

不動產說明書預覽頁面有兩個 bug：

1. **預覽欄位不顯示**：DisclosureFieldOverlay 使用 React Fragment（`<>`）包裹多個 absolute-positioned 子元素，但 Fragment 不產生 DOM 節點。雖然先前已從 `<div className="relative">` 改為 Fragment 修正了定位上下文問題，使用者仍回報「畫面沒有內容」。需排查是否有其他渲染問題（如 dev server EMFILE 快取、欄位座標、或其他 CSS 問題）。

2. **背景圖上傳後 TypeError**：`src/app/admin/(dashboard)/templates/page.tsx` 第 83 行，`event.currentTarget.value = ''` 在 async IIFE 的 `finally` 區塊中執行時拋出 `Cannot set properties of null (setting 'value')`。原因是 React synthetic event 在 async 邊界後被回收，`event.currentTarget` 變為 null。

## Root Cause

**Bug 1**：DisclosureFieldOverlay 已改用 Fragment，absolute 子元素正確參照 PreviewPage 的 `<section>`（794×1123px）作為定位上下文。但可能因 dev server EMFILE 錯誤導致 Turbopack 無法偵測檔案變更、持續提供舊版快取代碼，或是欄位資料確實為空（listing 缺少 supplementary_data）導致所有欄位都顯示空白（無 placeholder 視覺回饋）。

**Bug 2**：React synthetic event pooling 機制。在 `onChange` handler 中使用 `(async () => { ... finally { event.currentTarget.value = '' } })()` 時，`await` 之後 event 物件已被回收，`currentTarget` 為 null。

## Proposed Solution

**Bug 1**：
- 確認 DisclosureFieldOverlay Fragment 修正確實生效（重啟 dev server 清除快取）
- 為空欄位增加視覺化 placeholder（已實作 JS-based placeholder `<span>`，需確認運作正常）
- 若 listing 資料不完整，確保 placeholder 文字正確顯示在對應座標位置

**Bug 2**：
- 在 async 邊界前先用 `const input = event.currentTarget;` 捕獲 DOM 元素參照
- `finally` 區塊改用 `input.value = ''` 而非 `event.currentTarget.value = ''`

## Non-Goals

- 不重新設計欄位座標系統或版型管理功能
- 不修改 API route 邏輯或資料結構
- 不處理 EMFILE 系統層問題（這是 macOS ulimit 設定，非程式碼問題）

## Success Criteria

1. 預覽頁面正確顯示所有欄位在 A4 背景上的對應位置
2. 有資料的欄位顯示資料文字，無資料的欄位顯示灰色 placeholder 文字
3. 背景圖上傳功能不再拋出 TypeError
4. contentEditable 編輯後 blur 時正確儲存修改值

## Impact

- Affected code:
  - Modified: src/components/DisclosureFieldOverlay.tsx, src/app/admin/(dashboard)/templates/page.tsx
  - New: （無）
  - Removed: （無）
