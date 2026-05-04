# listing-archive Specification

## Purpose

TBD - created by archiving change 'listing-ux-enhancement'. Update Purpose after archive.

## Requirements

### Requirement: Archive listing

The system SHALL allow users to archive a completed listing, hiding it from the main list while preserving all data.

#### Scenario: Archive a listing

- **WHEN** user clicks "封存" on a listing
- **THEN** the listing SHALL have archived_at set to current timestamp
- **THEN** the listing SHALL no longer appear in the main listings view

#### Scenario: Archived listing data preservation

- **WHEN** a listing is archived
- **THEN** all listing data (forms, documents, attachments) SHALL remain intact and accessible

##### Example: Data integrity after archive

- **GIVEN** listing #5 has 3 documents and 2 attachments
- **WHEN** listing #5 is archived
- **THEN** listing #5 still has 3 documents and 2 attachments accessible via /listings/5/documents


<!-- @trace
source: listing-ux-enhancement
updated: 2026-05-04
code:
  - src/components/SearchBar.tsx
  - src/app/admin/transfer/page.tsx
  - src/app/listings/page.tsx
  - src/lib/pdf-generator/dossier.ts
  - src/app/api/listings/[id]/folder/route.ts
  - src/lib/generators/property-sheet.ts
  - src/app/admin/users/page.tsx
  - src/app/api/listings/route.ts
  - src/app/login/page.tsx
  - src/lib/generators/disclosure-document.ts
  - src/components/FolderSidebar.tsx
  - src/lib/db/list-recent-helper.ts
  - src/lib/audit.ts
  - src/lib/generators/disclaimer.ts
  - package.json
  - src/lib/pdf-generator/survey-sales.ts
  - src/app/api/admin/users/[id]/disable/route.ts
  - src/app/api/listings/folders/route.ts
  - src/app/api/admin/transfer-cases/route.ts
  - src/app/api/auth/login/route.ts
  - src/app/api/auth/logout/route.ts
  - src/app/api/listings/[id]/archive/route.ts
  - src/app/api/admin/users/[id]/reset-password/route.ts
  - src/app/api/listings/[id]/restore/route.ts
  - src/app/admin/audit-logs/page.tsx
  - src/lib/db/index.ts
  - src/app/api/admin/users/route.ts
  - src/lib/db/schema.ts
  - src/app/api/listings/folders/[id]/route.ts
  - src/proxy.ts
  - src/app/api/listings/[id]/route.ts
  - src/app/api/admin/audit-logs/route.ts
  - src/lib/auth.ts
tests:
  - e2e/user-management.spec.ts
  - e2e/listing-ux.spec.ts
-->

---
### Requirement: Restore archived listing

The system SHALL allow users to restore an archived listing back to the main list.

#### Scenario: Restore from archive

- **WHEN** user clicks "還原" on an archived listing
- **THEN** the listing SHALL have archived_at set to NULL
- **THEN** the listing SHALL reappear in the main listings view in its original folder


<!-- @trace
source: listing-ux-enhancement
updated: 2026-05-04
code:
  - src/components/SearchBar.tsx
  - src/app/admin/transfer/page.tsx
  - src/app/listings/page.tsx
  - src/lib/pdf-generator/dossier.ts
  - src/app/api/listings/[id]/folder/route.ts
  - src/lib/generators/property-sheet.ts
  - src/app/admin/users/page.tsx
  - src/app/api/listings/route.ts
  - src/app/login/page.tsx
  - src/lib/generators/disclosure-document.ts
  - src/components/FolderSidebar.tsx
  - src/lib/db/list-recent-helper.ts
  - src/lib/audit.ts
  - src/lib/generators/disclaimer.ts
  - package.json
  - src/lib/pdf-generator/survey-sales.ts
  - src/app/api/admin/users/[id]/disable/route.ts
  - src/app/api/listings/folders/route.ts
  - src/app/api/admin/transfer-cases/route.ts
  - src/app/api/auth/login/route.ts
  - src/app/api/auth/logout/route.ts
  - src/app/api/listings/[id]/archive/route.ts
  - src/app/api/admin/users/[id]/reset-password/route.ts
  - src/app/api/listings/[id]/restore/route.ts
  - src/app/admin/audit-logs/page.tsx
  - src/lib/db/index.ts
  - src/app/api/admin/users/route.ts
  - src/lib/db/schema.ts
  - src/app/api/listings/folders/[id]/route.ts
  - src/proxy.ts
  - src/app/api/listings/[id]/route.ts
  - src/app/api/admin/audit-logs/route.ts
  - src/lib/auth.ts
tests:
  - e2e/user-management.spec.ts
  - e2e/listing-ux.spec.ts
-->

---
### Requirement: View archived listings

The system SHALL provide a dedicated view for browsing archived listings.

#### Scenario: Access archive view

- **WHEN** user clicks "封存區" in the sidebar
- **THEN** only listings with archived_at IS NOT NULL SHALL be displayed

#### Scenario: Default list excludes archived

- **WHEN** user views the main listings page without selecting "封存區"
- **THEN** archived listings SHALL NOT appear in the results

<!-- @trace
source: listing-ux-enhancement
updated: 2026-05-04
code:
  - src/components/SearchBar.tsx
  - src/app/admin/transfer/page.tsx
  - src/app/listings/page.tsx
  - src/lib/pdf-generator/dossier.ts
  - src/app/api/listings/[id]/folder/route.ts
  - src/lib/generators/property-sheet.ts
  - src/app/admin/users/page.tsx
  - src/app/api/listings/route.ts
  - src/app/login/page.tsx
  - src/lib/generators/disclosure-document.ts
  - src/components/FolderSidebar.tsx
  - src/lib/db/list-recent-helper.ts
  - src/lib/audit.ts
  - src/lib/generators/disclaimer.ts
  - package.json
  - src/lib/pdf-generator/survey-sales.ts
  - src/app/api/admin/users/[id]/disable/route.ts
  - src/app/api/listings/folders/route.ts
  - src/app/api/admin/transfer-cases/route.ts
  - src/app/api/auth/login/route.ts
  - src/app/api/auth/logout/route.ts
  - src/app/api/listings/[id]/archive/route.ts
  - src/app/api/admin/users/[id]/reset-password/route.ts
  - src/app/api/listings/[id]/restore/route.ts
  - src/app/admin/audit-logs/page.tsx
  - src/lib/db/index.ts
  - src/app/api/admin/users/route.ts
  - src/lib/db/schema.ts
  - src/app/api/listings/folders/[id]/route.ts
  - src/proxy.ts
  - src/app/api/listings/[id]/route.ts
  - src/app/api/admin/audit-logs/route.ts
  - src/lib/auth.ts
tests:
  - e2e/user-management.spec.ts
  - e2e/listing-ux.spec.ts
-->