## MODIFIED Requirements

> **Scope note**: This change only modifies the PDF rendering behavior (background applied to all content pages). Admin upload/delete/replace scenarios are pre-existing and included here for context completeness — they are NOT modified by this change.

### Requirement: Admin uploads and manages disclosure template background images

The system SHALL allow administrators to upload background images for the disclosure document template. Two background slots are supported: cover page and content page. Each background image is stored on R2 and its public URL is persisted in the feature_flags table.

The PDF generator SHALL apply background images as follows: the cover background SHALL be drawn on page 1 only; the content background SHALL be drawn on every page from page 2 onward (not only page 2). When a new page is created during automatic pagination, the content background SHALL be drawn on that new page before any text is rendered.

#### Scenario: Admin uploads a cover page background

WHEN admin sends POST /api/admin/templates/background with page=cover and a valid PNG or JPG file (max 5MB)
THEN the system stores the file on R2 at path branding/backgrounds/cover.{ext}, updates feature_flags key doc_bg_cover with the R2 public URL, and returns 200 with the URL

##### Example:
GIVEN admin is authenticated
WHEN POST /api/admin/templates/background with page=cover and cover.png (2MB)
THEN response is 200 with URL matching branding/backgrounds/cover.png

#### Scenario: Admin uploads a file exceeding 5MB

WHEN admin sends POST /api/admin/templates/background with a file larger than 5MB
THEN the system returns 400 with error message indicating size limit exceeded and does not store the file

##### Example:
GIVEN admin is authenticated
WHEN POST /api/admin/templates/background with page=cover and large.png (6MB)
THEN response is 400 with body containing "size limit"

#### Scenario: Admin uploads an unsupported file type

WHEN admin sends POST /api/admin/templates/background with a non-PNG/JPG file (e.g., SVG, PDF, GIF)
THEN the system returns 400 with error message indicating only PNG and JPG are accepted

##### Example:
GIVEN admin is authenticated
WHEN POST /api/admin/templates/background with page=cover and icon.svg
THEN response is 400 with body containing "only PNG and JPG"

#### Scenario: Admin deletes a background image

WHEN admin sends DELETE /api/admin/templates/background?page=cover
THEN the system removes the file from R2, clears the feature_flags doc_bg_cover value, and returns 200

##### Example:
GIVEN doc_bg_cover exists in feature_flags
WHEN DELETE /api/admin/templates/background?page=cover
THEN response is 200 and feature_flags doc_bg_cover is empty string

#### Scenario: Admin replaces an existing background

WHEN admin uploads a new cover background while one already exists
THEN the system deletes the old file from R2 before storing the new one, ensuring no orphaned files remain

##### Example:
GIVEN doc_bg_cover points to old-cover.png on R2
WHEN POST /api/admin/templates/background with page=cover and new-cover.png
THEN old-cover.png is deleted from R2 and doc_bg_cover updated to new URL

#### Scenario: No background uploaded

WHEN no background image has been uploaded for a page slot
THEN the feature_flags key for that slot has an empty string value, and the PDF renders without a background image for that page but maintains the same typesetting layout (margins, font sizes, spacing)

##### Example:
GIVEN feature_flags has no doc_bg_cover and no doc_bg_content entries
WHEN PDF is generated
THEN PDF has white backgrounds on all pages and text uses same margin/font/spacing as with backgrounds

#### Scenario: Content background applied to all content pages

WHEN the content background image is configured and the PDF has more than 2 pages
THEN every page from page 2 onward SHALL display the content background image, including pages created by automatic pagination when text overflows.

##### Example:
GIVEN doc_bg_content is configured and PDF has 11 pages
WHEN PDF is generated
THEN pdfimages -list shows 11 images (1 cover + 10 content backgrounds)
