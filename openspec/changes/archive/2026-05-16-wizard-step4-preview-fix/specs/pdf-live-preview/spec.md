## ADDED Requirements

### Requirement: Browser dev mode compatibility

PdfPreviewer SHALL NOT import Tauri-specific modules (`@tauri-apps/api/core`, `@tauri-apps/plugin-dialog`) at the top level. These imports SHALL use dynamic import (`await import(...)`) inside the functions that need them, guarded by Tauri environment detection.

#### Scenario: PdfPreviewer renders in browser dev mode

- **WHEN** PdfPreviewer is mounted in a browser without Tauri runtime
- **THEN** PDF preview iframe renders normally; no import errors in console; download button uses browser-native download (anchor element)

#### Scenario: PdfPreviewer renders in Tauri desktop mode

- **WHEN** PdfPreviewer is mounted inside Tauri desktop shell
- **THEN** PDF preview iframe renders normally; download button opens native save dialog via Tauri plugin-dialog
