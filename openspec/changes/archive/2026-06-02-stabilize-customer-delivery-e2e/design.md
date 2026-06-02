# Design

## Failure Classification

### Stale E2E Contract

這類失敗是測試還在檢查已淘汰的介面 contract：

- 案件頁路由已改為 `/cases/<id>`，預覽頁已改為 `/cases/<id>/preview`。
- workbench tab 已改為 `欄位初審`、`補件與現場`、`正式資料匯入`、`物件資料總覽`、`PDF 檢查`。
- `資料來源` 已是設定側導覽項，不是案件 workbench tab。

修法：更新 E2E 期待到現行 canonical route 與 tab label。

### Delivery Flow Contract

這類失敗要確認產品現況：

- 免費預查完成後應顯示可判讀的物件資料補齊結果，不能只依賴固定筆數文案。
- 正式匯入成功後應顯示實際扣款，測試不應硬編成單一舊金額。
- 訂閱升級入口與品牌設定頁應以目前頁面可見 contract 驗收。

修法：保留行為驗收，但改成檢查現行可見 contract，不用舊文案或舊金額當唯一真相。

## Implementation Contract

### Full E2E Gate

- `pnpm exec playwright test --project=chromium-tauri` SHALL complete without failures for customer-delivery coverage, or remaining failures SHALL be recorded in `tasks.md` with exact reason.
- Canonical route assertions SHALL prefer `/cases/<id>` and `/cases/<id>/preview`.
- Workbench navigation assertions SHALL use current tab labels.

### Pre-Survey Assertions

- Free pre-survey tests SHALL wait for the discovery result area and assert that land/building counts or candidate controls are visible.
- Tests SHALL NOT require a fixed `已找到 1 筆土地、1 筆建物` string unless that exact fixture contract is proven stable.

### Paid Formal Pull Assertions

- Paid formal pull tests SHALL assert successful preview/import and an `實際扣款` amount.
- Tests SHALL NOT assume the historical `NT20` amount when pricing is derived from the current service payload.

## Verification

- Focused Playwright rerun for edited failing specs.
- Full Chromium E2E rerun on local dev server.
- `pnpm type-check`.
- `spectra analyze stabilize-customer-delivery-e2e --json`.
- `spectra validate stabilize-customer-delivery-e2e`.

