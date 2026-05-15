# customer-logo-upload Specification

## Purpose

Let the customer upload a PNG or JPG logo (under 2 MiB), persist it as a SQLite BLOB, and inject it into the PDF at two fixed anchor points (cover 80×30mm, header 25×15mm) with proportional scaling and letterboxing to prevent distortion.

## ADDED Requirements

### Requirement: Client SHALL reject logo files larger than 2 MiB before IPC

The system SHALL inspect `file.size` in the LogoUploader React component immediately on file selection and SHALL refuse to call any IPC if the size exceeds 2,097,152 bytes (2 MiB). The UI SHALL display the error "Logo 檔案過大，請壓縮後再上傳（限 2 MiB 以下）".

#### Scenario: 3 MiB upload is rejected client-side without IPC

- **WHEN** the user selects a 3,000,000 byte PNG file in the LogoUploader
- **THEN** no `save_logo` IPC is invoked AND the UI displays "Logo 檔案過大，請壓縮後再上傳（限 2 MiB 以下）" within 100ms

#### Scenario: 1.9 MiB upload proceeds to IPC

- **WHEN** the user selects a 1,990,000 byte PNG file
- **THEN** the `save_logo` IPC is invoked exactly once with the file bytes

### Requirement: Client SHALL reject non-PNG / non-JPG files before IPC

The system SHALL inspect `file.type` and SHALL refuse to upload anything other than `image/png` or `image/jpeg`. The UI SHALL display "僅支援 PNG / JPG 格式".

#### Scenario: SVG upload is rejected

- **WHEN** the user selects a `.svg` file with MIME type `image/svg+xml`
- **THEN** no IPC is invoked AND the UI displays "僅支援 PNG / JPG 格式"

### Requirement: Backend SHALL re-validate logo bytes are a valid PNG or JPG

The system SHALL call `image::load_from_memory` on the uploaded bytes in the Tauri command and SHALL reject the upload with `LogoUploadError::CorruptedImage` if decoding fails or if the decoded format is neither PNG nor JPG.

#### Scenario: Corrupted PNG bytes are rejected by backend

- **WHEN** the IPC `save_logo` receives bytes whose first 8 bytes match the PNG signature but whose IDAT chunk is truncated
- **THEN** the IPC returns `LogoUploadError::CorruptedImage` AND the SQLite branding row's `logo_blob` remains unchanged

### Requirement: Logo SHALL persist as SQLite BLOB in the branding table

The system SHALL store the validated logo bytes in `branding.logo_blob` together with `logo_mime` (one of `image/png`, `image/jpeg`) and `logo_uploaded_at` ISO 8601 timestamp. The `branding` table SHALL be a singleton (CHECK constraint `id = 1`).

#### Scenario: Successful upload writes BLOB and metadata

- **WHEN** the IPC `save_logo({ bytes, mime: 'image/png' })` succeeds
- **THEN** `SELECT logo_mime, length(logo_blob), logo_uploaded_at FROM branding WHERE id = 1` returns `('image/png', <byte length>, <recent ISO timestamp>)`

### Requirement: Logo SHALL render at fixed cover anchor 80×30mm with proportional scaling

The system SHALL render the customer logo on the PDF cover at exactly 80mm wide × 30mm tall anchor frame using `@react-pdf/renderer` View with `width: '80mm', height: '30mm'`. The image SHALL use `objectFit: 'contain'` semantic (proportional scale + letterbox) so any source aspect ratio displays without distortion.

#### Scenario: Square logo letterboxed in 80×30 anchor

- **WHEN** a 1080×1080 px square PNG is uploaded and the cover renders
- **THEN** the rendered cover Logo View has computed dimensions 80mm × 30mm AND the visible logo image is centered horizontally with equal letterbox space on left and right (rendered logo width approximately 30mm, height 30mm)

### Requirement: Logo SHALL render at fixed header anchor 25×15mm on every page

The system SHALL render the same logo at every page header in a 25mm wide × 15mm tall anchor frame using the same `objectFit: 'contain'` semantic. The header anchor SHALL be at top-left of the page header band.

#### Scenario: Header logo appears on every page

- **WHEN** a PDF is rendered with 12 pages and a logo is set
- **THEN** every one of the 12 page headers contains a logo Image at the 25×15mm anchor (verified by counting Image nodes in the rendered React PDF tree)

### Requirement: Missing logo SHALL render placeholder text in anchor

The system SHALL render a placeholder Text "（未設定 LOGO）" inside the anchor frame when `branding.logo_blob` is NULL, using neutral grey color, so the customer sees that the area is reserved.

#### Scenario: No logo set shows placeholder

- **WHEN** the PDF renders with `branding.logo_blob = NULL`
- **THEN** both the cover and the page header anchors contain a Text element with content "（未設定 LOGO）"

### Requirement: delete_logo SHALL clear the BLOB without removing the row

The system SHALL expose IPC `delete_logo()` that sets `logo_blob = NULL`, `logo_mime = NULL`, `logo_uploaded_at = NULL` in the singleton branding row, but SHALL NOT delete the row (theme_id must persist).

#### Scenario: delete_logo preserves theme_id

- **WHEN** the IPC `delete_logo` is called after both logo and theme are set
- **THEN** `SELECT logo_blob, theme_id FROM branding WHERE id = 1` returns `(NULL, '<previously set theme>')`
