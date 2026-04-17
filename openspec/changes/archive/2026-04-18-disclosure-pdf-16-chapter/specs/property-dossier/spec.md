## ADDED Requirements

### Requirement: Disclosure document is downloadable as A4 PDF

The system SHALL convert the `disclosure_document` Markdown content into a downloadable A4 PDF via the `/api/listings/[id]/pdf?type=disclosure` endpoint.

The PDF SHALL include:
- Page header: listing number + property address on every page
- Page footer: page N of M on every page
- 建安不動產 LOGO in the top-right corner of the first page
- Table styling: thin borders, light grey header rows, repeated table headers across pages
- Chinese font: Noto Serif TC (loaded via CDN, fallback to system serif)
- Chapter separation with visible dividers and spacing

#### Scenario: PDF download from documents page

- **WHEN** user clicks "下載 PDF" on the disclosure document card
- **THEN** browser SHALL download a PDF file named `disclosure-{listingId}.pdf`
- **THEN** the PDF SHALL render all 16 chapters with proper A4 layout

#### Scenario: PDF with empty supplementary data

- **WHEN** the listing has field_visit_data but no supplementary_data
- **THEN** the PDF SHALL still render all 16 chapters
- **THEN** chapters requiring supplementary data SHALL display `待補` in their fields

### Requirement: Disclosure document is generated with 16-chapter structure

The system SHALL generate a disclosure document with 16 chapters where the `disclosure_document` field contains Markdown with headings following `#### 章節 N：標題` format. The `disclosure_document` SHALL NOT contain placeholder text.

#### Scenario: Disclosure document is generated with 16-chapter structure

- **WHEN** the system generates documents for a listing that has field_visit_data
- **THEN** the `disclosure_document` field SHALL contain a 16-chapter Markdown string with chapter headings following `#### 章節 N：標題` format
- **THEN** the `disclosure_document` SHALL NOT contain the placeholder text `[PDF 由任務 10 實作]`

## MODIFIED Requirements

### Requirement: Property dossier is generated as a complete property profile

The system SHALL generate a property dossier (物件調查表) that integrates all data from `field_visit_data` and `supplementary_data` into a single comprehensive property profile document.

The dossier SHALL serve as the authoritative reference for all stakeholders (business agents, managers, owners, buyers) and SHALL include:
- Property identification (address, type, listing number)
- Price and area information
- All field visit data organized by section
- All supplementary data (cadastral, legal, market)
- Pros and cons summary
- Photo checklist status

The `disclosure_document` field within the property dossier SHALL be generated using the structured 16-chapter prompt defined in the `disclosure-document-generation` capability, NOT a placeholder string.

#### Scenario: Disclosure document is generated with 16-chapter structure

- **WHEN** the system generates documents for a listing that has field_visit_data
- **THEN** the `disclosure_document` field SHALL contain a 16-chapter Markdown string with chapter headings following `#### 章節 N：標題` format
- **THEN** the `disclosure_document` SHALL NOT contain the placeholder text `[PDF 由任務 10 實作]`
