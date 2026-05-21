## Why

Fish 在 2026/05/21 對焦 MOI/COP 地政 API 後發現：`docs/cop-scrape` 已經爬出 63 個服務的價格、文件與靜態 HTML 說明，但 AIRE 目前地政串接只覆蓋少數土地/建物資料入口，且費用多以固定單價推估。這會造成三個風險：

1. 已爬到的免費或低成本 API 沒有被用來補齊揭露書資料。
2. 呼叫成功、業務成功、無資料、服務拒絕、不可查縣市等狀態沒有一致分類。
3. 客戶看到 MOI 官方紀錄時，無法從 AIRE 判斷哪些呼叫應計費、哪些失敗不應計費、哪些服務還沒串接。

## What Changes

- 建立 MOI API service catalog，從 `docs/cop-scrape/02-服務列表/pricing.json`、`merged_services.json`、`05-服務說明文件/` 讀取服務名稱、官方價格、免費/付費/政府限定、文件位置與單次查詢限制。
- 建立 coverage matrix，對照「爬蟲已知服務」與「AIRE 已實作 endpoint」及「揭露書/案件流程必須資料」。
- 定義成功/失敗判斷層級：HTTP 成功、MOI `STATUS` 成功、`RETURNROWS` 有資料、業務上可使用資料、錯誤碼如 `COP309`。
- 定義費用政策：回傳筆數計費、地段計費、時間計費、免費需驗證、政府限定、未知規則，以及失敗是否 billable。
- 定義備援策略：主 API 失敗時，哪些免費或替代 API 可補資料，哪些情況要轉人工補件或提示不可查。

## Non-Goals

- 不在本 SR 直接實作全部 MOI API。
- 不更改已建立的 `moi-api-usage-ledger-and-cost-audit` usage ledger/dashboard SR；本 SR 是其上游盤點與決策依據。
- 不接付款、發票或正式扣款。
- 不保存屋主個資、完整地址、PDF 或 raw dossier 到 OPCOS。

## Capabilities

### New Capabilities

- `moi-api-service-catalog`: Keeps a local audited catalog of scraped MOI services, pricing, eligibility, and documentation references.
- `land-registry-api-coverage`: Maps AIRE disclosure data needs to MOI services and shows which are wired, missing, optional, or fallback-only.
- `land-registry-cost-policy`: Defines billable amount rules per MOI service and outcome.
- `land-registry-fallback-policy`: Defines fallback behavior when a primary MOI API fails or returns no usable data.

## Related Existing Work

- Existing SR `moi-api-usage-ledger-and-cost-audit` will consume this SR's service codes, outcome classifier, and cost policy.
- Existing land registry billing behavior currently uses fixed local costs; a later implementation pass should replace that decision source with this SR's catalog-driven policy.

## Impact

- Affected specs: `moi-api-service-catalog`, `land-registry-api-coverage`, `land-registry-cost-policy`, `land-registry-fallback-policy`
- Affected future code:
  - `src-tauri/src/land_registry/apis`
  - `src-tauri/src/land_registry/pull.rs`
  - `src-tauri/src/land_registry/billing_log`
  - `src/lib/registry-preview.ts`
  - `src/components/PullParcelDataButton.tsx`
  - `src/components/BalanceMonitor.tsx`
  - `docs/cop-scrape`
- Dependencies 新增: none planned
- 環境變數新增: none planned
