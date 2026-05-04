# listing-search Specification

## Purpose

TBD - created by archiving change 'listing-ux-enhancement'. Update Purpose after archive.

## Requirements

### Requirement: Full-text search

The system SHALL provide full-text search across listing fields using SQLite FTS5.

#### Scenario: Search by keyword

- **WHEN** user enters "信義" in the search bar
- **THEN** all listings whose address, case_name, owner_name, or property_type contain "信義" SHALL be returned

#### Scenario: No results

- **WHEN** user searches for a term that matches no listings
- **THEN** system SHALL display "查無結果" message


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
### Requirement: Search with folder filter

The system SHALL allow combining search with folder selection.

#### Scenario: Search within a folder

- **WHEN** user selects folder "VIP客戶" and enters search term "套房"
- **THEN** only listings in folder "VIP客戶" matching "套房" SHALL be returned


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
### Requirement: Search archived listings opt-in

The system SHALL exclude archived listings from search by default, with an option to include them.

#### Scenario: Default search excludes archived

- **WHEN** user searches without checking "包含封存"
- **THEN** archived listings SHALL NOT appear in search results

#### Scenario: Include archived in search

- **WHEN** user checks "包含封存" and searches
- **THEN** both active and archived listings matching the query SHALL be returned


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
### Requirement: Search API

The system SHALL expose a search API endpoint with filtering parameters.

#### Scenario: API call with parameters

- **WHEN** client calls GET /api/listings?q=信義&folder_id=1&archived=false
- **THEN** system SHALL return listings matching all provided filters

##### Example: Filter combinations

| q | folder_id | archived | Result |
|---|-----------|----------|--------|
| "信義" | null | false | All non-archived listings matching "信義" |
| "信義" | 1 | false | Non-archived listings in folder 1 matching "信義" |
| "" | 1 | false | All non-archived listings in folder 1 |
| "信義" | null | all | All listings (including archived) matching "信義" |

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