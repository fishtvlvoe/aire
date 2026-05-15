## MODIFIED Requirements

### Requirement: Client SHALL reject non-PNG / non-JPG files before IPC

The logo uploader SHALL accept the following MIME types: `image/png`, `image/jpeg`, `image/svg+xml`, `image/avif`.

Files outside this set SHALL be rejected with an error toast message: "僅支援 PNG、JPEG、SVG、AVIF 格式".

The `SUPPORTED_MIME` set in `src/components/LogoUploader.tsx` SHALL include `image/svg+xml` and `image/avif` in addition to `image/png` and `image/jpeg`.

The `accept` attribute on the file input SHALL be updated to `image/png,image/jpeg,image/svg+xml,image/avif`.

#### Scenario: SVG upload accepted

WHEN a user selects a file with MIME type `image/svg+xml` (e.g., `brand-logo.svg`)
THEN the file SHALL pass the MIME check
AND be previewed in the logo uploader without error

##### Example:
- Input: file = { name: "logo.svg", type: "image/svg+xml", size: 4096 }
- Output: preview renders; no rejection toast

#### Scenario: AVIF upload accepted

WHEN a user selects a file with MIME type `image/avif` (e.g., `logo.avif`)
THEN the file SHALL pass the MIME check
AND be previewed in the logo uploader without error

##### Example:
- Input: file = { name: "logo.avif", type: "image/avif", size: 32768 }
- Output: preview renders; no rejection toast

#### Scenario: Unsupported format rejected

WHEN a user selects a file with MIME type `image/gif` or `image/webp`
THEN the uploader SHALL reject the file
AND display an error toast: "僅支援 PNG、JPEG、SVG、AVIF 格式"

##### Example:
- Input: file = { name: "animated.gif", type: "image/gif", size: 102400 }
- Output: toast "僅支援 PNG、JPEG、SVG、AVIF 格式" shown; file not uploaded
