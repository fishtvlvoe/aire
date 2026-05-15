# dynamic-page-composition Specification

## Purpose

Compose the disclosure PDF dynamically from case data, producing 5 to 19 pages depending on which sections have content, with conditional rendering for "不一定要" (optional) blocks and automatic pagination handled by `@react-pdf/renderer`.

## ADDED Requirements

### Requirement: System SHALL compose 4 fixed pages plus 1-15 dynamic pages

The system SHALL always render the four fixed pages: Cover, Basic Info, Location Map, and Page Footer (footer is part of every page, not a standalone page). The system SHALL conditionally render the dynamic pages: Photo Gallery (1-3 pages depending on photo count), Condition Survey (5 pages for residential, 5 pages for land), Life Amenities (1 page if data present), totaling 5-19 pages.

#### Scenario: Minimum residential case renders 5 pages

- **WHEN** a residential case with 0 photos, no condition survey data, no life amenities renders
- **THEN** the resulting PDF has exactly 5 pages: Cover, Basic Info, Location Map, plus 2 placeholder pages for required-but-empty Condition Survey sections

#### Scenario: Maximum land case renders 19 pages

- **WHEN** a land case with 12 photos, full condition survey data, life amenities populated renders
- **THEN** the resulting PDF has exactly 19 pages

### Requirement: ConditionalSection SHALL skip rendering when condition is false

The system SHALL provide a `<ConditionalSection condition={...}>` wrapper component that renders its children only if the condition evaluates true. The wrapper SHALL produce zero pages and zero React PDF nodes when skipped (no whitespace placeholder).

#### Scenario: Optional section absent for residential case

- **WHEN** a residential case (`caseType = 'residential'`) renders with `<ConditionalSection condition={caseData.landOptional1 != null}>`
- **THEN** no PDF page or block is generated for the land-only optional section AND total page count reflects the absence

#### Scenario: Optional section present for land case

- **WHEN** a land case with `caseData.landOptional1 = { area: 100 }` renders the same `<ConditionalSection>`
- **THEN** the section is included in the PDF AND total page count increases by the rendered section's page span

### Requirement: PhotoGallery SHALL paginate at 4 photos per page

The system SHALL render the photo gallery with exactly 4 photos per page in a 2×2 grid. When the photo count is not divisible by 4, the last page SHALL render the remaining photos with empty cells filling the unused grid positions.

#### Scenario: 5 photos render across 2 pages

- **WHEN** 5 photos are passed to `<PhotoGallery photos={5photos}>`
- **THEN** the rendered PDF has 2 photo pages: page 1 has 4 photos in 2×2, page 2 has 1 photo with 3 empty cells

#### Scenario: Exactly 8 photos render across 2 full pages

- **WHEN** 8 photos are passed
- **THEN** the rendered PDF has exactly 2 photo pages, each with 4 photos in 2×2 with no empty cells

### Requirement: Condition Survey SHALL select residential or land variant by case type

The system SHALL render the residential condition survey component when `caseData.caseType === 'residential'` and the land variant when `caseData.caseType === 'land'`. Each variant covers exactly 5 pages of the standard form layout.

#### Scenario: Residential case uses residential survey

- **WHEN** a residential case renders the Condition Survey section
- **THEN** the rendered nodes contain the residential-specific row labels (e.g., "建物用途", "屋齡", "主要建材") and not the land-specific labels (e.g., "土地使用分區", "公告現值")

#### Scenario: Land case uses land survey

- **WHEN** a land case renders the Condition Survey section
- **THEN** the rendered nodes contain the land-specific row labels and not the residential-specific labels

##### Example: Concrete label assertions for land case

- **GIVEN** case data `{ caseType: 'land', surveyData: { zoning: '住宅區', publicValue: 12000, area: 80 } }`
- **WHEN** the Condition Survey section renders this case
- **THEN** the rendered React PDF tree contains Text nodes with content "土地使用分區" and "公告現值" but does NOT contain Text nodes with content "建物用途" or "屋齡" (verified by `screen.getByText('土地使用分區')` succeeding and `screen.queryByText('建物用途')` returning null)

### Requirement: Page numbering SHALL be auto-computed and shown in footer

The system SHALL compute total page count after composition and SHALL render `第 X 頁 / 共 Y 頁` in every page footer using `@react-pdf/renderer`'s built-in `<Text render={({ pageNumber, totalPages }) => ...}>` API.

#### Scenario: Page numbers reflect actual total

- **WHEN** a 12-page PDF is rendered
- **THEN** the footer of page 1 contains "第 1 頁 / 共 12 頁" AND the footer of page 12 contains "第 12 頁 / 共 12 頁"

### Requirement: Section breaks SHALL respect React PDF wrap and break props

The system SHALL apply `wrap={true}` to long blocks (Condition Survey table, Photo Gallery) so they automatically continue on the next page when content exceeds page height. The system SHALL apply `break={true}` to force page breaks before fixed pages (Cover, Basic Info, Location Map) so they always start on a new page.

#### Scenario: Long survey table wraps to next page

- **WHEN** the Condition Survey table contains 30 rows that exceed one page
- **THEN** the rendered PDF splits the table across multiple pages with the header row repeating on each continuation page

#### Scenario: Cover always starts on page 1

- **WHEN** any case data is rendered
- **THEN** the Cover block always appears as page 1 of the output regardless of preceding content

### Requirement: Empty case data SHALL produce a typed validation error

The system SHALL validate that case data includes the minimum required fields (`caseId`, `caseType`, `propertyName`) before invoking `@react-pdf/renderer` and SHALL surface `PdfRenderError::EngineFailure` with a descriptive cause when validation fails.

#### Scenario: Missing caseId produces typed error

- **WHEN** `renderDisclosurePdf({}, themeA, null)` is called with empty case data
- **THEN** the Promise rejects with `PdfRenderError::EngineFailure` whose cause string contains "missing required field: caseId"
