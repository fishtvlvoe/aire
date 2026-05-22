# disclosure-registry-autofill-system-update — Bug Notes

## 2026-05-22 UI / backend closure issues

### BUG-001: 工作台按鈕看起來像截圖，沒有後端閉環

- Report: `重新查詢`、`產生補件清單`、`資料來源`、`補件`、`費用`、`PDF 檢查` 等工作台入口目前缺少可驗證的後端動作。
- Scope: This is not a pure layout bug. It belongs to the remaining registry autofill engine, usage ledger, supplement generation, and PDF output tasks.
- Tracking: Existing tasks `3.1`-`3.4`, `4.1`-`4.3`, `5.2`-`5.4`, and `6.3`.

### BUG-002: 地政查詢與新增案件流程重疊

- Report: `地政查詢` and `新增案件` currently look like the same flow, and case creation can happen without a completed registry decision.
- Immediate fix: Case creation now requires pressing `判斷地政資料` first, and the primary button text changes to `先判斷地政資料` before classification.
- Remaining scope: Decide whether `地政查詢` should be a standalone lookup dashboard or only an entry into new-case creation.

### BUG-003: Address classification over-labels normal building cases as farmhouse

- Report: Address `台南市永康區勝利街58巷4號1樓` was displayed as `農舍` even though it is a building.
- Immediate fix: Generic land + building lookup now displays `建物`; only text explicitly containing `農舍` displays `農舍`.
- Remaining scope: Replace heuristic labels with official registry / property-type coverage output.

### BUG-004: 地政資料 sidebar destinations render unrelated settings content

- Report: `資料來源` showed `授權與升級`, brand/log tabs, license serial, land API settings, MCP Hub, and Super Admin content.
- Immediate fix: `資料來源` and `費用紀錄` now render land-data-specific content only. They no longer show SettingsTabs, authorization blocks, upgrade toggles, API credential forms, MCP Hub, or Super Admin.
- Remaining scope: Wire `費用紀錄` to the real usage ledger after tasks `3.3` and `5.4`.

### BUG-005: 產出文件 sidebar destinations fall back to case overview

- Report: `PDF 預覽` and `列印與匯出` showed `案件總覽`.
- Immediate fix: `/cases?view=pdf` and `/cases?view=export` now have their own page scopes and ask the user to select a case first.
- Remaining scope: Add real case-level preview/export actions once registry autofill and PDF output state are complete.

### BUG-006: Case list status badge and action icons collide

- Report: The status badge and icon actions were visually squeezed together in the case table.
- Immediate fix: The action column is wider and icon buttons are more compact.
