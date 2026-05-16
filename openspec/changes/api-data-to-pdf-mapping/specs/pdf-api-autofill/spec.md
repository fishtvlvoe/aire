# pdf-api-autofill Specification Delta

## MODIFIED Requirements

### Requirement: System SHALL provide an assembleDossierData function to fetch and map API data into CaseDossierData

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
