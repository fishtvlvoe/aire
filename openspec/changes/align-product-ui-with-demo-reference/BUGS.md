# align-product-ui-with-demo-reference — Bug Log

| ID | 狀態 | 問題 | 證據 | 修正 |
|---|---|---|---|---|
| BUG-001 | Fixed | 登入成功後導向不存在的 `/dashboard`，真登入 E2E 會到錯誤路由，無法驗收到案件後台。 | `src/app/login/page.tsx` 原本 `router.push("/dashboard")`，但 app route 沒有 `/dashboard`，主流程是 `/cases`。 | 改為 `router.push("/cases")`，更新 unit test，新增 Playwright 真登入 E2E。 |
