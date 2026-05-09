## ADDED Requirements

### Requirement: Admin uploads and manages disclosure template background images

The system SHALL allow administrators to upload background images for the disclosure document template. Two background slots are supported: cover page and content page. Each background image is stored on R2 and its public URL is persisted in the feature_flags table.

#### Scenario: Admin uploads a cover page background

- **WHEN** admin sends POST /api/admin/templates/background with page=cover and a valid PNG or JPG file (max 5MB)
- **THEN** the system stores the file on R2 at path branding/backgrounds/cover.{ext}, updates feature_flags key doc_bg_cover with the R2 public URL, and returns 200 with the URL

**Example:**

| Input | Result |
|-------|--------|
| POST with page=cover, file=cover.png (800KB PNG) | feature_flags doc_bg_cover = https://pub-xxx.r2.dev/branding/backgrounds/cover.png |
| POST with page=content, file=bg.jpg (2MB JPG) | feature_flags doc_bg_content = https://pub-xxx.r2.dev/branding/backgrounds/bg.jpg |

#### Scenario: Admin uploads a file exceeding 5MB

- **WHEN** admin sends POST /api/admin/templates/background with a file larger than 5MB
- **THEN** the system returns 400 with error message indicating size limit exceeded and does not store the file

#### Scenario: Admin uploads an unsupported file type

- **WHEN** admin sends POST /api/admin/templates/background with a non-PNG/JPG file (e.g., SVG, PDF, GIF)
- **THEN** the system returns 400 with error message indicating only PNG and JPG are accepted

#### Scenario: Admin deletes a background image

- **WHEN** admin sends DELETE /api/admin/templates/background?page=cover
- **THEN** the system removes the file from R2, clears the feature_flags doc_bg_cover value, and returns 200

#### Scenario: Admin replaces an existing background

- **WHEN** admin uploads a new cover background while one already exists
- **THEN** the system deletes the old file from R2 before storing the new one, ensuring no orphaned files remain

#### Scenario: No background uploaded

- **WHEN** no background image has been uploaded for a page slot
- **THEN** the feature_flags key for that slot has an empty string value, and the preview renders without a background image for that page

**Example:**

| feature_flags key | value | Preview behavior |
|-------------------|-------|-----------------|
| doc_bg_cover | "" (empty) | Cover page renders white background, fields still overlaid |
| doc_bg_content | "" (empty) | Content page renders white background, fields still overlaid |
