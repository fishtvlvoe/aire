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

## Requirements


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

---
### Requirement: System SHALL derive regulatory restriction text from zoning_type using a static lookup table

The system SHALL maintain a static `ZONING_RESTRICTIONS` lookup table in `src/lib/pdf-engine/assemble-dossier-data.ts` mapping known `zoning_type` strings to `soilConservation` and `buildingLineNote` text. When `zoningType` is not found in the table, both fields SHALL equal `"依主管機關規定辦理"`.

#### Scenario: Known zoning type maps to restriction text

- **WHEN** the zoning API returns `zoning_type === "農業區"`
- **THEN** `soilConservation` SHALL be a non-empty string referencing water/soil conservation law AND `buildingLineNote` SHALL be a non-empty string

#### Scenario: Unknown zoning type uses fallback text

- **WHEN** the zoning API returns a `zoning_type` not present in `ZONING_RESTRICTIONS`
- **THEN** both `soilConservation` and `buildingLineNote` SHALL equal `"依主管機關規定辦理"`

---
### Requirement: System SHALL compute recentSalePricePerSqm as average of unit_price values

The system SHALL extract the `unit_price` field from each item in the `query_real_price` response array and compute the arithmetic mean rounded to the nearest integer.

#### Scenario: Five sale records with known unit prices

- **WHEN** `query_real_price` returns 5 records with `unit_price` values `[100000, 120000, 110000, 130000, 90000]`
- **THEN** `recentSalePricePerSqm` SHALL be `110000` and `recentSaleCount` SHALL be `5`