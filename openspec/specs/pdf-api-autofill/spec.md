# pdf-api-autofill Specification

## Purpose

Define the contract for assembling `CaseDossierData` from Tauri IPC commands, so that all API-available fields are automatically populated in the PDF without user intervention.

## ADDED Requirements

### Requirement: System SHALL provide an assembleDossierData function to fetch and map API data into CaseDossierData

The system SHALL export an `assembleDossierData(caseRow: CaseRow): Promise<CaseDossierData>` function from `src/lib/pdf-engine/assemble-dossier-data.ts` that:
- For `propertyType === "land"`: invokes `land_registry_pull_data` with api_ids `["land_registry", "zoning", "land_value", "mortgages"]`, plus `query_real_price` and `get_legal_clause_ipc`
- For `propertyType === "building"`: invokes `land_registry_pull_data` with api_ids `["building_registry", "building_ownership", "mortgages"]`, plus `query_real_price` and `get_legal_clause_ipc`
- Maps each API response field to the corresponding `CaseDossierData` optional field
- Returns a complete `CaseDossierData` in all cases — individual IPC failures set the corresponding optional field to `undefined` without throwing

#### Scenario: Land case with all APIs succeeding

- **WHEN** `assembleDossierData` is called with a land `CaseRow` and all IPC calls succeed
- **THEN** the returned `CaseDossierData` SHALL have `landArea`, `zoningType`, `announcedLandValue`, `mortgages`, `legalClauses`, `recentSalePricePerSqm` all set to non-undefined values

#### Scenario: Building case with all APIs succeeding

- **WHEN** `assembleDossierData` is called with a building `CaseRow` and all IPC calls succeed
- **THEN** the returned `CaseDossierData` SHALL have `buildingArea`, `buildingPurpose`, `constructionDate`, `buildingCertificateNo`, `mortgages`, `legalClauses`, `recentSalePricePerSqm` all set to non-undefined values

#### Scenario: IPC call fails with ConsentRequired

- **WHEN** `invoke("land_registry_pull_data")` rejects with error code `ConsentRequired`
- **THEN** `assembleDossierData` SHALL return a `CaseDossierData` where all land registry optional fields are `undefined` AND the function SHALL NOT throw

#### Scenario: query_real_price returns empty array

- **WHEN** `invoke("query_real_price")` returns `[]`
- **THEN** `recentSalePricePerSqm` SHALL be `undefined` and `recentSaleCount` SHALL be `0`


<!-- @trace
source: pdf-api-autofill
updated: 2026-05-16
code:
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src/lib/pdf-engine/document.tsx
tests:
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/lib/pdf-engine/__tests__/document.test.tsx
-->


<!-- @trace
source: api-data-to-pdf-mapping
updated: 2026-05-16
code:
  - src/components/PullParcelDataButton.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/pdf-engine/react-pdf-components.tsx
  - src/lib/pdf-engine/document.tsx
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/mock-backend.ts
  - src/lib/pdf-themes/theme-a-minimal/index.tsx
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/lib/safe-invoke.ts
  - src/lib/pdf-themes/theme-c-tech-elegant/index.tsx
tests:
  - src/lib/pdf-themes/__tests__/cover-no-json.test.tsx
  - src/lib/pdf-engine/__tests__/react-pdf-components.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/pdf-engine/__tests__/document-land-government-format.test.tsx
-->

### Requirement: System SHALL derive regulatory restriction text from zoning_type using a static lookup table

The system SHALL maintain a static `ZONING_RESTRICTIONS` lookup table in `src/lib/pdf-engine/assemble-dossier-data.ts` mapping known `zoning_type` strings to `soilConservation` and `buildingLineNote` text. When `zoningType` is not found in the table, both fields SHALL equal `"依主管機關規定辦理"`.

#### Scenario: Known zoning type maps to restriction text

- **WHEN** the zoning API returns `zoning_type === "農業區"`
- **THEN** `soilConservation` SHALL be a non-empty string referencing water/soil conservation law AND `buildingLineNote` SHALL be a non-empty string

#### Scenario: Unknown zoning type uses fallback text

- **WHEN** the zoning API returns a `zoning_type` not present in `ZONING_RESTRICTIONS`
- **THEN** both `soilConservation` and `buildingLineNote` SHALL equal `"依主管機關規定辦理"`


<!-- @trace
source: pdf-api-autofill
updated: 2026-05-16
code:
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src/lib/pdf-engine/document.tsx
tests:
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/lib/pdf-engine/__tests__/document.test.tsx
-->

### Requirement: System SHALL compute recentSalePricePerSqm as average of unit_price values

The system SHALL extract the `unit_price` field from each item in the `query_real_price` response array and compute the arithmetic mean rounded to the nearest integer.

#### Scenario: Five sale records with known unit prices

- **WHEN** `query_real_price` returns 5 records with `unit_price` values `[100000, 120000, 110000, 130000, 90000]`
- **THEN** `recentSalePricePerSqm` SHALL be `110000` and `recentSaleCount` SHALL be `5`

---
### Requirement: assembleDossierData SHALL use tauri-bridge mock pathway in development mode

The existing requirement is unchanged in its contract. The following implementation constraint is ADDED:

In development mode (when Tauri native runtime is not available), `assembleDossierData` SHALL use the mock invocation pathway provided by `tauri-bridge.ts` instead of importing directly from `@tauri-apps/api/core`. This ensures all IPC commands route through `MockStore` during development.

The `MockStore.landRegistryPullData` method SHALL return field-accurate mock data for each apiId:

- `land_registry`: SHALL return `{ area: number, purpose: string, lot_number: string }` — area in ㎡, purpose as 地目 string, lot_number as land parcel identifier
- `zoning`: SHALL return `{ zoning_type: string, usage_category: string }` — zoning designation and usage category
- `land_value`: SHALL return `{ announced_value: number, assessed_value: number }` — values in 元/㎡
- `mortgages`: SHALL return an array of `{ creditor: string, amount: number }` objects
- `building_registry`: SHALL return `{ area: number, purpose: string, construction_date: string }`
- `building_ownership`: SHALL return `{ certificate_no: string, ownership_date: string }`

The `MockStore` SHALL also handle `query_real_price` command and return an array of records containing at minimum `{ unit_price: number, total_price: number, area: number, address: string, date: string }`.

#### Scenario: assembleDossierData returns populated fields in dev mode

- **WHEN** `assembleDossierData` is called with a land CaseRow in dev mode
- **THEN** the returned `CaseDossierData` SHALL have `landArea`, `landPurpose`, `zoningType`, `announcedLandValue`, `recentSalePricePerSqm` set to non-undefined values from mock data

#### Scenario: mock landRegistryPullData returns field-accurate data

- **WHEN** `MockStore.landRegistryPullData` is called with `apiIds: ["land_registry", "zoning"]`
- **THEN** `results.land_registry.data` SHALL contain `area` as a number AND `results.zoning.data` SHALL contain `zoning_type` as a string


<!-- @trace
source: api-data-to-pdf-mapping
updated: 2026-05-16
code:
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/mock-backend.ts
  - src/lib/tauri-bridge.ts
tests:
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
-->

## Requirements
