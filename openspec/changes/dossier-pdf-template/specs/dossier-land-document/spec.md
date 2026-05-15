## ADDED Requirements

### Requirement: System SHALL define a CaseDossierData interface for dossier rendering

The system SHALL define and export a `CaseDossierData` TypeScript interface with the following fields:
- `caseNo: string` — case identifier (e.g., "AIRE-2026-002")
- `address: string` — property address
- `propertyType: 'land' | 'building'` — determines which document layout is rendered
- `landLotNo: string` — land parcel number (地號)
- `ownerName: string` — property owner full name
- `companyName: string` — real estate company name shown on cover
- `generatedAt: string` — ISO date string for document generation timestamp
- `logoBytes?: number[]` — optional company logo as byte array

#### Scenario: CaseDossierData accepts all required fields

- **WHEN** a `CaseDossierData` object is constructed with all required fields
- **THEN** TypeScript compilation SHALL succeed with no type errors

### Requirement: System SHALL render a 7-page 土地版 PDF for property_type = 'land'

The system SHALL provide a `PdfDocument` React component that, when `CaseDossierData.propertyType === 'land'`, renders exactly 7 pages corresponding to the 土地版 chapters defined in `docs/dossier-chapter-structure.md`:
1. 封面（Cover）
2. 法規告知（Legal Disclosure）
3. 產權調查表 — 土地標示（Land Parcel Registry）
4. 產權調查表 — 權利/他項權利（Ownership / Encumbrances）
5. 基地/土地現況調查表（Site Condition Survey）
6. 稅費/規費（Tax and Fees）
7. 成交行情/周遭設施（Market Data and Surroundings）

Each page SHALL use `PdfPageHeader` and `PdfPageFooter` from `dossier-react-pdf-components`.

#### Scenario: Land document renders 7 pages

- **WHEN** `PdfDocument` is rendered with `propertyType: 'land'`
- **THEN** the rendered PDF SHALL contain exactly 7 pages

#### Scenario: Each page renders the correct chapter title

- **WHEN** `PdfDocument` is rendered with `propertyType: 'land'`
- **THEN** page 1 SHALL contain "封面", page 2 SHALL contain "法規告知", page 3 SHALL contain "產權調查表", page 4 SHALL contain "他項權利", page 5 SHALL contain "現況調查", page 6 SHALL contain "稅費", page 7 SHALL contain "成交行情"

### Requirement: System SHALL render 建物版 placeholder for property_type = 'building'

The system SHALL render a single-page placeholder when `CaseDossierData.propertyType === 'building'`, displaying the text "建物版說明書（建置中）" and the case number. This MUST NOT throw errors.

#### Scenario: Building document renders placeholder without error

- **WHEN** `PdfDocument` is rendered with `propertyType: 'building'`
- **THEN** the rendered PDF SHALL contain 1 page with text "建物版說明書（建置中）"

### Requirement: Missing data values SHALL display as 待補

For every field in the 7-chapter structure, when the corresponding `CaseDossierData` value is an empty string, undefined, or null, the system SHALL render the literal text "待補" in place of the missing value.

#### Scenario: Missing address renders 待補

- **WHEN** `PdfDocument` is rendered with `address: ""`
- **THEN** the cover page SHALL display "待補" where the address would appear

##### Example: field substitution table

| CaseDossierData field | empty/missing renders as |
|-----------------------|--------------------------|
| `address` | "待補" |
| `landLotNo` | "待補" |
| `ownerName` | "待補" |
| `companyName` | "待補" |

### Requirement: PdfDocument SHALL accept a themeId prop and apply corresponding tokens

The system SHALL accept a `themeId: string` prop in `PdfDocument` and call `getThemePdfTokens(themeId)` to obtain `PdfTokens`. All child components SHALL receive those tokens.

#### Scenario: Theme switch changes color tokens in document

- **WHEN** `PdfDocument` is rendered with `themeId: "theme-b-professional"`
- **THEN** `getThemePdfTokens("theme-b-professional")` SHALL be called and returned tokens SHALL be passed to all child `PdfSection` / `PdfCover` / `PdfPageHeader` components

### Requirement: PdfDocument SHALL be exported from document.tsx

The `PdfDocument` component SHALL be the default and named export from `src/lib/pdf-engine/document.tsx`, replacing the current stub content.

#### Scenario: Import resolves without error

- **WHEN** `import { PdfDocument } from "@/lib/pdf-engine/document"` is executed
- **THEN** TypeScript compilation SHALL succeed and `PdfDocument` SHALL be a valid React component

### Requirement: preview/page.tsx SHALL assemble CaseDossierData from the case SQLite row

The `src/app/(dashboard)/cases/[id]/preview/page.tsx` page SHALL query the local SQLite database for the case row identified by `params.id`, map the row to a `CaseDossierData` object, and pass it to the `PdfPreviewer` component for rendering.

#### Scenario: Preview page renders with valid case data

- **WHEN** the preview page is loaded with a valid `caseId` that exists in the local database
- **THEN** `PdfPreviewer` SHALL receive `caseId` and a serialized `CaseDossierData` object with all available fields populated from the database row

#### Scenario: Preview page renders with missing case data

- **WHEN** the preview page is loaded with a `caseId` that returns no database row
- **THEN** `PdfPreviewer` SHALL receive a `CaseDossierData` object with all string fields set to "" (empty), resulting in all values displaying as "待補"
