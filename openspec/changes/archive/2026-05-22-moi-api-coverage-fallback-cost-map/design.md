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

## Disclosure Field Reverse Map

This SR also reverses from the document side: AIRE should not ask users to manually fill fields that are already available from MOI/COP or related public GIS data.

```
不動產說明書 16 章 / 舊版欄位總表 / 類型清單
        ↓
欄位來源分類
  ├─ 地政 API 可查
  ├─ 地政 API + 圖資可推
  ├─ 公開資料/實登可查
  ├─ 現場必問
  ├─ 秘書/合約後補
  └─ 仍應留白手寫
        ↓
AIRE 欄位與 API 覆蓋矩陣
  ├─ 已自動帶入
  ├─ 有 API 但未帶入
  ├─ 需新接 API
  ├─ 不可自動判斷
  └─ 需人工確認
```

### Document-side evidence

| Source | Finding |
| --- | --- |
| `docs/dossier-implementation-spec.md` | Target output is a 16-chapter disclosure PDF. It expects building chapters for building mark, attached land mark, other rights, tax, transaction history, amenities, photos, signature; land chapters include land mark, ownership/share, land condition survey, controls, and tax. |
| `docs/0417-new/建安不動產欄位總表.md` | Many required fields explicitly cite `謄本`, `地政資料`, `地籍圖`, `使用分區資料`, `公開資料` as source. |
| `docs/0417-old/農地_秘書後補清單.docx` | Secretary checklist asks for land registry mark, ownership, other rights, cadastral map, zoning map, national land/urban planning, announced value, announced land price, legal restrictions, farmland/farmhouse checks. |
| `docs/0417-old/農舍_秘書後補清單.docx` | Farmhouse checklist asks for building number, registered area, main/aux/common areas, land/building number check, other rights, floor/total floor, legal use, completion date, legal farmhouse and ownership checks. |
| `docs/0417-old/透天別墅_秘書後補清單.docx` | Townhouse checklist asks for the same building registry fields plus arcade/garage/mezzanine/top addition/road condition checks. |
| `src/lib/disclosure-schema-residential.ts` | Current residential core form is only 5 tabs and a small subset of the official document fields. |
| `src/lib/disclosure-schema-land.ts` | Current land core form is only 4 tabs and lacks several land control, legal restriction, cadastral map, and farmland-specific fields. |
| `src/lib/registry-preview.ts` | Preview already maps several MOI fields into document targets, but it does not cover all old document/source requirements. |

### Fields that should stop being blank when MOI data exists

| Document area | Fields currently likely blank or manual | Likely source |
| --- | --- | --- |
| 建物標示 | 建號、門牌、坐落地號、主要用途、主要建材、建物層數、總面積、主建物/附屬/共有/車位面積、建築完成日、建設公司 | `MOI_API_004` plus `MOI_API_026` for mark/right range query |
| 建物所有權 | 所有權人類別、登記日期、登記原因、權利範圍、權狀字號、其他登記事項 | `MOI_API_005`, `MOI_API_028` |
| 建物他項權利 | 抵押/不動產役權/典權、擔保債權金額、權利人、共同擔保地建號 | `MOI_API_006` |
| 土地標示 | 地段、地號、面積、地目/使用地類別、公告現值、公告地價、坐標、地上建物建號數量、登記日期/原因 | `MOI_API_001`, `MOI_API_014`, `MOI_API_044` when allowed |
| 土地所有權 | 所有權人類別、權利範圍、持分比例、申報地價、前次移轉年月、前次移轉現值、其他登記事項 | `MOI_API_002`, `MOI_API_016`, `MOI_API_017` |
| 土地他項權利 | 抵押、地上權、其他用益權利、共同擔保、限制內容摘要 | `MOI_API_003` |
| 土地限制/風險 | 非都市土地使用管制、農舍註記、污染場址、地籍圖重測、公告徵收、廢棄物註記 | `MOI_API_018`, `MOI_API_019`, `MOI_API_020`, `MOI_API_021`, `MOI_API_022`, `MOI_API_042` |
| 土地/建物定位與轉換 | 門牌查建號、建號查詢、新舊地建號轉換、分割合併前後地建號、地段查詢 | `MOI_API_011`, `MOI_API_013`, `MOI_API_015`, `MOI_API_036`, `MOI_API_040`, `MOI_API_043` |
| 地圖/圖資 | 地籍圖、土地位置概圖、地籍圖詮釋、WMS/WFS 圖層 | `MOI_API_023`, `MOI_API_024`, WMS/WFS services |

### Property type implications

| Type | What is missing from a pure generic building/land form |
| --- | --- |
| 農地 | 農牧用地/特定農業區/一般農業區、農舍可否、農用限制、套繪/分割限制、農路/灌溉/排水、使用編定與地籍圖對照。 |
| 農舍 | 建物資料 plus 土地/農用資料 must be tied together: legal farmhouse, land/building ownership split, farm-use qualification/restrictions, utilities and farm road context. |
| 透天別墅 | Building mark/ownership can be fetched, but arcade/garage/mezzanine/top addition/floor use/road width remain mixed: registry can provide mark data, field visit still confirms physical use. |
| 建地/商業地/工業地/鄉村區建地/其他土地 | Land registry alone is not enough; zoning, non-urban category, controls, maps, restrictions, and public facility/reservation evidence are needed. |

### Current gap statement

The immediate product problem is not only “some API endpoints are missing.” The larger gap is that AIRE lacks a field-level source matrix. Without it, the UI can leave blanks even when:

- the value already exists in current `land_registry_data`;
- the value exists in a scraped MOI API that is not wired yet;
- the value requires a free authenticated API;
- the value should remain manual because it is a physical/contract observation.

Therefore implementation must produce a document-field coverage report before adding more endpoint wrappers.

## Open Questions

1. Which AIRE output is authoritative for “must have” fields: current disclosure preview, future AIRE child site, or a legal compliance checklist?
2. Should authenticated-free APIs be called automatically, or only after user confirms MOI credential usage?
3. Should restricted government-only APIs be hidden from normal AIRE UI but kept in catalog for transparency?
4. For property-type-specific output, should the first full coverage pass prioritize 農地/農舍/透天, or all 13 old v3 property types?

## Relationship To Existing SR

`moi-api-usage-ledger-and-cost-audit` records and displays API calls. This SR defines the source catalog and classification rules that the ledger should use.

If both are implemented, execution order should be:

1. This SR: catalog, coverage matrix, classifier, cost policy, fallback policy.
2. Existing ledger SR: append-only call records and dashboard, using this SR's service codes and cost rules.
