## ADDED Requirements

### Requirement: pdf-export-button

The PDF preview page SHALL include an "匯出 PDF" ST Button that triggers the export_pdf Tauri IPC command and provides feedback via Toast.

#### Scenario: successful PDF export

- **WHEN** the user clicks the "匯出 PDF" Button on the preview page
- **THEN** the system SHALL call the export_pdf Tauri IPC command with the current case ID
- **THEN** on success, the system SHALL display a success Toast "PDF 已匯出" with the file path
- **THEN** the Button SHALL show a loading spinner during export and be disabled to prevent double-click

#### Scenario: PDF export failure

- **WHEN** the export_pdf IPC command returns an error
- **THEN** the system SHALL display an error Toast with the error message
- **THEN** the Button SHALL return to its default enabled state

##### Example: IPC error response

- **GIVEN** the user is on /cases/abc-123/preview and clicks "匯出 PDF"
- **WHEN** export_pdf returns error with message "missing required field: caseId"
- **THEN** the Toast SHALL display "匯出失敗：missing required field: caseId"
- **THEN** the Button SHALL return to enabled state with text "匯出 PDF"

#### Scenario: preview page layout

- **WHEN** the user navigates to /cases/[id]/preview
- **THEN** the page SHALL display the PDF preview in the main content area with the "匯出 PDF" Button positioned at the top-right
