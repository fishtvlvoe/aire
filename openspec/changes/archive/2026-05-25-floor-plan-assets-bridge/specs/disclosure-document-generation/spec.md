## MODIFIED Requirements

### Requirement: PDF preview export writes generated PDF bytes
The PDF preview page SHALL export the current disclosure document by generating PDF bytes in the frontend and sending those bytes to the Tauri `export_pdf` command with the Rust command's required argument shape.

#### Scenario: Tauri preview export
- **WHEN** a user clicks the preview page "匯出 PDF" button in the Tauri desktop environment
- **THEN** the system SHALL generate PDF bytes from the current `PdfDocument`
- **THEN** the system SHALL call the Rust `export_pdf` command with `caseId`, `pdfBytes`, and `outputPath`
- **THEN** the system SHALL NOT call `export_pdf` with an HTML string

#### Scenario: browser preview export
- **WHEN** a user clicks the preview page "匯出 PDF" button outside Tauri in development mode
- **THEN** the system SHALL generate a PDF blob from the current `PdfDocument`
- **THEN** the system SHALL trigger a browser download without calling the Rust `export_pdf` command

#### Scenario: dossier data unavailable
- **WHEN** a user clicks the preview page "匯出 PDF" button before dossier data has loaded
- **THEN** the system SHALL show an export failure message
- **THEN** the system SHALL NOT call the Rust `export_pdf` command
