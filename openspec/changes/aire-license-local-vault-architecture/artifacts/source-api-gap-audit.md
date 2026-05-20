# Source / Legal / COP API Gap Audit

Date: 2026-05-20

Purpose:

Make sure AIRE does not miss required disclosure content or build against the wrong MOI/COP API assumptions.

## Sources Reviewed

Local source folders:

- `docs/0417-new`
- `docs/0417-old`
- `docs/cop-api`
- `docs/cop-scrape`
- `docs/MOIAPIExample_TOKEN`
- `0520/不動產說明書`

Live/public sources checked:

- 宜蘭縣政府地政處 page listing Ministry of Interior real-estate disclosure format examples, including 成屋/土地/預售屋 format examples, with page date 105-05-02.
- 基隆市政府地政處 notice about the 2026-01-13 MOI amendment effective 2026-04-01.
- Public copy of 成屋不動產說明書格式範例 showing statutory fields such as building location, building number, doorplate/address, floor areas, building material, construction completion date, and rights scope.

## Key Finding: New Legal Content Gap

The current local 105-style references are not enough by themselves.

The 2026-01-13 MOI amendment effective 2026-04-01 adds or emphasizes at least:

- 成屋: whether solar photovoltaic equipment is installed; if yes, location description.
- 成屋: building energy efficiency condition.
- 預售屋: similar solar photovoltaic equipment disclosure, plus wording adjustment for building defect warranty.

MVP impact:

```text
For house/成屋 MVP, add placeholder fields now for:
  - solar_photovoltaic_equipment_status
  - solar_photovoltaic_equipment_location
  - building_energy_efficiency_status
  - building_energy_efficiency_notes
```

These should be Basic manual fields first. Automation can be considered later only if a reliable data source exists.

Document behavior:

- Missing values render blank in draft PDF.
- These fields should be flagged in the left-panel checklist/legal completeness review, not printed as `待補`.

## Local COP API Documentation Coverage

`docs/cop-api/api-format-reference.md` is the most useful integration summary.

It confirms:

- Token endpoint: `GET https://copapi.moi.gov.tw/cp/getToken`
- Auth header for token: `Authorization: Basic base64(ClientID:SecretCode)`
- Token response includes `access_token`.
- Sandbox base URL: `https://copapi.moi.gov.tw/sandbox/api`
- Production base URL: `https://copapi.moi.gov.tw/cp/api`
- Common parameter format:
  - `unit`: 2 chars, land office code
  - `sec`: 4 chars, section code
  - `no`: 8 chars, main number 4 + sub number 4
  - `CITY`: 1 char city code

Important local note:

- `BuildingNo/QueryByAddress` needs additional subscription and may return `COP317`.
- It should not be treated as guaranteed free/basic lookup.
- MVP must support manual地號/建號 input.

## COP/MOI Service Map For House MVP

| AIRE need | MOI/COP source | Endpoint/interface | Current local backend status |
| --- | --- | --- | --- |
| 土地標示 / 面積 / 公告現值 / 公告地價 / 使用分區 | `MOI_API_001 地籍土地標示部資料服務` | `/LandDescription/1.0/QueryByLandNo` | Implemented as `land_registry`, `land_value`, `zoning` using same endpoint. |
| 土地所有權 / 權利範圍 / 持分 | `MOI_API_002 地籍土地所有權部資料服務` | `/LandOwnership/1.0/QueryByLimit` | Implemented as `co_owners`; naming should be clarified. |
| 土地他項權利 / 抵押 | `MOI_API_003 地籍土地他項權利部資料服務` | `/LandOtherRights/1.0/QueryByLimit` | Implemented as `mortgages`; local doc correctly notes `LandOtherRights` has `s`. |
| 建物標示 / 面積 / 分層 / 共有部分 | `MOI_API_004 地籍建物標示部資料服務` | `/BuildingDescription/1.0/QueryByBuildNo` | Implemented as `building_registry`. |
| 建物所有權 | `MOI_API_005 地籍建物所有權部資料服務` | `/BuildingOwnership/1.0/QueryByLimit` | Implemented as `building_ownership`. |
| 建物他項權利 | `MOI_API_006 地籍建物他項權利部資料服務` | likely `/BuildingOtherRights/1.0/QueryByLimit`, verify before implementation | Not currently wired as a separate API in `pull.rs`; current `mortgages` is land other rights only. |
| 建號資料 | `MOI_API_015 建號資料服務` | service doc says QueryByLandNo | Not currently wired in `pull.rs`. |
| 建物標示及權利範圍 | `MOI_API_026` | `/QueryByBuildNo` | Not currently wired; candidate alternative/advanced lookup. |
| 建物權利種類及登記狀態 | `MOI_API_028` | query params/output documented in local HTML | Not currently wired; useful for status/risk checks. |
| 地籍圖 | `MOI_WFS_001`, `MOI_WMS_002`, `MOI_API_023`, `MOI_API_024` | WFS/WMS GetCapabilities/GetFeature or API | Not currently wired into disclosure workbench; treat as Pro/manual slot first. |
| 門牌查建號 | `MOI_API_036`, `MOI_API_037` | `BuildingNo/QueryByAddress` style | Code has `address_to_parcel`, but docs note subscription/COP317 risk. Keep optional/manual fallback. |

## Backend Connection Assessment

Current Rust backend has the right general shape:

- `src-tauri/src/land_registry/apis/mod.rs` defines `post_json_with_key`.
- It supports two modes:
  - Basic auth directly when `token_endpoint` is empty.
  - Token mode when `token_endpoint` is non-empty: GET token endpoint with Basic auth, then POST business API with Bearer token.
- Unit tests cover Bearer token mode, token 401 handling, and Basic fallback.
- API wrappers exist for:
  - `building_registry`
  - `land_registry`
  - `co_owners`
  - `land_value`
  - `mortgages`
  - `building_ownership`
  - `zoning`
  - `address_to_parcel`

Main backend gaps before production COP connection:

1. `land_registry_pull_data` currently creates `StaticApiKeyProvider::configured(...)`, which leaves `token_endpoint` empty.
   - For real COP production, wire `StaticApiKeyProvider::with_token_endpoint(client_id, secret, "https://copapi.moi.gov.tw/cp/getToken")`.
2. `ipc.opcos_base_url` must be explicitly set to COP base URL for this integration:
   - sandbox: `https://copapi.moi.gov.tw/sandbox/api`
   - production: `https://copapi.moi.gov.tw/cp/api`
3. AIRE-facing api IDs need a clear map to MOI service IDs and endpoint paths.
4. Building other-rights (`MOI_API_006`) is not currently exposed as its own pull API.
5. `MOI_API_015`, `MOI_API_026`, `MOI_API_028`, WFS/WMS cadastral services are not yet wired.
6. Persistence of pulled payloads is still not proven in the real Tauri DB path.

Conclusion:

```text
The backend can be connected, but it is not "done".
The generic HTTP/auth layer is suitable.
The endpoint map, token endpoint config, missing service wrappers, and local persistence must be completed before relying on it for the disclosure workbench.
```

## Product/Template Difference Check

Customer/local files include more sales-workflow content than statutory MOI examples:

- Field visit questions
- Secretary supplement checklist
- Market/transparent price page
- Living-function map
- Photos and floor-plan/planning image slots
- 591/DM/social output fields in older docs

Official/MOI examples and 2026 update emphasize legal disclosure completeness:

- Building/land labels and rights
- Areas, materials, completion date, rights scope
- Solar photovoltaic equipment
- Building energy efficiency condition

Design implication:

```text
Separate required legal disclosure fields from customer workflow/sales enrichment fields.
Basic MVP should include legal required fields and manual workflow fields.
Pro/Advanced should automate enrichment fields where APIs/data sources exist.
```

## Required Updates To Existing Planning

- Add 2026 legal-update fields to house-version source inventory and future Page Contracts.
- Add backend task to wire COP token endpoint and base URL explicitly.
- Add backend task to map AIRE api IDs to MOI service IDs.
- Add backend task for missing service wrappers:
  - `building_other_rights` / `MOI_API_006`
  - `building_number_lookup` / `MOI_API_015`
  - `building_right_scope` / `MOI_API_026`
  - `building_right_status` / `MOI_API_028`
  - cadastral WFS/WMS slot integration
- Add verification task for whether address-to-building-number API is actually subscribed before making it a first-class flow.
- Keep manual fallback for every lookup-dependent field.

## Sources To Recheck Before Paid Launch

- Latest MOI `不動產說明書應記載及不得記載事項`.
- Latest 成屋不動產說明書 format example.
- COP service pricing and availability.
- Which COP services are actually purchasable/subscribed for the customer account.
- Whether service IDs/endpoint paths changed after the local scrape.
