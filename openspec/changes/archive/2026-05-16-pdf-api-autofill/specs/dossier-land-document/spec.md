# dossier-land-document Specification Delta

## MODIFIED Requirements

### Requirement: System SHALL define a CaseDossierData interface for dossier rendering

The system SHALL define and export a `CaseDossierData` TypeScript interface with the following fields:

Required fields (unchanged):
- `caseNo: string` — case identifier
- `address: string` — property address
- `propertyType: 'land' | 'building'` — determines which document layout is rendered
- `landLotNo: string` — land parcel number (地號)
- `ownerName: string` — property owner full name
- `companyName: string` — real estate company name shown on cover
- `generatedAt: string` — document generation timestamp string
- `logoBytes?: number[]` — optional company logo as byte array

New optional fields for land API data:
- `landArea?: number` — land area in ㎡ (from land_registry API)
- `landPurpose?: string` — 地目 (from land_registry API)
- `zoningType?: string` — 使用分區 (from zoning API)
- `usageCategory?: string` — 使用地類別 (from zoning API)
- `soilConservation?: string` — 水土保持說明 (derived from zoningType via lookup table)
- `buildingLineNote?: string` — 建築線指定說明 (derived from zoningType via lookup table)
- `announcedLandValue?: number` — 公告現值 in 元/㎡ (from land_value API)
- `assessedLandValue?: number` — 評估地價 in 元/㎡ (from land_value API)
- `mortgages?: Array<{ creditor: string; amount: number }>` — 他項權利清單 (from mortgages API)

New optional fields for building API data:
- `buildingArea?: number` — 建物面積 in ㎡ (from building_registry API)
- `buildingPurpose?: string` — 建物用途 (from building_registry API)
- `constructionDate?: string` — 建造完成日期 (from building_registry API)
- `buildingCertificateNo?: string` — 建物所有權狀字號 (from building_ownership API)
- `buildingOwnershipDate?: string` — 建物所有權登記日期 (from building_ownership API)

Shared optional fields:
- `recentSalePricePerSqm?: number` — 近期成交均價 in 元/㎡ (from query_real_price)
- `recentSaleCount?: number` — 近期成交案件數 (from query_real_price)
- `legalClauses?: string[]` — 法規告知條文清單 (from get_legal_clause_ipc); if absent, page 2 SHALL display no clauses

#### Scenario: CaseDossierData accepts all required fields with no optional fields

- **WHEN** a `CaseDossierData` object is constructed with only the required fields and no optional fields
- **THEN** TypeScript compilation SHALL succeed with no type errors

#### Scenario: CaseDossierData accepts fully populated land data

- **WHEN** a `CaseDossierData` object is constructed with all required fields and all land optional fields set to non-undefined values
- **THEN** TypeScript compilation SHALL succeed with no type errors

### Requirement: System SHALL render 建物版 as a full 7-page document for property_type = 'building'

The system SHALL render a 7-page building dossier when `CaseDossierData.propertyType === 'building'`. The building dossier pages SHALL be:
- Page 1: Cover (同土地版，顯示 caseNo、address、companyName)
- Page 2: 法規告知 — displays `legalClauses` array items; if `legalClauses` is undefined or empty, the page body is blank
- Page 3: 建物標示 — displays `buildingArea`、`buildingPurpose`、`constructionDate`；undefined values display as empty cells
- Page 4: 建物所有權/他項權利 — displays `buildingCertificateNo`、`buildingOwnershipDate`、`ownerName`、`mortgages`；undefined values display as empty cells
- Page 5: 建物現況調查 — all cells blank (手填欄位，由業務員現場填寫)
- Page 6: 管理組織 — all cells blank with note "請洽管理委員會確認"
- Page 7: 成交行情 — displays `recentSalePricePerSqm`、`recentSaleCount`；undefined values display as empty cells

The previous single-page placeholder "建物版說明書（建置中）" SHALL be replaced by this 7-page layout.

#### Scenario: Building document renders 7 pages with API data

- **WHEN** `PdfDocument` is rendered with `propertyType: 'building'` and `buildingArea: 85.5`
- **THEN** the rendered PDF SHALL contain 7 pages AND page 3 SHALL display "85.5" in the building area cell

#### Scenario: Building document renders 7 pages when optional fields are undefined

- **WHEN** `PdfDocument` is rendered with `propertyType: 'building'` and no optional API fields
- **THEN** the rendered PDF SHALL contain 7 pages without throwing errors AND all data cells SHALL display as empty

### Requirement: preview/page.tsx SHALL assemble CaseDossierData from the case SQLite row AND API calls

The `src/app/(dashboard)/cases/[id]/preview/page.tsx` page SHALL query the local SQLite database for the case row identified by `params.id`, call `assembleDossierData(caseRow)` from `src/lib/pdf-engine/assemble-dossier-data.ts` to fetch API data, and pass the enriched `CaseDossierData` to `PdfPreviewer`.

#### Scenario: Preview page renders with valid case data and successful API calls

- **WHEN** the preview page is loaded with a valid `caseId` and `assembleDossierData` returns a fully populated `CaseDossierData`
- **THEN** `PdfPreviewer` SHALL receive the enriched `CaseDossierData` with API-fetched optional fields populated

#### Scenario: Preview page renders when API calls fail

- **WHEN** the preview page is loaded with a valid `caseId` AND `assembleDossierData` encounters IPC errors (e.g., ConsentRequired)
- **THEN** `PdfPreviewer` SHALL still receive a `CaseDossierData` with all required fields populated and optional API fields set to `undefined`, resulting in empty cells in the PDF
