# property-dossier Specification

## Purpose

TBD - created by archiving change 'three-stage-listing-workflow-v2'. Update Purpose after archive.

## Requirements

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


<!-- @trace
source: disclosure-pdf-16-chapter
updated: 2026-04-18
code:
  - src/lib/pdf-generator/dossier.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/lib/document-generator/codex-provider.ts
  - src/app/api/listings/[id]/pdf/route.ts
tests:
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/lib/document-generator/__tests__/land-type.test.ts
  - src/lib/document-generator/__tests__/five-documents.test.ts
-->

---
### Requirement: Dossier generation uses Codex CLI

The system SHALL generate the property dossier by calling Codex CLI with a structured prompt containing all property data. The Codex output SHALL be Markdown, which the system SHALL convert to PDF via Puppeteer.

#### Scenario: Codex generates dossier Markdown

- **WHEN** the dossier generator calls Codex CLI with farmland property data
- **THEN** Codex SHALL return a Markdown document with all property sections filled
- **THEN** the system SHALL convert the Markdown to a styled HTML page
- **THEN** Puppeteer SHALL render the HTML to PDF at A4 size


<!-- @trace
source: three-stage-listing-workflow-v2
updated: 2026-04-17
code:
  - docs/0417-old/其他土地_秘書後補清單.docx
  - docs/0417-old/商業地_現場必問清單.docx
  - docs/0417-old/建地_住宅地_秘書後補清單.docx
  - docs/0417-old/不動產說明書11.pdf
  - src/lib/property-types/schemas/commercial-land.ts
  - src/lib/property-types/schemas/highrise.ts
  - docs/0417-old/不動產說明書9.pdf
  - docs/0417-old/公寓_秘書後補清單.docx
  - src/lib/document-generator/types.ts
  - docs/0417-old/廠房_現場必問清單.docx
  - docs/0417-old/鄉村區建地_現場必問清單.docx
  - src/app/listings/[id]/documents/page.tsx
  - docs/0417-old/套房_秘書後補清單.docx
  - src/lib/property-types/schemas/rural-land.ts
  - docs/0417-old/農地_秘書後補清單.docx
  - stitch_ai/_2/screen.png
  - package.json
  - docs/0417-old/不動產說明書6.pdf
  - stitch_ai/ai/screen.png
  - docs/0417-old/不動產說明書5.pdf
  - docs/0417-old/不動產說明書2.pdf
  - docs/0417-old/農舍_現場必問清單.docx
  - docs/0417-old/店面_現場必問清單.docx
  - docs/0417-old/商業地_秘書後補清單.docx
  - docs/0417-old/周遭.pdf
  - docs/0417-old/不動產說明書8.pdf
  - src/app/api/listings/route.ts
  - src/lib/property-types/schemas/farmhouse.ts
  - docs/0417-old/不動產說明書12.pdf
  - stitch_ai/_2/code.html
  - docs/0417-old/不動產說明說15.pdf
  - docs/0417-old/工業地_秘書後補清單.docx
  - src/app/listings/new/page.tsx
  - src/lib/property-types/schemas/shop.ts
  - docs/0417-old/建地_住宅地_現場必問清單.docx
  - src/lib/property-types/schemas/industrial-land.ts
  - stitch_ai/_1/screen.png
  - docs/0417-old/不動產說明書14.pdf
  - src/lib/property-types/schemas/factory.ts
  - src/lib/property-types/index.ts
  - docs/0417-old/大樓華廈_秘書後補清單.docx
  - docs/0417-old/不動產說明書4.pdf
  - src/app/listings/[id]/fill/page.tsx
  - src/components/Sidebar.tsx
  - src/lib/db/schema.ts
  - docs/0417-old/店面_秘書後補清單.docx
  - docs/0417-old/大樓華廈_現場必問清單.docx
  - src/app/listings/[id]/generating/page.tsx
  - docs/0417-old/農地_現場必問清單.docx
  - docs/0417-old/農舍_秘書後補清單.docx
  - docs/0417-old/不動產說明書1.pdf
  - src/lib/property-types/schemas/suite.ts
  - src/lib/db/index.ts
  - docs/0417-new/建安不動產欄位總表.md
  - stitch_ai/_1/code.html
  - docs/0417-new/建安不動產欄位總表_土地版.docx
  - docs/0417-old/不動產書說明書10.pdf
  - docs/0417-old/不動產說明書3.pdf
  - src/lib/property-types/schemas/farmland.ts
  - src/lib/property-types/schemas/apartment.ts
  - src/lib/property-types/schemas/residential-land.ts
  - docs/0417-old/廠房_秘書後補清單.docx
  - docs/0417-old/透天別墅_現場必問清單.docx
  - docs/0417-old/不動產說明說16.pdf
  - docs/0417-old/透明房價一覽表成交行情.pdf
  - docs/0417-old/不動產書說明說7.pdf
  - stitch_ai/estate_elite/DESIGN.md
  - src/lib/form-renderer/index.ts
  - docs/0417-old/公寓_現場必問清單.docx
  - src/lib/property-types/schemas/index.ts
  - src/lib/property-types/schemas/townhouse.ts
  - docs/0417-new/建安不動產欄位總表_建物版.docx
  - src/lib/property-types/schemas/other-land.ts
  - docs/0417-old/透天別墅_秘書後補清單.docx
  - docs/0417-old/工業地_現場必問清單.docx
  - docs/0417-old/不動產說明書13.pdf
  - stitch_ai/estate_logic/DESIGN.md
  - docs/0417-old/土地物調表-母版.docx
  - src/lib/pdf-generator/dossier.ts
  - docs/0417-old/其他土地_現場必問清單.docx
  - docs/0417-old/鄉村區建地_秘書後補清單.docx
  - .spectra.yaml
  - docs/0417-old/套房_現場必問清單.docx
  - src/app/listings/page.tsx
  - stitch_ai/ai/code.html
  - docs/0417-old/建物物調表-母版.dot
tests:
  - src/lib/property-types/__tests__/index.test.ts
  - src/lib/db/__tests__/listing-workflow.test.ts
  - src/lib/form-renderer/__tests__/field-visit-form.test.ts
  - src/lib/db/__tests__/regenerate.test.ts
  - src/lib/db/__tests__/e2e-residential.test.ts
  - src/lib/db/__tests__/index.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/app/api/__tests__/listings.test.ts
  - src/lib/form-renderer/__tests__/supplementary-form.test.ts
-->

---
### Requirement: Dossier is included in the generated documents output

The system SHALL add `property_dossier` as a seventh document type in `GeneratedDocuments`, alongside the existing six types.

The `property_dossier` field SHALL contain the Markdown content of the dossier (PDF is derived from this).

#### Scenario: Documents output includes dossier

- **WHEN** the AI generation completes for any listing
- **THEN** `generated_documents` JSON SHALL contain a `property_dossier` key
- **THEN** the document output page SHALL display a download button for the dossier PDF


<!-- @trace
source: three-stage-listing-workflow-v2
updated: 2026-04-17
code:
  - docs/0417-old/其他土地_秘書後補清單.docx
  - docs/0417-old/商業地_現場必問清單.docx
  - docs/0417-old/建地_住宅地_秘書後補清單.docx
  - docs/0417-old/不動產說明書11.pdf
  - src/lib/property-types/schemas/commercial-land.ts
  - src/lib/property-types/schemas/highrise.ts
  - docs/0417-old/不動產說明書9.pdf
  - docs/0417-old/公寓_秘書後補清單.docx
  - src/lib/document-generator/types.ts
  - docs/0417-old/廠房_現場必問清單.docx
  - docs/0417-old/鄉村區建地_現場必問清單.docx
  - src/app/listings/[id]/documents/page.tsx
  - docs/0417-old/套房_秘書後補清單.docx
  - src/lib/property-types/schemas/rural-land.ts
  - docs/0417-old/農地_秘書後補清單.docx
  - stitch_ai/_2/screen.png
  - package.json
  - docs/0417-old/不動產說明書6.pdf
  - stitch_ai/ai/screen.png
  - docs/0417-old/不動產說明書5.pdf
  - docs/0417-old/不動產說明書2.pdf
  - docs/0417-old/農舍_現場必問清單.docx
  - docs/0417-old/店面_現場必問清單.docx
  - docs/0417-old/商業地_秘書後補清單.docx
  - docs/0417-old/周遭.pdf
  - docs/0417-old/不動產說明書8.pdf
  - src/app/api/listings/route.ts
  - src/lib/property-types/schemas/farmhouse.ts
  - docs/0417-old/不動產說明書12.pdf
  - stitch_ai/_2/code.html
  - docs/0417-old/不動產說明說15.pdf
  - docs/0417-old/工業地_秘書後補清單.docx
  - src/app/listings/new/page.tsx
  - src/lib/property-types/schemas/shop.ts
  - docs/0417-old/建地_住宅地_現場必問清單.docx
  - src/lib/property-types/schemas/industrial-land.ts
  - stitch_ai/_1/screen.png
  - docs/0417-old/不動產說明書14.pdf
  - src/lib/property-types/schemas/factory.ts
  - src/lib/property-types/index.ts
  - docs/0417-old/大樓華廈_秘書後補清單.docx
  - docs/0417-old/不動產說明書4.pdf
  - src/app/listings/[id]/fill/page.tsx
  - src/components/Sidebar.tsx
  - src/lib/db/schema.ts
  - docs/0417-old/店面_秘書後補清單.docx
  - docs/0417-old/大樓華廈_現場必問清單.docx
  - src/app/listings/[id]/generating/page.tsx
  - docs/0417-old/農地_現場必問清單.docx
  - docs/0417-old/農舍_秘書後補清單.docx
  - docs/0417-old/不動產說明書1.pdf
  - src/lib/property-types/schemas/suite.ts
  - src/lib/db/index.ts
  - docs/0417-new/建安不動產欄位總表.md
  - stitch_ai/_1/code.html
  - docs/0417-new/建安不動產欄位總表_土地版.docx
  - docs/0417-old/不動產書說明書10.pdf
  - docs/0417-old/不動產說明書3.pdf
  - src/lib/property-types/schemas/farmland.ts
  - src/lib/property-types/schemas/apartment.ts
  - src/lib/property-types/schemas/residential-land.ts
  - docs/0417-old/廠房_秘書後補清單.docx
  - docs/0417-old/透天別墅_現場必問清單.docx
  - docs/0417-old/不動產說明說16.pdf
  - docs/0417-old/透明房價一覽表成交行情.pdf
  - docs/0417-old/不動產書說明說7.pdf
  - stitch_ai/estate_elite/DESIGN.md
  - src/lib/form-renderer/index.ts
  - docs/0417-old/公寓_現場必問清單.docx
  - src/lib/property-types/schemas/index.ts
  - src/lib/property-types/schemas/townhouse.ts
  - docs/0417-new/建安不動產欄位總表_建物版.docx
  - src/lib/property-types/schemas/other-land.ts
  - docs/0417-old/透天別墅_秘書後補清單.docx
  - docs/0417-old/工業地_現場必問清單.docx
  - docs/0417-old/不動產說明書13.pdf
  - stitch_ai/estate_logic/DESIGN.md
  - docs/0417-old/土地物調表-母版.docx
  - src/lib/pdf-generator/dossier.ts
  - docs/0417-old/其他土地_現場必問清單.docx
  - docs/0417-old/鄉村區建地_秘書後補清單.docx
  - .spectra.yaml
  - docs/0417-old/套房_現場必問清單.docx
  - src/app/listings/page.tsx
  - stitch_ai/ai/code.html
  - docs/0417-old/建物物調表-母版.dot
tests:
  - src/lib/property-types/__tests__/index.test.ts
  - src/lib/db/__tests__/listing-workflow.test.ts
  - src/lib/form-renderer/__tests__/field-visit-form.test.ts
  - src/lib/db/__tests__/regenerate.test.ts
  - src/lib/db/__tests__/e2e-residential.test.ts
  - src/lib/db/__tests__/index.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/app/api/__tests__/listings.test.ts
  - src/lib/form-renderer/__tests__/supplementary-form.test.ts
-->

---
### Requirement: Dossier can be regenerated independently

The system SHALL allow regenerating the property dossier independently via the regenerate API endpoint, using document type `property_dossier`.

#### Scenario: Regenerate dossier after data update

- **WHEN** a POST request is made to `/api/listings/{id}/regenerate` with `documentType: "property_dossier"`
- **THEN** the system SHALL regenerate only the dossier and update `generated_documents.property_dossier`

<!-- @trace
source: three-stage-listing-workflow-v2
updated: 2026-04-17
code:
  - docs/0417-old/其他土地_秘書後補清單.docx
  - docs/0417-old/商業地_現場必問清單.docx
  - docs/0417-old/建地_住宅地_秘書後補清單.docx
  - docs/0417-old/不動產說明書11.pdf
  - src/lib/property-types/schemas/commercial-land.ts
  - src/lib/property-types/schemas/highrise.ts
  - docs/0417-old/不動產說明書9.pdf
  - docs/0417-old/公寓_秘書後補清單.docx
  - src/lib/document-generator/types.ts
  - docs/0417-old/廠房_現場必問清單.docx
  - docs/0417-old/鄉村區建地_現場必問清單.docx
  - src/app/listings/[id]/documents/page.tsx
  - docs/0417-old/套房_秘書後補清單.docx
  - src/lib/property-types/schemas/rural-land.ts
  - docs/0417-old/農地_秘書後補清單.docx
  - stitch_ai/_2/screen.png
  - package.json
  - docs/0417-old/不動產說明書6.pdf
  - stitch_ai/ai/screen.png
  - docs/0417-old/不動產說明書5.pdf
  - docs/0417-old/不動產說明書2.pdf
  - docs/0417-old/農舍_現場必問清單.docx
  - docs/0417-old/店面_現場必問清單.docx
  - docs/0417-old/商業地_秘書後補清單.docx
  - docs/0417-old/周遭.pdf
  - docs/0417-old/不動產說明書8.pdf
  - src/app/api/listings/route.ts
  - src/lib/property-types/schemas/farmhouse.ts
  - docs/0417-old/不動產說明書12.pdf
  - stitch_ai/_2/code.html
  - docs/0417-old/不動產說明說15.pdf
  - docs/0417-old/工業地_秘書後補清單.docx
  - src/app/listings/new/page.tsx
  - src/lib/property-types/schemas/shop.ts
  - docs/0417-old/建地_住宅地_現場必問清單.docx
  - src/lib/property-types/schemas/industrial-land.ts
  - stitch_ai/_1/screen.png
  - docs/0417-old/不動產說明書14.pdf
  - src/lib/property-types/schemas/factory.ts
  - src/lib/property-types/index.ts
  - docs/0417-old/大樓華廈_秘書後補清單.docx
  - docs/0417-old/不動產說明書4.pdf
  - src/app/listings/[id]/fill/page.tsx
  - src/components/Sidebar.tsx
  - src/lib/db/schema.ts
  - docs/0417-old/店面_秘書後補清單.docx
  - docs/0417-old/大樓華廈_現場必問清單.docx
  - src/app/listings/[id]/generating/page.tsx
  - docs/0417-old/農地_現場必問清單.docx
  - docs/0417-old/農舍_秘書後補清單.docx
  - docs/0417-old/不動產說明書1.pdf
  - src/lib/property-types/schemas/suite.ts
  - src/lib/db/index.ts
  - docs/0417-new/建安不動產欄位總表.md
  - stitch_ai/_1/code.html
  - docs/0417-new/建安不動產欄位總表_土地版.docx
  - docs/0417-old/不動產書說明書10.pdf
  - docs/0417-old/不動產說明書3.pdf
  - src/lib/property-types/schemas/farmland.ts
  - src/lib/property-types/schemas/apartment.ts
  - src/lib/property-types/schemas/residential-land.ts
  - docs/0417-old/廠房_秘書後補清單.docx
  - docs/0417-old/透天別墅_現場必問清單.docx
  - docs/0417-old/不動產說明說16.pdf
  - docs/0417-old/透明房價一覽表成交行情.pdf
  - docs/0417-old/不動產書說明說7.pdf
  - stitch_ai/estate_elite/DESIGN.md
  - src/lib/form-renderer/index.ts
  - docs/0417-old/公寓_現場必問清單.docx
  - src/lib/property-types/schemas/index.ts
  - src/lib/property-types/schemas/townhouse.ts
  - docs/0417-new/建安不動產欄位總表_建物版.docx
  - src/lib/property-types/schemas/other-land.ts
  - docs/0417-old/透天別墅_秘書後補清單.docx
  - docs/0417-old/工業地_現場必問清單.docx
  - docs/0417-old/不動產說明書13.pdf
  - stitch_ai/estate_logic/DESIGN.md
  - docs/0417-old/土地物調表-母版.docx
  - src/lib/pdf-generator/dossier.ts
  - docs/0417-old/其他土地_現場必問清單.docx
  - docs/0417-old/鄉村區建地_秘書後補清單.docx
  - .spectra.yaml
  - docs/0417-old/套房_現場必問清單.docx
  - src/app/listings/page.tsx
  - stitch_ai/ai/code.html
  - docs/0417-old/建物物調表-母版.dot
tests:
  - src/lib/property-types/__tests__/index.test.ts
  - src/lib/db/__tests__/listing-workflow.test.ts
  - src/lib/form-renderer/__tests__/field-visit-form.test.ts
  - src/lib/db/__tests__/regenerate.test.ts
  - src/lib/db/__tests__/e2e-residential.test.ts
  - src/lib/db/__tests__/index.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/app/api/__tests__/listings.test.ts
  - src/lib/form-renderer/__tests__/supplementary-form.test.ts
-->

---
### Requirement: Disclosure document is downloadable as A4 PDF

The system SHALL convert the `disclosure_document` Markdown content into a downloadable A4 PDF via the `/api/listings/[id]/pdf?type=disclosure` endpoint.

The PDF SHALL include:
- Page header: listing number + property address on every page
- Page footer: page N of M on every page
- 建安不動產 LOGO in the top-right corner of the first page
- Table styling: thin borders, light grey header rows, repeated table headers across pages
- Chinese font: Noto Serif TC (loaded via CDN, fallback to system serif)
- Chapter separation with visible dividers and spacing

The server SHALL load the PDF template files (`dossier.html` and `dossier.css`) using an absolute path resolved from `process.cwd()` joined with `src/lib/pdf-generator/templates/`. The system MUST NOT rely on `__dirname` for template path resolution because `__dirname` resolves to a virtual path (such as `/ROOT/...`) under Next.js 16 with Turbopack server bundling, causing `ENOENT` errors when reading template files.

The `GET /api/listings/{id}/pdf?type=disclosure` endpoint SHALL return:
- HTTP 200 with `Content-Type: application/pdf` and the rendered PDF binary when the listing exists and `disclosure_document` content is present
- HTTP 404 when the listing ID does not exist
- HTTP 422 when the listing exists but `generated_documents.disclosure_document` is empty or equals the placeholder string `[PDF 由任務 10 實作]`

#### Scenario: PDF download from documents page

- **WHEN** user clicks "下載 PDF" on the disclosure document card for a listing whose disclosure document is ready
- **THEN** the server SHALL respond with HTTP 200 and `Content-Type: application/pdf`
- **THEN** browser SHALL download a PDF file named `disclosure-{listingId}.pdf`
- **THEN** the PDF SHALL render all 16 chapters with proper A4 layout

#### Scenario: PDF with empty supplementary data

- **WHEN** the listing has field_visit_data but no supplementary_data
- **THEN** the PDF SHALL still render all 16 chapters
- **THEN** chapters requiring supplementary data SHALL display `待補` in their fields

#### Scenario: Template loads successfully under Next.js Turbopack

- **WHEN** the server runs `npm run dev` on Next.js 16 with Turbopack and receives `GET /api/listings/{id}/pdf?type=disclosure`
- **THEN** the server SHALL successfully read `dossier.html` and `dossier.css` from the `src/lib/pdf-generator/templates/` directory using `process.cwd()` as the base
- **THEN** the response SHALL be HTTP 200 with a valid PDF binary
- **THEN** no `ENOENT` error referencing `/ROOT/src/lib/pdf-generator/templates/` SHALL appear in the server log

#### Scenario: PDF endpoint returns 404 for unknown listing

- **WHEN** the client sends `GET /api/listings/999999/pdf?type=disclosure` and listing 999999 does not exist
- **THEN** the server SHALL respond with HTTP 404 and JSON body `{"error": "not found"}`

#### Scenario: PDF endpoint returns 422 when disclosure content missing

- **WHEN** the client sends `GET /api/listings/{id}/pdf?type=disclosure` for a listing whose `generated_documents.disclosure_document` is empty or equals `[PDF 由任務 10 實作]`
- **THEN** the server SHALL respond with HTTP 422 and JSON body `{"error": "disclosure document not available"}`


<!-- @trace
source: improve-listings-ux-and-fix-pdf
updated: 2026-04-19
code:
  - src/lib/property-types/schemas/highrise.ts
  - package.json
  - scripts/cleanup-empty-drafts.ts
  - src/components/forms/FieldVisitForm.tsx
  - src/lib/form-renderer/index.ts
  - src/app/listings/[id]/fill/page.tsx
  - src/app/api/listings/[id]/generate/route.ts
  - src/lib/property-types/schemas/farmhouse.ts
  - src/lib/property-types/schemas/shop.ts
  - src/app/api/listings/[id]/route.ts
  - vitest.config.ts
  - src/lib/property-types/schemas/factory.ts
  - src/app/listings/[id]/generating/page.tsx
  - src/lib/property-types/schemas/apartment.ts
  - src/lib/property-types/schemas/other-land.ts
  - src/lib/property-types/schemas/rural-land.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/components/Stepper.tsx
  - src/components/outputs/RegenerateButton.tsx
  - src/lib/property-types/schemas/farmland.ts
  - src/app/api/listings/[id]/photos/route.ts
  - src/lib/form-renderer/chapter-grouper.ts
  - src/lib/property-types/schemas/residential-land.ts
  - src/app/api/listings/[id]/pdf/route.ts
  - src/lib/property-types/schemas/industrial-land.ts
  - src/lib/db/list-recent-helper.ts
  - src/components/Sidebar.tsx
  - src/lib/property-types/schemas/townhouse.ts
  - src/app/listings/[id]/supplementary/page.tsx
  - src/components/forms/SupplementaryForm.tsx
  - src/lib/pdf-generator/dossier.ts
  - src/lib/listing-routes.ts
  - src/app/listings/page.tsx
  - src/lib/property-types/schemas/commercial-land.ts
  - src/lib/property-types/schemas/suite.ts
  - src/components/forms/navigation-helpers.ts
  - src/app/api/listings/route.ts
  - src/lib/db/index.ts
tests:
  - src/app/api/__tests__/listings-delete.test.ts
  - src/lib/form-renderer/__tests__/field-visit-form.test.ts
  - src/components/forms/__tests__/field-visit-navigation.test.ts
  - src/lib/property-types/__tests__/index.test.ts
  - src/lib/db/__tests__/e2e-residential.test.ts
  - src/lib/__tests__/cleanup-empty-drafts.test.ts
  - src/app/api/__tests__/listings.test.ts
  - src/lib/db/__tests__/e2e-farmland.test.ts
  - src/lib/__tests__/listing-routes.test.ts
  - src/lib/property-types/schemas/__tests__/required-fields.test.ts
  - src/components/__tests__/Stepper.test.tsx
  - src/lib/db/__tests__/list-recent.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/app/api/__tests__/listings-photos.test.ts
-->

---
### Requirement: Disclosure document is generated with 16-chapter structure

The system SHALL generate a disclosure document with 16 chapters where the `disclosure_document` field contains Markdown with headings following `#### 章節 N：標題` format. The `disclosure_document` SHALL NOT contain placeholder text.

#### Scenario: Disclosure document is generated with 16-chapter structure

- **WHEN** the system generates documents for a listing that has field_visit_data
- **THEN** the `disclosure_document` field SHALL contain a 16-chapter Markdown string with chapter headings following `#### 章節 N：標題` format
- **THEN** the `disclosure_document` SHALL NOT contain the placeholder text `[PDF 由任務 10 實作]`

<!-- @trace
source: disclosure-pdf-16-chapter
updated: 2026-04-18
code:
  - src/lib/pdf-generator/dossier.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/lib/document-generator/codex-provider.ts
  - src/app/api/listings/[id]/pdf/route.ts
tests:
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/lib/document-generator/__tests__/land-type.test.ts
  - src/lib/document-generator/__tests__/five-documents.test.ts
-->

---
### Requirement: cover-table-fields

The PDF dossier cover table SHALL display exactly the following rows in order:
1. 物件編號 — sourced from `supplementary_data.case_number`; blank if absent
2. 物件名稱 — sourced from `supplementary_data.property_name`; blank if absent
3. 公司名稱 — sourced from `supplementary_data.company_name`, falling back to the `COMPANY_NAME` environment variable; blank if both absent
4. A three-cell row (no row header) containing: 承辦人（`supplementary_data.case_handler`）, 店長（`supplementary_data.shop_manager`）, 經紀人（`supplementary_data.agent_name` or `field_visit_data.agent_name`）

The table SHALL NOT contain an address row or a 案件編號 column.

#### Scenario: all fields present

- **WHEN** supplementary_data includes case_number = "A-001", property_name = "星鑽特區 美麗家園", company_name = "建安不動産", case_handler = "王小明", shop_manager = "陳大為", agent_name = "阿賀"
- **THEN** the PDF cover table shows exactly those four rows with those values

##### Example: cover table layout

| Row | Left cell | Right cell(s) |
|-----|-----------|---------------|
| 1 | 物件編號 | A-001 |
| 2 | 物件名稱 | 星鑽特區 美麗家園 |
| 3 | 公司名稱 | 建安不動産 |
| 4 | (no header) | 承辦人：王小明 ｜ 店長：陳大為 ｜ 經紀人：阿賀 |

#### Scenario: case_handler and shop_manager absent

- **WHEN** supplementary_data does not include case_handler or shop_manager
- **THEN** the corresponding cells in row 4 are blank (no placeholder text)


<!-- @trace
source: pdf-tax-and-field-fixes
updated: 2026-05-03
code:
  - src/lib/document-generator/tax-calculator.ts
  - src/lib/document-generator/build-input.ts
  - src/lib/pdf-generator/dossier.ts
  - src/lib/document-generator/pdf/dossier-building.ts
  - src/lib/parsers/transcript-parser.ts
  - scripts/e2e-verify-pdf.mjs
  - src/lib/pdf-generator/templates/dossier.html
tests:
  - src/lib/parsers/__tests__/transcript-parser.test.ts
  - src/lib/document-generator/pdf/__tests__/dossier-building.test.ts
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
-->

---
### Requirement: property-name-subtitle

Below the H1「不動產說明書」heading, the PDF SHALL render the property name as a subtitle element. The subtitle SHALL use the same value as `supplementary_data.property_name`. If absent, the subtitle element SHALL be empty (not hidden).

#### Scenario: property name present

- **WHEN** supplementary_data.property_name = "星鑽特區 美麗家園"
- **THEN** the page shows "不動產說明書" as the main heading and "星鑽特區 美麗家園" as the subtitle immediately below

#### Scenario: property name absent

- **WHEN** supplementary_data.property_name is empty
- **THEN** the subtitle element renders as an empty line (no placeholder text appears)

##### Example: empty subtitle HTML output

| supplementary_data.property_name | Rendered subtitle HTML |
|----------------------------------|------------------------|
| "" (empty string) | `<p class="dossier-subtitle"></p>` |
| undefined | `<p class="dossier-subtitle"></p>` |

<!-- @trace
source: pdf-tax-and-field-fixes
updated: 2026-05-03
code:
  - src/lib/document-generator/tax-calculator.ts
  - src/lib/document-generator/build-input.ts
  - src/lib/pdf-generator/dossier.ts
  - src/lib/document-generator/pdf/dossier-building.ts
  - src/lib/parsers/transcript-parser.ts
  - scripts/e2e-verify-pdf.mjs
  - src/lib/pdf-generator/templates/dossier.html
tests:
  - src/lib/parsers/__tests__/transcript-parser.test.ts
  - src/lib/document-generator/pdf/__tests__/dossier-building.test.ts
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
-->