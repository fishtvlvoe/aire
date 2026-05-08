# template-preview Specification

## Purpose

TBD - created by archiving change 'html-template-system'. Update Purpose after archive.

## Requirements

### Requirement: Preview API returns rendered HTML for a listing and template combination

The system SHALL provide an API endpoint POST /api/documents/preview that accepts { listingId: number, templateId: number } and returns the fully rendered HTML as a text/html response. The endpoint SHALL read the template file, merge listing data using the template engine, and return the result.

#### Scenario: Successful preview
- **WHEN** a user sends POST /api/documents/preview with listingId=1 and templateId=2
- **THEN** the system SHALL return HTTP 200 with Content-Type text/html containing the rendered template with listing 1's data

#### Scenario: Template not found
- **WHEN** a user sends POST /api/documents/preview with a templateId that does not exist
- **THEN** the system SHALL return HTTP 404 with error message

#### Scenario: Listing not found
- **WHEN** a user sends POST /api/documents/preview with a listingId that does not exist
- **THEN** the system SHALL return HTTP 404 with error message


<!-- @trace
source: html-template-system
updated: 2026-05-08
code:
  - src/app/listings/[id]/documents/page.tsx
  - src/lib/license/server-verify.ts
  - src/app/api/documents/export-pdf/route.ts
  - src/app/admin/users/page.tsx
  - src/components/forms/FieldVisitForm.tsx
  - src/components/AdminBreadcrumb.tsx
  - src/app/api/documents/preview/route.ts
  - src/app/admin/layout.tsx
  - src/lib/db/index.ts
  - design-system/three-ai/pages/admin.md
  - src/app/admin/templates/page.tsx
  - src/app/listings/page.tsx
  - src/components/Sidebar.tsx
  - src/app/api/admin/doc-flags/route.ts
  - src/lib/branding/color-schemes.ts
  - src/components/LogoUploader.tsx
  - src/app/api/auth/[...nextauth]/route.ts
  - src/lib/auth/vendor.ts
  - package.json
  - src/app/admin/features/page.tsx
  - src/app/api/license/init/route.ts
  - src/app/api/admin/users/route.ts
  - src/components/UpdateChecker.tsx
  - migrations/005_vendor_account.sql
  - src/app/api/admin/templates/[id]/route.ts
  - src/components/ColorSchemeSelector.tsx
  - src/app/api/admin/templates/route.ts
  - src/lib/template-engine.ts
  - src/app/api/me/route.ts
  - design-system/three-ai/MASTER.md
  - src/lib/db/schema.ts
  - src/components/TemplatePreview.tsx
  - src/app/api/admin/templates/logo/route.ts
tests:
  - src/lib/auth/__tests__/vendor.test.ts
-->

---
### Requirement: Frontend displays preview in sandboxed iframe

The TemplatePreview component SHALL render the preview HTML inside an iframe with sandbox attribute to isolate the template's CSS and scripts from the main application. The iframe SHALL use the srcdoc attribute to inject the HTML content directly without requiring a separate URL.

#### Scenario: Preview renders in iframe
- **WHEN** a user selects a template and clicks preview on the document generation page
- **THEN** the page SHALL display an iframe showing the rendered template with the current listing's data

#### Scenario: Template CSS does not leak
- **WHEN** the template contains CSS rules that would affect body or global elements
- **THEN** the main application page layout SHALL NOT be affected by those CSS rules

<!-- @trace
source: html-template-system
updated: 2026-05-08
code:
  - src/app/listings/[id]/documents/page.tsx
  - src/lib/license/server-verify.ts
  - src/app/api/documents/export-pdf/route.ts
  - src/app/admin/users/page.tsx
  - src/components/forms/FieldVisitForm.tsx
  - src/components/AdminBreadcrumb.tsx
  - src/app/api/documents/preview/route.ts
  - src/app/admin/layout.tsx
  - src/lib/db/index.ts
  - design-system/three-ai/pages/admin.md
  - src/app/admin/templates/page.tsx
  - src/app/listings/page.tsx
  - src/components/Sidebar.tsx
  - src/app/api/admin/doc-flags/route.ts
  - src/lib/branding/color-schemes.ts
  - src/components/LogoUploader.tsx
  - src/app/api/auth/[...nextauth]/route.ts
  - src/lib/auth/vendor.ts
  - package.json
  - src/app/admin/features/page.tsx
  - src/app/api/license/init/route.ts
  - src/app/api/admin/users/route.ts
  - src/components/UpdateChecker.tsx
  - migrations/005_vendor_account.sql
  - src/app/api/admin/templates/[id]/route.ts
  - src/components/ColorSchemeSelector.tsx
  - src/app/api/admin/templates/route.ts
  - src/lib/template-engine.ts
  - src/app/api/me/route.ts
  - design-system/three-ai/MASTER.md
  - src/lib/db/schema.ts
  - src/components/TemplatePreview.tsx
  - src/app/api/admin/templates/logo/route.ts
tests:
  - src/lib/auth/__tests__/vendor.test.ts
-->