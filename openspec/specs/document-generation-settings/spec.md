# document-generation-settings Specification

## Purpose

TBD - created by archiving change 'ui-fixes-and-admin'. Update Purpose after archive.

## Requirements

### Requirement: Admin feature settings page controls document generation types

The system SHALL provide an admin-only settings page at /admin/features that lists all available document generation types. Only users with the admin role SHALL be able to access and modify these settings.

#### Scenario: Admin accesses feature settings
- **WHEN** an admin user navigates to /admin/features
- **THEN** the page SHALL display toggles for 5 document types: 不動產說明書, 物調表, 銷售 DM, 591 文案, 社群貼文

#### Scenario: Non-admin denied access
- **WHEN** a non-admin user attempts to navigate to /admin/features
- **THEN** the system SHALL redirect to the listings page or display an unauthorized message

#### Scenario: Admin enables a document type
- **WHEN** an admin toggles a document type to enabled and saves
- **THEN** the document generation page SHALL include that type as an available option for all users

#### Scenario: Admin disables a document type
- **WHEN** an admin toggles a document type to disabled and saves
- **THEN** the document generation page SHALL NOT show that type as an available option

<!-- @trace
source: ui-fixes-and-admin
updated: 2026-05-08
code:
  - src/app/api/me/route.ts
  - src/app/admin/users/page.tsx
  - src/app/admin/features/page.tsx
  - src/app/api/admin/templates/logo/route.ts
  - src/app/api/admin/templates/[id]/route.ts
  - src/components/Sidebar.tsx
  - src/app/api/documents/preview/route.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/components/AdminBreadcrumb.tsx
  - src/app/admin/layout.tsx
  - src/components/ColorSchemeSelector.tsx
  - src/app/api/license/init/route.ts
  - src/app/api/admin/templates/route.ts
  - src/lib/db/index.ts
  - src/app/api/documents/export-pdf/route.ts
  - src/components/forms/FieldVisitForm.tsx
  - src/app/listings/page.tsx
  - src/app/api/auth/[...nextauth]/route.ts
  - src/lib/template-engine.ts
  - src/lib/license/server-verify.ts
  - src/lib/auth/vendor.ts
  - design-system/AIRE/MASTER.md
  - src/app/admin/templates/page.tsx
  - src/app/api/admin/users/route.ts
  - src/lib/db/schema.ts
  - src/lib/branding/color-schemes.ts
  - src/components/UpdateChecker.tsx
  - src/components/TemplatePreview.tsx
  - migrations/005_vendor_account.sql
  - package.json
  - src/components/LogoUploader.tsx
  - design-system/AIRE/pages/admin.md
  - src/app/api/admin/doc-flags/route.ts
tests:
  - src/lib/auth/__tests__/vendor.test.ts
-->