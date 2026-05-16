# dossier-land-document Specification

## Requirements

### Requirement: System SHALL define a CaseDossierData interface for dossier rendering

The system SHALL define and export a `CaseDossierData` TypeScript interface. In addition to all existing fields (unchanged), the following new optional fields SHALL be added:

Section Three fields (權利種類及登記狀態):
- `restrictionRegistration?: string` — 限制登記 description
- `trustRegistration?: string` — 信託登記 status
- `cautionRegistration?: string` — 預告登記 status
- `otherRightsDetail?: string` — 其他權利登記事項

Section Four fields (目前管理與使用情況):
- `currentRentalStatus?: string` — 出租情形
- `currentOccupation?: string` — 占用情形
- `sharedManagement?: string` — 共有物分管情形
- `existingRoad?: string` — 既成道路
- `otherUsageStatus?: string` — 其他使用情況

Section Five fields (使用管制內容):
- `urbanPlanZone?: string` — 都市計畫使用分區
- `nonUrbanLandCategory?: string` — 非都市土地使用分區及編定
- `floorAreaRatio?: string` — 容積率
- `buildingCoverageRatio?: string` — 建蔽率
- `specialDesignatedArea?: string` — 特定目的事業用地

Section Six fields (重要交易條件):
- `transactionTotalPrice?: string` — 交易總價
- `paymentMethod?: string` — 付款方式
- `taxBurdenAgreement?: string` — 稅費負擔約定
- `penaltyClause?: string` — 違約處理

Section Seven fields (其他重要事項):
- `environmentalImpact?: string` — 環境影響
- `majorIncident?: string` — 重大事故
- `nearbyPublicFacilities?: string` — 鄰近公共設施
- `surroundingTransactionPrice?: string` — 周遭成交行情

All new fields are optional. Adding them SHALL NOT cause TypeScript compilation errors for existing code that constructs CaseDossierData without these fields.

#### Scenario: CaseDossierData accepts all new Section Three through Seven fields

- **WHEN** a `CaseDossierData` object is constructed with all required fields plus all new Section Three through Seven optional fields
- **THEN** TypeScript compilation SHALL succeed with no type errors


<!-- @trace
source: pdf-template-land-complete
updated: 2026-05-16
code:
  - src/lib/pdf-engine/document.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/pdf-engine/react-pdf-components.tsx
  - src/lib/mock-backend.ts
tests:
  - src/lib/pdf-engine/__tests__/document-land-government-format.test.tsx
  - src/lib/pdf-engine/__tests__/react-pdf-components.test.tsx
-->

---
### Requirement: LandPages Cover SHALL NOT render raw CaseDossierData JSON

The Cover component of each PDF theme SHALL NOT render `JSON.stringify(caseData)` or any raw data dump on the cover page. The cover page SHALL display only structured fields: case number, property address, company name, property type label, and generation date.

#### Scenario: Cover page renders without JSON dump

- **WHEN** `PdfDocument` is rendered with any theme and `propertyType: 'land'`
- **THEN** the cover page SHALL NOT contain any JSON-formatted text block
- **AND** the cover page SHALL display the case number, address, and generation date in their designated layout positions

---
### Requirement: LandPages SHALL render a 10-page document aligned with the government 105-year format

The system SHALL render a 10-page land dossier when `CaseDossierData.propertyType === 'land'`. The pages SHALL be:

- Page 1: 封面 (Cover) — unchanged
- Page 2: 法規告知 — unchanged
- Page 3: 一、標示及權利範圍 — renamed from "二、產權調查表—土地標示", fields: 地號, 地目, 地積, 使用分區, 使用地類別, 水土保持, 建築線指定, 權利範圍/持分比例, 面積
- Page 4: 二、所有權人及其基本資料 — renamed from "三、產權調查表—所有權及他項權利", fields: 所有權人 name only (他項權利 moved to Section Three)
- Page 5: 三、權利種類及登記狀態 — NEW page (see land-disclosure-section-three spec)
- Page 6: 四、目前管理與使用情況 — NEW page (see land-disclosure-section-four spec)
- Page 7: 五、使用管制內容 — NEW page (see land-disclosure-section-five spec)
- Page 8: 六、重要交易條件 — REPLACED "五、稅費╱規費" with government format fields: 交易總價, 付款方式, 稅費負擔, 違約處理, plus retained 公告現值 and 評估地價
- Page 9: 七、其他重要事項 — REPLACED "六、成交行情╱周遭設施" with government format fields: 環境影響, 重大事故, 鄰近公共設施, 周遭成交行情, plus retained 近期成交均價 and 近期成交案件數
- Page 10: 簽章欄 — NEW page (see land-disclosure-signature-block spec)

The `totalPages` constant in `LandPages` SHALL be updated from 7 to 10.

#### Scenario: Land document renders 10 pages with no optional data

- **WHEN** `PdfDocument` renders with `propertyType: 'land'` and only required fields populated
- **THEN** the rendered PDF SHALL contain exactly 10 pages with section titles matching the government format AND all value cells displaying "待補"

#### Scenario: Land document renders 10 pages with full data

- **WHEN** `PdfDocument` renders with `propertyType: 'land'` and all optional fields populated
- **THEN** the rendered PDF SHALL contain exactly 10 pages with all data values displayed in their respective fields


<!-- @trace
source: pdf-template-land-complete
updated: 2026-05-16
code:
  - src/lib/pdf-engine/document.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/pdf-engine/react-pdf-components.tsx
  - src/lib/mock-backend.ts
tests:
  - src/lib/pdf-engine/__tests__/document-land-government-format.test.tsx
  - src/lib/pdf-engine/__tests__/react-pdf-components.test.tsx
-->

---
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

BuildingPages SHALL NOT be modified by the pdf-template-land-complete change. It SHALL continue to render 7 pages for `propertyType === 'building'`.

#### Scenario: Building document renders 7 pages with API data

- **WHEN** `PdfDocument` is rendered with `propertyType: 'building'` and `buildingArea: 85.5`
- **THEN** the rendered PDF SHALL contain 7 pages AND page 3 SHALL display "85.5" in the building area cell

#### Scenario: Building document renders 7 pages when optional fields are undefined

- **WHEN** `PdfDocument` is rendered with `propertyType: 'building'` and no optional API fields
- **THEN** the rendered PDF SHALL contain 7 pages without throwing errors AND all data cells SHALL display as empty

#### Scenario: Building document remains 7 pages

- **WHEN** `PdfDocument` renders with `propertyType: 'building'`
- **THEN** the rendered PDF SHALL contain exactly 7 pages, identical to pre-change behavior

<!-- @trace
source: pdf-api-autofill, pdf-template-land-complete
updated: 2026-05-16
code:
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src/lib/pdf-engine/document.tsx
tests:
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/lib/pdf-engine/__tests__/document.test.tsx
-->

---
### Requirement: preview/page.tsx SHALL assemble CaseDossierData from the case SQLite row AND API calls

The `src/app/(dashboard)/cases/[id]/preview/page.tsx` page SHALL query the local SQLite database for the case row identified by `params.id`, call `assembleDossierData(caseRow)` from `src/lib/pdf-engine/assemble-dossier-data.ts` to fetch API data, and pass the enriched `CaseDossierData` to `PdfPreviewer`.

#### Scenario: Preview page renders with valid case data and successful API calls

- **WHEN** the preview page is loaded with a valid `caseId` and `assembleDossierData` returns a fully populated `CaseDossierData`
- **THEN** `PdfPreviewer` SHALL receive the enriched `CaseDossierData` with API-fetched optional fields populated

#### Scenario: Preview page renders when API calls fail

- **WHEN** the preview page is loaded with a valid `caseId` AND `assembleDossierData` encounters IPC errors (e.g., ConsentRequired)
- **THEN** `PdfPreviewer` SHALL still receive a `CaseDossierData` with all required fields populated and optional API fields set to `undefined`, resulting in empty cells in the PDF

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