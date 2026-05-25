## Problem

目前 AIRE 有三個會誤導客戶的流程問題：

1. 在 `補件清單`、`PDF 預覽`、`列印與匯出` 點案件名稱，都導到 `/cases/:id` 的 `說明書工作台`，讓使用者以為側欄選單沒有意義。
2. `說明書工作台` 內的 `資料來源`、`補件`、`費用`、`PDF 檢查` 看起來像可切換的按鈕，但目前只是一整頁靜態內容。
3. `費用紀錄` 只顯示固定文案與一個總數，沒有列出地政 API 每次查詢的服務、成功/失敗、金額與總計，容易讓客戶誤會地政費用與 AIRE 方案費用混在一起。
4. `資料來源` 只說明 PDF 圖資欄位，沒有讓基本款客戶手動上傳地籍圖、空拍圖、格局圖、地標圖補進 PDF。

## Root Cause

- 案件列表列點擊目標被硬寫成 `/cases/:id`，沒有依 `view` 切換目的地。
- 工作台的分頁與補件動作沒有本機互動狀態，未完成的後端動作雖然文字寫「待後端串接」，但外觀仍像按鈕。
- Rust 已有 `BillingLog` 與 `land_registry_get_balance`，但沒有把明細列表暴露給前端；前端 `BillingPanel` 也沒有使用明細資料。

## Proposed Solution

- 依目前二級頁決定案件列點擊目標：
  - 案件總覽、說明書工作台、補件清單：進入 `/cases/:id`，必要時帶入工作台 tab。
  - PDF 預覽：進入 `/cases/:id/preview`。
  - 列印與匯出：進入 `/cases/:id/preview` 並保留匯出/列印情境。
- 將 `DemoAlignedWorkbench` 的 `欄位 / 資料來源 / 補件 / 費用 / PDF 檢查` 改為真正可切換的 tabs，只顯示目前 tab 的內容。
- 將未完成後端動作改成狀態說明，不呈現為主要按鈕；已可處理的本機動作要有 visible feedback。
- 新增地政 API 費用明細查詢 IPC 與前端 API，讓 `費用紀錄` 顯示服務名稱、交易序號、狀態、每次費用與總計。
- 在 `資料來源` 的 PDF 圖資欄位新增手動上傳入口狀態，讓基本款也能補齊 PDF 圖資；進階款才負責自動取得/整理。

## Non-Goals

- 不實作正式付款或儲值。
- 不改變地政 API 的實際扣款規則。
- 不把 Google、空拍、AI 格局圖方案費混入地政 API 明細。

## Success Criteria

- `PDF 預覽` 與 `列印與匯出` 的案件列不再導回 `說明書工作台`。
- 工作台 tabs 可切換，而且每個 tab 只顯示該 tab 的內容。
- 工作台內沒有看起來可執行但沒有反應的假按鈕。
- `費用紀錄` 顯示地政 API 明細表、成功/失敗費用、總計，且明確寫出 AIRE 方案費與地政 API 費用分開。
- `資料來源` 提供地籍圖、空拍圖、格局圖、地標圖的上傳位置與狀態，不把基本款客戶鎖在無法補圖的狀態。

## Impact

- Affected code:
  - Modified: src/app/(dashboard)/cases/page.tsx
  - Modified: src/components/workbench/DemoAlignedWorkbench.tsx
  - Modified: src/app/(dashboard)/settings/page.tsx
  - Modified: src/lib/land-registry-api.ts
  - Modified: src/lib/mock-backend.ts
  - Modified: src-tauri/src/land_registry/billing_log/mod.rs
  - Modified: src-tauri/src/land_registry/balance.rs
  - Modified: src-tauri/src/lib.rs
  - Modified: src/app/(dashboard)/cases/__tests__/page.test.tsx
  - Modified: src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - Modified: src/app/(dashboard)/settings/__tests__/page.test.tsx
  - Modified: e2e/full-product-flow-ia-ux-acceptance.spec.ts
