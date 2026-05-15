# disclosure-document-generation (delta)

## ADDED Requirements

### Requirement: Document generation pipeline SHALL embed legal notice block

The system SHALL inject the `<LegalNoticeBlock>` component from the `legal-clauses-pdf-block` capability into the PDF render pipeline as the final block of the fixed 4-page section, after Cover / Basic Info / Location Map. The block SHALL not interfere with the existing 16-chapter Markdown disclosure document structure.

#### Scenario: Generated PDF contains legal notice block before dynamic pages

- **WHEN** a PDF is generated for any case (residential or land)
- **THEN** the legal notice block appears in the resulting PDF before the first dynamic page (photo gallery / condition survey / life amenities) AND the chapter-5 / chapter-6 / chapter-14 content remains intact in their existing positions

#### Scenario: PDF generation does not duplicate the legal notice block

- **WHEN** the same PDF is rendered multiple times for the same case
- **THEN** the legal notice block appears exactly once in each generated PDF

##### Example: Count law-title occurrences per render

- **GIVEN** the same case `C0001` rendered 3 times via `renderDisclosurePdf(...)`
- **WHEN** each rendered PDF is parsed and the string "不動產經紀業管理條例" is counted across all pages
- **THEN** every one of the 3 renders contains exactly 1 occurrence of "不動產經紀業管理條例" (proving the block is not injected twice in any single render and not accumulated across renders)

### Requirement: Page numbering SHALL account for the embedded legal notice block

The system SHALL include the legal notice block's pages in the total page count and per-page numbering displayed in the page footer. The block's pages SHALL participate in the auto-paginated counter exposed by `@react-pdf`.

#### Scenario: Legal notice block pages count toward total

- **WHEN** the legal notice block renders across 2 pages and the case has 8 dynamic pages
- **THEN** the total page count reflects all fixed pages + 2 legal pages + 8 dynamic pages AND the page footer shows the correct "第 X 頁 / 共 Y 頁" format on every page
