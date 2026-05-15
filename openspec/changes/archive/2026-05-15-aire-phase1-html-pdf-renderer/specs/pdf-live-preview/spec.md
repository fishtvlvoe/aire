# pdf-live-preview Specification

## Purpose

Render the PDF to a Blob in memory and display it in an embedded React PDF Viewer with download and reprint buttons, without writing intermediate files to disk.

## ADDED Requirements

### Requirement: Preview SHALL render to Blob in memory without temp files

The system SHALL call `renderDisclosurePdf` and pass the resulting Blob directly to the embedded PDF viewer via an Object URL (`URL.createObjectURL(blob)`). The system SHALL NOT write any intermediate file to the OS temp directory or app data directory during preview.

#### Scenario: Preview generates no temp files

- **WHEN** the user clicks "預覽" on a case detail page and the preview loads
- **THEN** no new files appear in the OS temp directory or the Tauri app data directory during the render lifecycle

#### Scenario: Object URL is revoked when preview unmounts

- **WHEN** the user navigates away from the preview page
- **THEN** the previously created Object URL is revoked via `URL.revokeObjectURL` before the component unmounts (verified by ensuring no leaked URLs in `performance.getEntriesByType('resource')`)

### Requirement: Preview SHALL show first page within 3 seconds for typical cases

The system SHALL render a typical 10-page case PDF and display the first page in the viewer within 3000 ms on the reference dev machine (Apple M1 / Intel i5-10th gen or newer). The system SHALL show a loading spinner during render with the text "PDF 產生中…".

#### Scenario: 10-page case renders under 3 seconds

- **WHEN** a residential case with 4 photos and full survey is opened in preview on the reference machine
- **THEN** the first page becomes visible in the viewer within 3000 ms of clicking "預覽"

#### Scenario: Loading spinner shows during render

- **WHEN** the preview begins rendering
- **THEN** the UI displays a loading state with text "PDF 產生中…" until the Blob is ready

### Requirement: Preview SHALL provide download button writing to user-chosen path

The system SHALL render a "下載 PDF" button that opens the OS save dialog (Tauri `dialog.save`) restricted to `.pdf` extension. On user confirmation, the system SHALL write the in-memory Blob bytes to the chosen path via Tauri filesystem API.

#### Scenario: Download writes blob to chosen path

- **WHEN** the user clicks "下載 PDF", picks the path `~/Downloads/test.pdf` in the save dialog, and confirms
- **THEN** the file `~/Downloads/test.pdf` exists with byte content matching the rendered Blob AND its `.pdf` extension is intact

#### Scenario: Download cancelled does not write file

- **WHEN** the user clicks "下載 PDF" and cancels the save dialog
- **THEN** no file is written AND the preview remains intact

### Requirement: Preview SHALL re-render on branding-changed event

The system SHALL subscribe to the Tauri event `branding-changed` and SHALL re-trigger `renderDisclosurePdf` with the updated theme or logo when the event fires, swapping the displayed Blob.

#### Scenario: Theme switch updates preview live

- **WHEN** the user has the preview open with theme-a-minimal AND another tab calls `set_theme('theme-c-tech-elegant')`
- **THEN** the preview re-renders within 3000 ms showing theme-c-tech-elegant styling

### Requirement: Preview SHALL display typed error UI when rendering fails

The system SHALL catch any `PdfRenderError` from `renderDisclosurePdf` and SHALL display a typed error block in the viewer area with the error code, a user-friendly message, and a "重試" button. The system SHALL log the original error to the developer console.

#### Scenario: Engine failure shows retry UI

- **WHEN** `renderDisclosurePdf` rejects with `PdfRenderError::EngineFailure`
- **THEN** the viewer area displays an error block with code "EngineFailure", message "PDF 產生失敗，請聯繫客服", and a "重試" button AND the original error is in `console.error`

#### Scenario: Retry button reinvokes render

- **WHEN** the user clicks "重試" after an EngineFailure
- **THEN** `renderDisclosurePdf` is called again with the same arguments
