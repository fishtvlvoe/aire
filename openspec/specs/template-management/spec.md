# template-management Specification

## Purpose

TBD - created by archiving change 'admin-ui-redesign'. Update Purpose after archive.

## Requirements

### Requirement: simplified-template-selection

- The template management page SHALL display 6 predefined color scheme cards in a 3x2 grid layout.
- Each color scheme card SHALL show the header background color as a preview swatch (80px height) and the scheme name below.
- The selected color scheme SHALL be indicated with a ring-2 border in the primary brand color (#1B3A6B).
- The system SHALL store the selected color scheme ID in the feature_flags table (key=doc_color_scheme).
- The template management page SHALL provide a logo upload area that accepts PNG, JPG, and SVG files up to 1MB.
- Uploaded logos SHALL be saved to data/branding/logo.{ext}, overwriting any previous logo file.
- The logo preview SHALL render at a maximum size of 120x60px with object-fit: contain.
- A remove button SHALL delete the logo file and clear the doc_logo_path record in feature_flags.
- On page load, the system SHALL pre-select the previously saved color scheme and display the saved logo.
- The previous HTML template upload mechanism (Handlebars engine, HTML file storage, DOMPurify sanitization) SHALL be removed.

#### Scenario: Admin selects a color scheme and uploads logo

Given the admin navigates to /admin/templates
When the admin clicks the "森林綠" color scheme card
Then the card shows a ring-2 ring-[#1B3A6B] border indicating selection
When the admin uploads a 500KB PNG file via the logo upload area
Then the logo preview displays at max 120x60px with object-contain
When the admin clicks the save button
Then the system stores doc_color_scheme='forest' and doc_logo_path='data/branding/logo.png' in feature_flags

##### Example: Selecting forest scheme and uploading logo

PATCH /api/admin/templates body: { "colorScheme": "forest" }
POST /api/admin/templates/logo body: FormData with file=logo.png (500KB)
DB after save: feature_flags rows = [{key:'doc_color_scheme', value:'forest'}, {key:'doc_logo_path', value:'data/branding/logo.png'}]

#### Scenario: Admin removes logo

Given a logo is currently saved (doc_logo_path is not empty)
When the admin clicks the remove logo button
Then the logo file is deleted from data/branding/
And doc_logo_path is cleared in feature_flags
And the upload area reverts to the empty dashed-border state

##### Example: Color scheme options

| ID | Name | headerBg | headerText | accentColor |
|----|------|----------|------------|-------------|
| navy | 深藍經典 | #1B3A6B | #FFFFFF | #2563EB |
| slate | 石板灰 | #334155 | #FFFFFF | #64748B |
| warm | 暖棕 | #78350F | #FFFFFF | #D97706 |
| forest | 森林綠 | #14532D | #FFFFFF | #16A34A |
| white | 純白簡約 | #FFFFFF | #1E293B | #3B82F6 |
| burgundy | 酒紅 | #7F1D1D | #FFFFFF | #DC2626 |

<!-- @trace
source: admin-ui-redesign
updated: 2026-05-08
code:
  - src/app/api/documents/export-pdf/route.ts
  - src/app/admin/templates/page.tsx
  - src/components/AdminBreadcrumb.tsx
  - src/components/LogoUploader.tsx
  - src/app/api/admin/templates/route.ts
  - src/components/TemplatePreview.tsx
  - design-system/AIRE/MASTER.md
  - src/app/listings/[id]/documents/page.tsx
  - design-system/AIRE/pages/admin.md
  - src/app/admin/layout.tsx
  - package.json
  - src/app/api/admin/templates/logo/route.ts
  - src/lib/template-engine.ts
  - src/app/admin/features/page.tsx
  - src/lib/branding/color-schemes.ts
  - src/app/admin/users/page.tsx
  - src/app/api/admin/templates/[id]/route.ts
  - src/lib/db/schema.ts
  - src/components/ColorSchemeSelector.tsx
  - src/app/api/documents/preview/route.ts
-->

---
### Requirement: Admin can upload HTML templates

The system SHALL provide an API endpoint POST /api/admin/templates that accepts an HTML file upload with metadata (name, description, doc_type). The uploaded file MUST be validated for: file extension (.html or .htm), file size (2MB maximum), presence of at least one Mustache variable marker ({{), and sanitized with DOMPurify to remove script tags while preserving style tags. The template metadata SHALL be stored in the templates SQLite table and the HTML content SHALL be saved to data/templates/{id}.html.

#### Scenario: Successful template upload
- **WHEN** an admin uploads a valid HTML file with name "品牌模板A" and doc_type "disclosure"
- **THEN** the system SHALL return HTTP 201 with the created template metadata including id, name, doc_type, and is_default=false

#### Scenario: File too large
- **WHEN** an admin uploads an HTML file larger than 2MB
- **THEN** the system SHALL return HTTP 400 with error message indicating the size limit

#### Scenario: Missing variable markers
- **WHEN** an admin uploads an HTML file containing no {{ markers
- **THEN** the system SHALL return HTTP 400 with error message indicating the template must contain variable placeholders

#### Scenario: Malicious script tags removed
- **WHEN** an admin uploads an HTML file containing script tags
- **THEN** the system SHALL strip all script tags before saving, preserving style tags and other HTML content


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
  - design-system/AIRE/pages/admin.md
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
  - design-system/AIRE/MASTER.md
  - src/lib/db/schema.ts
  - src/components/TemplatePreview.tsx
  - src/app/api/admin/templates/logo/route.ts
tests:
  - src/lib/auth/__tests__/vendor.test.ts
-->

---
### Requirement: Admin can list all templates

The system SHALL provide an API endpoint GET /api/admin/templates that returns all templates with their metadata. Results SHALL be filterable by doc_type query parameter.

#### Scenario: List all templates
- **WHEN** an admin sends GET /api/admin/templates
- **THEN** the system SHALL return HTTP 200 with an array of template objects sorted by created_at descending

#### Scenario: Filter by doc_type
- **WHEN** an admin sends GET /api/admin/templates?doc_type=disclosure
- **THEN** the system SHALL return only templates with doc_type "disclosure"


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
  - design-system/AIRE/pages/admin.md
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
  - design-system/AIRE/MASTER.md
  - src/lib/db/schema.ts
  - src/components/TemplatePreview.tsx
  - src/app/api/admin/templates/logo/route.ts
tests:
  - src/lib/auth/__tests__/vendor.test.ts
-->

---
### Requirement: Admin can delete a template

The system SHALL provide an API endpoint DELETE /api/admin/templates/{id} that removes the template metadata from the database and deletes the HTML file from data/templates/{id}.html.

#### Scenario: Successful deletion
- **WHEN** an admin sends DELETE /api/admin/templates/5
- **THEN** the system SHALL remove the database row and HTML file, returning HTTP 200

#### Scenario: Delete non-existent template
- **WHEN** an admin sends DELETE /api/admin/templates/999 for a template that does not exist
- **THEN** the system SHALL return HTTP 404


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
  - design-system/AIRE/pages/admin.md
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
  - design-system/AIRE/MASTER.md
  - src/lib/db/schema.ts
  - src/components/TemplatePreview.tsx
  - src/app/api/admin/templates/logo/route.ts
tests:
  - src/lib/auth/__tests__/vendor.test.ts
-->

---
### Requirement: Admin can set a default template

The system SHALL provide an API endpoint PATCH /api/admin/templates/{id} that accepts { is_default: true }. Setting a template as default SHALL unset the previous default template for the same doc_type (set is_default=0) before setting the new one (is_default=1).

#### Scenario: Set new default
- **WHEN** an admin sets template 3 as default for doc_type "disclosure", and template 1 was previously the default
- **THEN** template 1 SHALL have is_default=0 and template 3 SHALL have is_default=1

##### Example: Default swap
- **GIVEN** templates: T1(doc_type=disclosure, is_default=1), T2(doc_type=disclosure, is_default=0), T3(doc_type=dm, is_default=1)
- **WHEN** admin sets T2 as default
- **THEN** T1.is_default=0, T2.is_default=1, T3.is_default=1 (T3 unchanged because different doc_type)

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
  - design-system/AIRE/pages/admin.md
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
  - design-system/AIRE/MASTER.md
  - src/lib/db/schema.ts
  - src/components/TemplatePreview.tsx
  - src/app/api/admin/templates/logo/route.ts
tests:
  - src/lib/auth/__tests__/vendor.test.ts
-->