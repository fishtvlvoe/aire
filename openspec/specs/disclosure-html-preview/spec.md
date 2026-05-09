# disclosure-html-preview Specification

## Purpose

TBD - created by archiving change 'disclosure-preview'. Update Purpose after archive.

## Requirements

### Requirement: System renders disclosure document as HTML preview with template background

The system SHALL render the disclosure document as an HTML page with the customer's template background image as the background layer and listing field data overlaid as positioned text elements. The preview page is accessible from the listing documents page via a preview button.

#### Scenario: User clicks preview button on listing documents page

- **WHEN** user clicks the "Preview" button for a disclosure document on /listings/[id]/documents
- **THEN** the system navigates to /listings/[id]/documents/preview, which displays the disclosure document rendered over the template background

#### Scenario: Preview page renders with background image

- **WHEN** the preview page loads and a cover background image exists in feature_flags
- **THEN** the cover page section displays the background image at full width within an A4-ratio container (794x1123px at 96dpi), and listing field values are positioned over the background using CSS absolute positioning based on the field layout definition

**Example:**

| Background exists | Render behavior |
|-------------------|----------------|
| doc_bg_cover has URL | Cover page shows background image with fields overlaid |
| doc_bg_cover is empty | Cover page shows white background with fields overlaid |
| doc_bg_content has URL | Content page shows background image with fields overlaid |

#### Scenario: Preview page renders listing data in fields

- **WHEN** the preview page loads for a listing with id=42
- **THEN** the system fetches listing data via GET /api/documents/disclosure-preview?listingId=42 and populates each field position with the corresponding listing value (e.g., listing.title in the object-name field, listing.address in the address field)

#### Scenario: Preview page is responsive

- **WHEN** the preview page is viewed on a screen narrower than 794px
- **THEN** the A4 container scales down using CSS transform: scale() to fit the viewport width while maintaining the A4 aspect ratio

#### Scenario: Preview API returns field data and background URLs

- **WHEN** GET /api/documents/disclosure-preview?listingId=42 is called
- **THEN** the API returns JSON with fields array (each containing fieldKey, label, value, and position data) and backgrounds object (cover and content URLs from feature_flags)

<!-- @trace
source: disclosure-preview
updated: 2026-05-09
code:
  - src/app/api/documents/disclosure-preview/route.ts
  - src/components/DisclosurePreview.tsx
  - playwright.config.ts
  - src/app/api/admin/templates/background/route.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/app/admin/(dashboard)/templates/page.tsx
  - src/lib/branding/field-layouts.ts
  - src/app/api/documents/disclosure-preview/save/route.ts
  - src/components/DisclosureFieldOverlay.tsx
  - src/app/listings/[id]/documents/preview/page.tsx
  - src/app/api/admin/templates/route.ts
  - src/lib/db/schema.ts
tests:
  - e2e/disclosure-preview-flow.spec.ts
  - src/app/api/__tests__/disclosure-preview-save.test.ts
  - src/app/api/__tests__/disclosure-preview.test.ts
-->