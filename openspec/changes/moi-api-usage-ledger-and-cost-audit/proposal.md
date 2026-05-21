## Why

Fish 在 2026/05/21 測試地政 API 後看到 MOI 介接紀錄與未付款金額不一致：`MOI_API_005`、`MOI_API_037` 等服務有成功/失敗紀錄，但 AIRE/OPCOS 後台目前沒有讓客戶對照成功次數、失敗原因、回傳筆數與正確費用的明細。客戶必須能看懂自己每次地政 API 呼叫是否成功、失敗原因與實際花費，否則無法核對帳務。

## What Changes

- 新增地政 API usage ledger，記錄每次 MOI API 呼叫的 service code、request id、status、error code、message、return rows、startedAt、finishedAt、charged amount、billable flag。
- 新增費用表設定，將 `MOI_API_005 地籍建物所有權部資料服務`、`MOI_API_037 門牌模糊檢索建號服務` 等 API 對應到可稽核的單價與是否失敗不計費規則。
- 新增後台查詢畫面，讓使用者與 admin 可依日期、服務、成功/失敗、歷程編號查詢 API 呼叫紀錄、成功/失敗次數、回傳筆數與累計未付款金額。
- 修改地政 API client，將成功與失敗都寫入 usage ledger，並確保 COP309 類資料範圍錯誤不被誤算成成功費用。
- 新增測試覆蓋成功/失敗 log、費用計算、日期區間統計與 COP309 不可查詢縣市錯誤。

## Non-Goals

- 不接實際付款、發票或自動扣款。
- 不更改 MOI 官方 API 的呼叫參數與商業規則；只記錄與核對 AIRE 端可見的呼叫結果。
- 不上傳屋主個資或案件 PDF 到 OPCOS；usage ledger 只保存 API 服務代碼、狀態、錯誤碼、筆數與費用必要資料。
- 不在本 SR 內修正地政 API 查詢邏輯本身，除非記錄缺失會造成費用或狀態錯誤。

## Capabilities

### New Capabilities

- `land-registry-api-usage-ledger`: Records MOI API call success/failure, service code, rows, error payload summary, and billable cost.
- `land-registry-cost-audit-dashboard`: Displays API usage counts, failure counts, return rows, and unpaid cost totals for customer/admin review.

### Modified Capabilities

- `land-registry-billing-log`: Existing land registry billing behavior must align with the ledger and pricing table so totals match MOI-facing records.

## Impact

- Affected specs: `land-registry-api-usage-ledger`, `land-registry-cost-audit-dashboard`, `land-registry-billing-log`
- Affected code:
  - New: `openspec/changes/moi-api-usage-ledger-and-cost-audit/specs/land-registry-api-usage-ledger/spec.md`, `openspec/changes/moi-api-usage-ledger-and-cost-audit/specs/land-registry-cost-audit-dashboard/spec.md`
  - Modified: `src-tauri/src/land_registry`, `src-tauri/src/land_registry/billing_log`, `src/components/settings`, `src/app/(dashboard)/settings`, `src/lib/land-registry-api.ts`, `e2e/license-verification.spec.ts`
  - Removed: none
- Dependencies 新增: none planned
- 環境變數新增: none planned
