## Context

`docs/cop-scrape` currently contains the scraped COP/MOI service inventory:

- `02-服務列表/pricing.json`: 63 services with service id, name, user price, government price, and document URL.
- `02-服務列表/merged_services.json`: merged service metadata, descriptions, tags, pricing labels, and usage counts.
- `03-依類別分類/API/`: MOI_API_001 through MOI_API_046 service JSON files, plus WFS/WMS folders.
- `05-服務說明文件/`: static HTML documentation for all scraped services.
- `00-網站架構圖解.md`: notes that pricing returns 63 services and service_list only returns the first 10.

Current AIRE land registry implementation is narrower:

- `src-tauri/src/land_registry/apis` implements address lookup plus 7/8 parcel-related wrappers such as `building_registry`, `land_registry`, `co_owners`, `land_value`, `mortgages`, `building_ownership`, `building_other_rights`, and `zoning`.
- `openspec/specs/land-registry-parcel-apis/spec.md` currently requires 7 parcel endpoints only.
- `src-tauri/src/land_registry/pull.rs` uses `DEFAULT_UNIT_COST = 10`.
- Individual endpoint wrappers also default `unit_cost: 10.0`.
- `billing_log` records endpoint/cost/transaction id locally, but does not yet store official MOI service code, return rows, error code, official pricing policy, or billable outcome.

## 對焦圖

```
已爬資料 docs/cop-scrape
  ├─ 63 個服務價格與文件
  ├─ 46 個 MOI_API
  ├─ WFS / WMS
  └─ 靜態 HTML 規格
        ↓
服務目錄 service catalog
  ├─ 名稱 / serviceId / serviceCode
  ├─ 免費 / 付費 / 政府限定
  ├─ 計費單位：回傳筆數 / 地段 / 時間
  └─ 文件與輸入輸出欄位
        ↓
Coverage Matrix
  ├─ AIRE 已串
  ├─ 揭露書必接
  ├─ 可當備援
  ├─ 免費可補資料
  └─ 暫不支援/政府限定
        ↓
呼叫判斷與費用政策
  ├─ HTTP 成功不等於業務成功
  ├─ STATUS / CODE / RETURNROWS 分類
  ├─ 成功金額
  └─ 失敗是否 billable
        ↓
後續實作
  ├─ API client 補齊
  ├─ usage ledger
  ├─ 後台費用稽核
  └─ 人工/備援流程
```

## Decisions

### Decision: Treat catalog and integration as separate layers

The service catalog SHALL be generated or maintained from scraped COP/MOI artifacts. AIRE API clients SHALL reference catalog service codes instead of hardcoding pricing inside each endpoint wrapper.

Reasoning:

- The scraped site already exposes service id, pricing, and documentation for far more services than AIRE currently calls.
- Pricing and eligibility can change independently from client parsing code.

### Decision: Coverage matrix drives implementation priority

The next implementation SHALL not blindly wire all 63 services. It SHALL classify every service into one of:

- `required`: needed for core disclosure/case workflow.
- `fallback`: useful when a primary API fails or returns no usable data.
- `free_enrichment`: free or authenticated-free data that improves dossier quality.
- `billing_only`: used for reconciliation but not directly user-facing.
- `restricted`: central-government-only or otherwise unavailable.
- `defer`: known service not currently required.

### Decision: Success classifier must be domain-level

AIRE SHALL classify outcomes using HTTP status plus MOI response fields. HTTP 2xx alone is insufficient.

Outcome levels:

- `transport_success`: HTTP request succeeded.
- `moi_success`: MOI `STATUS = 1`.
- `empty_success`: request succeeded but `RETURNROWS = 0` or expected payload is null and this is an acceptable no-data state.
- `domain_failure`: MOI returned an error `CODE`, such as `COP309`.
- `restricted_failure`: service or input range is not available.
- `parse_failure`: AIRE cannot parse the payload.

### Decision: Cost policy must be explicit per service and outcome

The cost calculator SHALL use service-specific rules:

- `price_by_row`: amount = successful returned rows times unit price.
- `price_by_location`: amount = charged location/section count times unit price.
- `price_by_duration`: amount = billable time window times unit price.
- `free`: amount = 0.
- `auth_free`: amount = 0 but requires configured credentials.
- `restricted`: not user-billable because AIRE should not call it for normal users.
- `unknown`: blocked from production billing until manually resolved.

Failures SHALL default to non-billable unless the catalog or MOI billing evidence proves otherwise.

## Current Evidence Snapshot

| Evidence | Current Finding | Risk |
| --- | --- | --- |
| `pricing.json` | 63 services exist; includes free, paid, authenticated-free, and restricted entries | AIRE may miss useful free/paid data |
| `merged_services.json` | `MOI_API_001` to `MOI_API_006` are each “單筆 1 元”; `MOI_API_007` is “依地段每段 10 元” | Current fixed 10 cost can overstate or misstate |
| `src-tauri/src/land_registry/pull.rs` | Uses `DEFAULT_UNIT_COST = 10` on each successful API result | Does not match row-based official pricing |
| Endpoint wrappers | Most wrappers use `unit_cost: 10.0` | Pricing is duplicated and not auditable |
| `MOI_API_041` | 帳務查詢 API is free/authenticated | Can be used for reconciliation if allowed |
| Fish screenshot | `COP309`, success/failure counts, return rows, unpaid amount `27.00` | Need official-style ledger and cost policy |

## Open Questions

1. Which AIRE output is authoritative for “must have” fields: current disclosure preview, future AIRE child site, or a legal compliance checklist?
2. Should authenticated-free APIs be called automatically, or only after user confirms MOI credential usage?
3. Should restricted government-only APIs be hidden from normal AIRE UI but kept in catalog for transparency?

## Relationship To Existing SR

`moi-api-usage-ledger-and-cost-audit` records and displays API calls. This SR defines the source catalog and classification rules that the ledger should use.

If both are implemented, execution order should be:

1. This SR: catalog, coverage matrix, classifier, cost policy, fallback policy.
2. Existing ledger SR: append-only call records and dashboard, using this SR's service codes and cost rules.
