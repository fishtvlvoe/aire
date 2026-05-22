# align-product-ui-with-demo-reference — Bug Log

| ID | 狀態 | 問題 | 證據 | 修正 |
|---|---|---|---|---|
| BUG-001 | Fixed | 登入成功後導向不存在的 `/dashboard`，真登入 E2E 會到錯誤路由，無法驗收到案件後台。 | `src/app/login/page.tsx` 原本 `router.push("/dashboard")`，但 app route 沒有 `/dashboard`，主流程是 `/cases`。 | 改為 `router.push("/cases")`，更新 unit test，新增 Playwright 真登入 E2E。 |
| BUG-002 | Partially Fixed | UI 與後端資料來源落差過大，部分畫面看似完成但仍由 demo/static rows 驅動。 | `src/lib/product-ui-demo-alignment.ts` 有固定 address classification、usage ledger rows、entitlement feature rows；Rust 後端已有 `land_registry_address_lookup`、`BillingLog`、`land_registry_get_balance` 等能力。 | 本次先將新增案件接 `addressLookup()`，設定頁接 `BalanceMonitor`；完整 matrix、usage ledger 明細、entitlement ports 記入 `BACKEND-GAPS.md` 與資料 SR。 |
