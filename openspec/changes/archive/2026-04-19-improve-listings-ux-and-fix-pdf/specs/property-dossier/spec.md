## MODIFIED Requirements

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
