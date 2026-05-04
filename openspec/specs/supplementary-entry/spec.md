# supplementary-entry Specification

## Purpose

TBD - created by archiving change 'supplementary-independence'. Update Purpose after archive.

## Requirements

### Requirement: Supplementary status icon on listing row

The system SHALL display a supplementary data status icon on each listing row in the list view.

#### Scenario: Listing with missing required fields

- **WHEN** a listing has status "in-progress" or higher and has unfilled required supplementary fields
- **THEN** the list row SHALL display a warning icon (⚠️) in the supplement status column

#### Scenario: Listing with all supplementary fields completed

- **WHEN** a listing has all required supplementary fields filled
- **THEN** the list row SHALL display a checkmark icon (✅) in the supplement status column

##### Example: Complete listing icon

- **GIVEN** listing #3 has status "in-progress" and 5/5 required supplementary fields filled
- **WHEN** listing #3 appears in the list
- **THEN** its supplement column SHALL show ✅

#### Scenario: Draft listing not yet in supplementary phase

- **WHEN** a listing is still in "draft" status
- **THEN** the list row SHALL display a dash (──) in the supplement status column


<!-- @trace
source: supplementary-independence
updated: 2026-05-04
code:
  - src/lib/listings/supplementary-status.ts
  - src/app/listings/page.tsx
  - package.json
  - src/components/listings/SupplementStatusIcon.tsx
  - src/app/api/listings/[id]/restore/route.ts
  - src/app/api/listings/[id]/archive/route.ts
  - src/app/listings/[id]/generating/page.tsx
  - src/app/api/admin/users/[id]/reset-password/route.ts
  - src/app/admin/transfer/page.tsx
  - src/lib/db/schema.ts
  - src/lib/generators/disclaimer.ts
  - src/app/listings/[id]/supplementary/page.tsx
  - src/app/login/page.tsx
  - src/components/FolderSidebar.tsx
  - src/app/api/listings/[id]/route.ts
  - src/proxy.ts
  - src/app/admin/users/page.tsx
  - src/app/api/listings/route.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/components/Stepper.tsx
  - src/app/api/admin/audit-logs/route.ts
  - src/lib/db/list-recent-helper.ts
  - src/lib/pdf-generator/dossier.ts
  - src/app/admin/audit-logs/page.tsx
  - src/lib/audit.ts
  - src/app/listings/[id]/fill/page.tsx
  - src/lib/pdf-generator/survey-sales.ts
  - src/app/api/listings/folders/[id]/route.ts
  - src/lib/generators/disclosure-document.ts
  - src/app/listings/[id]/supplement/page.tsx
  - src/lib/auth.ts
  - src/lib/db/index.ts
  - src/app/api/auth/login/route.ts
  - src/components/SearchBar.tsx
  - src/app/api/admin/transfer-cases/route.ts
  - src/lib/generators/property-sheet.ts
  - src/app/api/listings/[id]/folder/route.ts
  - src/app/api/listings/folders/route.ts
  - src/app/api/admin/users/[id]/disable/route.ts
  - src/app/api/admin/users/route.ts
  - src/app/api/auth/logout/route.ts
tests:
  - e2e/user-management.spec.ts
  - src/components/__tests__/Stepper.test.tsx
  - e2e/listing-ux.spec.ts
-->

---
### Requirement: Independent supplementary page route

The system SHALL provide an independent route for supplementary data entry at /listings/[id]/supplement.

#### Scenario: Navigate via icon click

- **WHEN** user clicks the supplement status icon (⚠️ or ✅) on a listing row
- **THEN** browser SHALL navigate to /listings/[id]/supplement

##### Example: Icon click navigation

- **GIVEN** listing #7 shows ⚠️ icon in the supplement column
- **WHEN** user clicks the ⚠️ icon
- **THEN** browser SHALL navigate to /listings/7/supplement

#### Scenario: Direct URL access

- **WHEN** user navigates to /listings/[id]/supplement directly
- **THEN** the supplementary form for that listing SHALL be displayed

##### Example: Direct URL

- **GIVEN** listing #7 exists
- **WHEN** user enters /listings/7/supplement in browser
- **THEN** the supplementary form for listing #7 SHALL render


<!-- @trace
source: supplementary-independence
updated: 2026-05-04
code:
  - src/lib/listings/supplementary-status.ts
  - src/app/listings/page.tsx
  - package.json
  - src/components/listings/SupplementStatusIcon.tsx
  - src/app/api/listings/[id]/restore/route.ts
  - src/app/api/listings/[id]/archive/route.ts
  - src/app/listings/[id]/generating/page.tsx
  - src/app/api/admin/users/[id]/reset-password/route.ts
  - src/app/admin/transfer/page.tsx
  - src/lib/db/schema.ts
  - src/lib/generators/disclaimer.ts
  - src/app/listings/[id]/supplementary/page.tsx
  - src/app/login/page.tsx
  - src/components/FolderSidebar.tsx
  - src/app/api/listings/[id]/route.ts
  - src/proxy.ts
  - src/app/admin/users/page.tsx
  - src/app/api/listings/route.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/components/Stepper.tsx
  - src/app/api/admin/audit-logs/route.ts
  - src/lib/db/list-recent-helper.ts
  - src/lib/pdf-generator/dossier.ts
  - src/app/admin/audit-logs/page.tsx
  - src/lib/audit.ts
  - src/app/listings/[id]/fill/page.tsx
  - src/lib/pdf-generator/survey-sales.ts
  - src/app/api/listings/folders/[id]/route.ts
  - src/lib/generators/disclosure-document.ts
  - src/app/listings/[id]/supplement/page.tsx
  - src/lib/auth.ts
  - src/lib/db/index.ts
  - src/app/api/auth/login/route.ts
  - src/components/SearchBar.tsx
  - src/app/api/admin/transfer-cases/route.ts
  - src/lib/generators/property-sheet.ts
  - src/app/api/listings/[id]/folder/route.ts
  - src/app/api/listings/folders/route.ts
  - src/app/api/admin/users/[id]/disable/route.ts
  - src/app/api/admin/users/route.ts
  - src/app/api/auth/logout/route.ts
tests:
  - e2e/user-management.spec.ts
  - src/components/__tests__/Stepper.test.tsx
  - e2e/listing-ux.spec.ts
-->

---
### Requirement: Supplementary form removed from listing creation flow

The system SHALL NOT include supplementary data fields or navigation within the listing creation/edit form.

#### Scenario: Listing creation form tabs

- **WHEN** user opens the listing creation or edit form
- **THEN** no "補件資料" tab SHALL be present
- **THEN** no "前去補件" button SHALL be present

<!-- @trace
source: supplementary-independence
updated: 2026-05-04
code:
  - src/lib/listings/supplementary-status.ts
  - src/app/listings/page.tsx
  - package.json
  - src/components/listings/SupplementStatusIcon.tsx
  - src/app/api/listings/[id]/restore/route.ts
  - src/app/api/listings/[id]/archive/route.ts
  - src/app/listings/[id]/generating/page.tsx
  - src/app/api/admin/users/[id]/reset-password/route.ts
  - src/app/admin/transfer/page.tsx
  - src/lib/db/schema.ts
  - src/lib/generators/disclaimer.ts
  - src/app/listings/[id]/supplementary/page.tsx
  - src/app/login/page.tsx
  - src/components/FolderSidebar.tsx
  - src/app/api/listings/[id]/route.ts
  - src/proxy.ts
  - src/app/admin/users/page.tsx
  - src/app/api/listings/route.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/components/Stepper.tsx
  - src/app/api/admin/audit-logs/route.ts
  - src/lib/db/list-recent-helper.ts
  - src/lib/pdf-generator/dossier.ts
  - src/app/admin/audit-logs/page.tsx
  - src/lib/audit.ts
  - src/app/listings/[id]/fill/page.tsx
  - src/lib/pdf-generator/survey-sales.ts
  - src/app/api/listings/folders/[id]/route.ts
  - src/lib/generators/disclosure-document.ts
  - src/app/listings/[id]/supplement/page.tsx
  - src/lib/auth.ts
  - src/lib/db/index.ts
  - src/app/api/auth/login/route.ts
  - src/components/SearchBar.tsx
  - src/app/api/admin/transfer-cases/route.ts
  - src/lib/generators/property-sheet.ts
  - src/app/api/listings/[id]/folder/route.ts
  - src/app/api/listings/folders/route.ts
  - src/app/api/admin/users/[id]/disable/route.ts
  - src/app/api/admin/users/route.ts
  - src/app/api/auth/logout/route.ts
tests:
  - e2e/user-management.spec.ts
  - src/components/__tests__/Stepper.test.tsx
  - e2e/listing-ux.spec.ts
-->