# listing-folders Specification

## Purpose

TBD - created by archiving change 'listing-ux-enhancement'. Update Purpose after archive.

## Requirements

### Requirement: Create folder

The system SHALL allow users to create a named folder for organizing listings into a single-level tree structure.

#### Scenario: Successful folder creation

- **WHEN** user clicks "新增資料夾" and submits name "信義區"
- **THEN** a new folder with name "信義區" SHALL appear in the sidebar

#### Scenario: Duplicate folder name rejected

- **WHEN** user attempts to create a folder with a name that already exists
- **THEN** system SHALL return error "資料夾名稱已存在" and not create the folder


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
### Requirement: Rename folder

The system SHALL allow users to rename an existing folder.

#### Scenario: Successful rename

- **WHEN** user renames folder "舊名稱" to "新名稱"
- **THEN** the folder name SHALL update and all contained listings SHALL remain unchanged


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
### Requirement: Delete folder

The system SHALL allow users to delete a folder without deleting its listings.

#### Scenario: Delete folder containing listings

- **WHEN** user deletes a folder that contains listings
- **THEN** the folder SHALL be removed and all its listings SHALL have folder_id set to NULL (moved to "未分類")


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
### Requirement: Move listing to folder

The system SHALL allow users to assign a listing to exactly one folder (tree-style, not tag-style).

#### Scenario: Move listing into a folder

- **WHEN** user moves a listing to folder "信義區"
- **THEN** the listing SHALL belong to "信義區" only and no longer appear in its previous folder

#### Scenario: Move listing between folders

- **WHEN** user moves a listing from folder "A" to folder "B"
- **THEN** the listing SHALL belong to folder "B" only


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
### Requirement: Filter listings by folder

The system SHALL filter the displayed listings based on the selected folder in the sidebar.

#### Scenario: Select specific folder

- **WHEN** user selects folder "信義區" in the sidebar
- **THEN** only listings with folder_id matching "信義區" SHALL be displayed

#### Scenario: Select "全部"

- **WHEN** user selects "全部"
- **THEN** all non-archived listings SHALL be displayed regardless of folder assignment

#### Scenario: Select "未分類"

- **WHEN** user selects "未分類"
- **THEN** only listings with folder_id = NULL SHALL be displayed

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