## Why

AIRE 目前已經把 `新增案件` 改成地址優先，也擋掉 browser/mock `0001/0001/0001` 假成功，但真正可交付的資料流仍未打通。Fish 在本機 Web 輸入 `台南市永康區勝利街58巷4號` 時，系統無法查出地段、地號、建號；App/Tauri 端雖然有 `land_registry_address_lookup`，但 live probe 顯示 COP 地址查詢回 0，而 NLSC/便民查詢回 `PERMISSION DENIED`。另一方面，已知地政鍵打 COP 正式資料可成功，代表問題不是 COP 全壞，而是「地址 discovery → confirmed registry key → formal COP pull → saved JSON」沒有串成可驗收流程。

這個 change 是 `desktop-fullflow-r02-cop-parity` 的前置修正。完成前不得把 Desktop fullflow 當成可驗收，也不得先做 App 打包驗收或 auto-update。

## What Changes

- 新增本機 Web 與 Desktop App 共用的地址 discovery 狀態模型，明確區分 COP 地址查詢成功、COP 回 0、NLSC 權限被拒、dev fixture、人工補填與已確認地政鍵。
- 新增本機 Web 可用的 localhost discovery proxy：瀏覽器不得直接打便民/NLSC/COP 外部服務，而是呼叫同源本機 API，再由 Node/Tauri/Rust 後端代理查詢與保存診斷。
- 修改 `/cases/new` 流程，讓查詢失敗、候選資料與人工確認都能保存到本機資料庫或 mock store，而不是只在畫面顯示空白。
- 修改正式 COP 查詢 gate：只有 confirmed registry key 可以打付費 COP；raw address、未確認候選、mock placeholder 都不得觸發正式查詢。
- 新增費用保護：live E2E 必須先查 cache，同一 registry key 重查必須產生 cache-hit run 且 `totalCostCents = 0`。
- 修改物調/PDF 資料來源：只讀已保存的正式 COP JSON 或已標示的候選/人工資料，不在產 PDF 時重新打付費 COP。
- 新增交接與驗收證據要求，讓另一個 Agent 可先補規格/驗收，我再依規格實作。

## Non-Goals

- 不重做 UI 骨架。
- 不做 SaaS parity。
- 不做 desktop auto-update。
- 不把 NLSC/便民候選或 dev fixture 當正式謄本資料。
- 不使用 Fish 或平台共用 key 取代客戶自己的 COP 憑證。
- 不用 mock `0001/0001/0001` 假裝地址查詢成功。

## Capabilities

### New Capabilities

- `desktop-local-address-to-cop-e2e`: 本機 Web 與 Desktop App 共用地址 discovery、確認、正式 COP 查詢與保存資料流。

### Modified Capabilities

- `land-registry-address-lookup`: 增加 discovery 狀態、失敗診斷、dev fixture 邊界與產品可見錯誤保存。
- `local-address-discovery-proxy`: 讓本機 Web 透過 localhost 後端代理查地址 discovery，避免 CORS、來源權限與憑證外洩。
- `case-management`: 新增案件頁保存候選/錯誤/人工確認，建立案件前必須有 confirmed registry match。
- `land-registry-billing-log`: 正式 COP 查詢、cache hit、sourceRunId、error log 與 JSON 明細必須可追溯。
- `disclosure-document-generation`: 物調與 PDF 僅使用已保存 JSON，不重新觸發付費查詢。

## Impact

- Affected specs: desktop-local-address-to-cop-e2e, land-registry-address-lookup, local-address-discovery-proxy, case-management, land-registry-billing-log, disclosure-document-generation
- Affected code:
  - Modified: `src/lib/land-registry-api.ts`, `src/lib/mock-backend.ts`, `src/app/(dashboard)/cases/new/page.tsx`, `src-tauri/src/land_registry/pull.rs`, `src-tauri/src/commands/cases.rs`, `src/lib/pdf-engine/assemble-dossier-data.ts`, `next.config.mjs`
  - New: `src/app/api/local/address-discovery/route.ts`, `src/lib/server/local-address-discovery-proxy.ts`, `src/lib/server/__tests__/local-address-discovery-proxy.test.ts`
  - Tests: `src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx`, `src/lib/__tests__/land-registry-api.test.ts`, `src/lib/__tests__/mock-backend.test.ts`, `src-tauri/tests/cop_api_live.rs`, `src-tauri/tests/cop_api_yunong_live.rs`, Playwright local smoke
  - Docs: `docs/handoff/desktop-local-address-to-cop-e2e-handoff.md`, release acceptance report after implementation
