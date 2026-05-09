# vendor-account-provisioning Specification

## Purpose

TBD - created by archiving change 'vendor-account'. Update Purpose after archive.

## Requirements

### Requirement: auto-provision-vendor-account

When the License init API receives a successful response from the License Server that includes a `vendorCredentials` object, the system SHALL automatically create or update a vendor account in the local users table.

#### Scenario: first-time license activation with vendor credentials

- **WHEN** a client activates their license for the first time and the License Server response includes `vendorCredentials` with username, passwordHash, and displayName
- **THEN** the system creates a new user record with `is_vendor = 1`, `role = 'admin'`, the provided username, passwordHash stored directly, displayName, and email set to `{username}@vendor.AIRE.app`

##### Example: initial vendor provisioning

- **GIVEN** License Server responds with `vendorCredentials: { username: "vendor-fish", passwordHash: "$2b$10$abc...", displayName: "系統維護" }`
- **WHEN** the license init API processes this response
- **THEN** a user record is inserted: `username = "vendor-fish"`, `email = "vendor-fish@vendor.AIRE.app"`, `role = "admin"`, `is_vendor = 1`, `password_hash = "$2b$10$abc..."`


<!-- @trace
source: vendor-account
updated: 2026-05-08
code:
  - src/app/api/license/init/route.ts
  - src/lib/license/server-verify.ts
  - migrations/005_vendor_account.sql
  - src/app/api/documents/export-pdf/route.ts
  - design-system/AIRE/pages/admin.md
  - src/components/Sidebar.tsx
  - src/app/api/auth/[...nextauth]/route.ts
  - src/lib/auth/vendor.ts
  - src/app/admin/layout.tsx
  - src/lib/db/schema.ts
  - src/components/UpdateChecker.tsx
  - src/lib/db/index.ts
  - src/app/api/admin/templates/route.ts
  - src/components/TemplatePreview.tsx
  - src/app/api/admin/users/route.ts
  - src/components/forms/FieldVisitForm.tsx
  - src/app/admin/users/page.tsx
  - src/app/api/me/route.ts
  - package.json
  - src/app/api/documents/preview/route.ts
  - src/app/admin/features/page.tsx
  - design-system/AIRE/MASTER.md
  - src/app/api/admin/templates/logo/route.ts
  - src/lib/template-engine.ts
  - src/app/admin/templates/page.tsx
  - src/components/AdminBreadcrumb.tsx
  - src/app/api/admin/templates/[id]/route.ts
  - src/app/listings/page.tsx
  - src/lib/branding/color-schemes.ts
  - src/components/LogoUploader.tsx
  - src/components/ColorSchemeSelector.tsx
  - src/app/api/admin/doc-flags/route.ts
  - src/app/listings/[id]/documents/page.tsx
tests:
  - src/lib/auth/__tests__/vendor.test.ts
-->

---
### Requirement: update-existing-vendor-account

When a vendor account with the same username already exists (is_vendor = 1), the system SHALL update the password_hash and display_name instead of creating a duplicate.

#### Scenario: re-activation updates vendor password

- **WHEN** a client re-verifies their license and a vendor account with the same username already exists
- **THEN** the system updates the existing vendor account's password_hash and display_name without creating a new record

##### Example: vendor password rotation

- **GIVEN** user record exists: `username = "vendor-fish"`, `is_vendor = 1`, `password_hash = "$2b$10$old..."`
- **WHEN** License Server responds with `vendorCredentials: { username: "vendor-fish", passwordHash: "$2b$10$new...", displayName: "系統維護" }`
- **THEN** the existing record is updated: `password_hash = "$2b$10$new..."`, no new record is created


<!-- @trace
source: vendor-account
updated: 2026-05-08
code:
  - src/app/api/license/init/route.ts
  - src/lib/license/server-verify.ts
  - migrations/005_vendor_account.sql
  - src/app/api/documents/export-pdf/route.ts
  - design-system/AIRE/pages/admin.md
  - src/components/Sidebar.tsx
  - src/app/api/auth/[...nextauth]/route.ts
  - src/lib/auth/vendor.ts
  - src/app/admin/layout.tsx
  - src/lib/db/schema.ts
  - src/components/UpdateChecker.tsx
  - src/lib/db/index.ts
  - src/app/api/admin/templates/route.ts
  - src/components/TemplatePreview.tsx
  - src/app/api/admin/users/route.ts
  - src/components/forms/FieldVisitForm.tsx
  - src/app/admin/users/page.tsx
  - src/app/api/me/route.ts
  - package.json
  - src/app/api/documents/preview/route.ts
  - src/app/admin/features/page.tsx
  - design-system/AIRE/MASTER.md
  - src/app/api/admin/templates/logo/route.ts
  - src/lib/template-engine.ts
  - src/app/admin/templates/page.tsx
  - src/components/AdminBreadcrumb.tsx
  - src/app/api/admin/templates/[id]/route.ts
  - src/app/listings/page.tsx
  - src/lib/branding/color-schemes.ts
  - src/components/LogoUploader.tsx
  - src/components/ColorSchemeSelector.tsx
  - src/app/api/admin/doc-flags/route.ts
  - src/app/listings/[id]/documents/page.tsx
tests:
  - src/lib/auth/__tests__/vendor.test.ts
-->

---
### Requirement: no-vendor-without-credentials

When the License Server response does NOT include `vendorCredentials`, the system SHALL NOT create any vendor account.

#### Scenario: license activation without vendor credentials

- **WHEN** the License Server response is valid but does not contain `vendorCredentials`
- **THEN** no vendor account is created or modified, and the license activation proceeds normally

<!-- @trace
source: vendor-account
updated: 2026-05-08
code:
  - src/app/api/license/init/route.ts
  - src/lib/license/server-verify.ts
  - migrations/005_vendor_account.sql
  - src/app/api/documents/export-pdf/route.ts
  - design-system/AIRE/pages/admin.md
  - src/components/Sidebar.tsx
  - src/app/api/auth/[...nextauth]/route.ts
  - src/lib/auth/vendor.ts
  - src/app/admin/layout.tsx
  - src/lib/db/schema.ts
  - src/components/UpdateChecker.tsx
  - src/lib/db/index.ts
  - src/app/api/admin/templates/route.ts
  - src/components/TemplatePreview.tsx
  - src/app/api/admin/users/route.ts
  - src/components/forms/FieldVisitForm.tsx
  - src/app/admin/users/page.tsx
  - src/app/api/me/route.ts
  - package.json
  - src/app/api/documents/preview/route.ts
  - src/app/admin/features/page.tsx
  - design-system/AIRE/MASTER.md
  - src/app/api/admin/templates/logo/route.ts
  - src/lib/template-engine.ts
  - src/app/admin/templates/page.tsx
  - src/components/AdminBreadcrumb.tsx
  - src/app/api/admin/templates/[id]/route.ts
  - src/app/listings/page.tsx
  - src/lib/branding/color-schemes.ts
  - src/components/LogoUploader.tsx
  - src/components/ColorSchemeSelector.tsx
  - src/app/api/admin/doc-flags/route.ts
  - src/app/listings/[id]/documents/page.tsx
tests:
  - src/lib/auth/__tests__/vendor.test.ts
-->