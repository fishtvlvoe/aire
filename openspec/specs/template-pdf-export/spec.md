# template-pdf-export Specification

## Purpose

TBD - created by archiving change 'html-template-system'. Update Purpose after archive.

## Requirements

### Requirement: PDF export API converts rendered template to PDF

The system SHALL provide an API endpoint POST /api/documents/export-pdf that accepts { listingId: number, templateId: number } and returns a PDF file. The endpoint SHALL render the template with listing data, then use Puppeteer to convert the HTML to PDF with A4 page size and 15mm margins. The response SHALL have Content-Type application/pdf and Content-Disposition attachment header with a filename based on the listing address or id.

#### Scenario: Successful PDF export
- **WHEN** a user sends POST /api/documents/export-pdf with valid listingId and templateId
- **THEN** the system SHALL return HTTP 200 with a PDF binary file

#### Scenario: PDF respects template page layout
- **WHEN** the template uses CSS @page rules for margins or headers
- **THEN** the generated PDF SHALL reflect those CSS @page rules

#### Scenario: Template not found for PDF export
- **WHEN** a user sends POST /api/documents/export-pdf with a templateId that does not exist
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
### Requirement: User can download PDF from preview page

The document generation page SHALL display a "下載 PDF" button when a template preview is active. Clicking the button SHALL trigger the export-pdf API call and initiate a file download in the browser.

#### Scenario: Download button triggers PDF download
- **WHEN** a user clicks "下載 PDF" while previewing a template
- **THEN** the browser SHALL download a PDF file named with the listing identifier

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