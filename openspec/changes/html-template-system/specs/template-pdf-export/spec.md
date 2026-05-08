## ADDED Requirements

### Requirement: PDF export API converts rendered template to PDF

The system SHALL provide an API endpoint POST /api/documents/export-pdf that accepts { listingId: number, templateId: number } and returns a PDF file. The endpoint SHALL render the template with listing data, then use Puppeteer to convert the HTML to PDF with A4 page size and 15mm margins. The response SHALL have Content-Type application/pdf and Content-Disposition attachment header with a filename based on the listing address or id.

#### Scenario: Successful PDF export
- **WHEN** a user sends POST /api/documents/export-pdf with valid listingId and templateId
- **THEN** the system SHALL return HTTP 200 with a PDF binary file

#### Scenario: PDF respects template page layout
- **WHEN** the template uses CSS @page rules for margins or headers
- **THEN** the generated PDF SHALL reflect those CSS @page rules

#### Scenario: Template not found for PDF export
- **WHEN** a user sends POST /api/documents/export-pdf with a templateId that does not exist
- **THEN** the system SHALL return HTTP 404

### Requirement: User can download PDF from preview page

The document generation page SHALL display a "下載 PDF" button when a template preview is active. Clicking the button SHALL trigger the export-pdf API call and initiate a file download in the browser.

#### Scenario: Download button triggers PDF download
- **WHEN** a user clicks "下載 PDF" while previewing a template
- **THEN** the browser SHALL download a PDF file named with the listing identifier
