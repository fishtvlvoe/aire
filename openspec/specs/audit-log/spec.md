# audit-log Specification

## Purpose

TBD - created by archiving change 'user-management'. Update Purpose after archive.

## Requirements

### Requirement: All state-changing operations are logged

The system SHALL write an audit log entry for every state-changing operation, recording who did what, to which target, and when.

#### Scenario: Listing creation logged

- **WHEN** a user creates a new listing
- **THEN** audit_logs SHALL contain an entry with action="create_listing", user_id=current user, target_type="listing", target_id=new listing id

##### Example: Agent creates listing

- **GIVEN** agent "王小明" (user_id=2) is logged in
- **WHEN** 王小明 creates a listing that gets id=45
- **THEN** audit_logs SHALL contain: user_id=2, action="create_listing", target_type="listing", target_id=45, detail="物件名稱: 信義路三段100號"

#### Scenario: Document generation logged

- **WHEN** a user generates a document (disclosure, property-sheet, etc.)
- **THEN** audit_logs SHALL contain an entry with action="generate_document" and the listing id as target

##### Example: Generate disclosure

- **GIVEN** agent "李大華" (user_id=3) is logged in
- **WHEN** 李大華 generates disclosure document for listing id=12
- **THEN** audit_logs SHALL contain: user_id=3, action="generate_document", target_type="listing", target_id=12, detail="disclosure-document"

#### Scenario: Case transfer logged

- **WHEN** admin transfers cases from agent A to agent B
- **THEN** audit_logs SHALL contain an entry with action="transfer_cases" and detail describing the transfer

##### Example: Transfer 8 cases

- **GIVEN** admin transfers from user_id=2 (王小明) to user_id=4 (張三)
- **WHEN** 8 listings are affected
- **THEN** audit_logs SHALL contain: user_id=1 (admin), action="transfer_cases", target_type="user", target_id=2, detail="轉移 8 筆物件給 張三 (user_id=4)"


<!-- @trace
source: user-management
updated: 2026-05-04
code:
  - package.json
  - src/app/admin/audit-logs/page.tsx
  - src/lib/db/schema.ts
  - src/lib/db/index.ts
  - src/app/api/auth/logout/route.ts
  - src/lib/audit.ts
  - src/app/api/admin/users/[id]/reset-password/route.ts
  - src/app/admin/users/page.tsx
  - src/app/api/listings/[id]/route.ts
  - src/app/api/listings/route.ts
  - src/lib/pdf-generator/dossier.ts
  - src/app/api/admin/audit-logs/route.ts
  - src/app/admin/transfer/page.tsx
  - src/app/api/admin/users/route.ts
  - src/app/login/page.tsx
  - src/lib/generators/disclosure-document.ts
  - src/proxy.ts
  - src/lib/db/list-recent-helper.ts
  - src/lib/pdf-generator/survey-sales.ts
  - src/app/api/admin/transfer-cases/route.ts
  - src/app/api/admin/users/[id]/disable/route.ts
  - src/app/api/auth/login/route.ts
  - src/lib/auth.ts
  - src/lib/generators/disclaimer.ts
  - src/lib/generators/property-sheet.ts
tests:
  - e2e/user-management.spec.ts
-->

---
### Requirement: Audit log is append-only

The audit_logs table SHALL NOT support UPDATE or DELETE operations through the application API. Logs are permanent records.

#### Scenario: No delete endpoint

- **WHEN** any user attempts to delete or modify an audit log entry via API
- **THEN** the system SHALL return 405 Method Not Allowed

##### Example: Reject deletion attempt

- **GIVEN** any authenticated user
- **WHEN** user sends DELETE /api/audit-logs/1
- **THEN** response SHALL be 405 with body { "error": "Audit logs cannot be modified" }


<!-- @trace
source: user-management
updated: 2026-05-04
code:
  - package.json
  - src/app/admin/audit-logs/page.tsx
  - src/lib/db/schema.ts
  - src/lib/db/index.ts
  - src/app/api/auth/logout/route.ts
  - src/lib/audit.ts
  - src/app/api/admin/users/[id]/reset-password/route.ts
  - src/app/admin/users/page.tsx
  - src/app/api/listings/[id]/route.ts
  - src/app/api/listings/route.ts
  - src/lib/pdf-generator/dossier.ts
  - src/app/api/admin/audit-logs/route.ts
  - src/app/admin/transfer/page.tsx
  - src/app/api/admin/users/route.ts
  - src/app/login/page.tsx
  - src/lib/generators/disclosure-document.ts
  - src/proxy.ts
  - src/lib/db/list-recent-helper.ts
  - src/lib/pdf-generator/survey-sales.ts
  - src/app/api/admin/transfer-cases/route.ts
  - src/app/api/admin/users/[id]/disable/route.ts
  - src/app/api/auth/login/route.ts
  - src/lib/auth.ts
  - src/lib/generators/disclaimer.ts
  - src/lib/generators/property-sheet.ts
tests:
  - e2e/user-management.spec.ts
-->

---
### Requirement: Admin can view audit logs

The admin user SHALL be able to view all audit log entries, filtered by user, action type, or date range.

#### Scenario: View all logs

- **WHEN** admin navigates to /admin/audit-logs
- **THEN** system SHALL display a paginated list of all audit entries, newest first

##### Example: Filter by user

- **GIVEN** admin is on /admin/audit-logs
- **WHEN** admin selects filter user="王小明"
- **THEN** list SHALL only show entries where user_id matches 王小明's id

<!-- @trace
source: user-management
updated: 2026-05-04
code:
  - package.json
  - src/app/admin/audit-logs/page.tsx
  - src/lib/db/schema.ts
  - src/lib/db/index.ts
  - src/app/api/auth/logout/route.ts
  - src/lib/audit.ts
  - src/app/api/admin/users/[id]/reset-password/route.ts
  - src/app/admin/users/page.tsx
  - src/app/api/listings/[id]/route.ts
  - src/app/api/listings/route.ts
  - src/lib/pdf-generator/dossier.ts
  - src/app/api/admin/audit-logs/route.ts
  - src/app/admin/transfer/page.tsx
  - src/app/api/admin/users/route.ts
  - src/app/login/page.tsx
  - src/lib/generators/disclosure-document.ts
  - src/proxy.ts
  - src/lib/db/list-recent-helper.ts
  - src/lib/pdf-generator/survey-sales.ts
  - src/app/api/admin/transfer-cases/route.ts
  - src/app/api/admin/users/[id]/disable/route.ts
  - src/app/api/auth/login/route.ts
  - src/lib/auth.ts
  - src/lib/generators/disclaimer.ts
  - src/lib/generators/property-sheet.ts
tests:
  - e2e/user-management.spec.ts
-->

---
### Requirement: Real operation log recording
The mock-backend SHALL record operation logs for case CRUD actions (create, update, delete) and PDF export. Each log entry SHALL contain: `id` (auto-generated UUID), `timestamp` (ISO 8601), `action` (string describing the operation type), `detail` (string with operation specifics), and `user_email` (current logged-in user).

#### Scenario: Case creation log
- **WHEN** a new case is created via `create_case`
- **THEN** an operation log entry is recorded with `action='建立案件'` and `detail` containing the case address

#### Scenario: Case deletion log
- **WHEN** a case is deleted via `delete_case`
- **THEN** an operation log entry is recorded with `action='刪除案件'` and `detail` containing the deleted case identifier


<!-- @trace
source: aire-settings-polish
updated: 2026-05-16
code:
  - src/components/ThemeSelector.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/pdf-engine/document.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/lib/pdf-themes/theme-e-warm/index.tsx
  - src/app/(dashboard)/settings/page.tsx
  - src/lib/mock-backend.ts
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/lib/pdf-themes/theme-d-fresh/index.tsx
  - src/components/CaseSupplementDialog.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/lib/land-registry-api.ts
  - src/components/AppSidebar.tsx
  - src/lib/pdf-themes/registry.ts
  - src/components/settings/LandApiSection.tsx
  - src/app/(dashboard)/settings/branding/page.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src/lib/cases-api.ts
  - src/components/OwnerAuthorizationDialog.tsx
  - src/components/SettingsTabs.tsx
  - src/components/ComingSoonCard.tsx
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src/lib/pdf-themes/index.ts
  - src/components/case-wizard/CaseWizard.tsx
  - src/components/CaseListActions.tsx
  - src/app/(dashboard)/cases/page.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/components/case-wizard/CaseWizardStep2.tsx
tests:
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/components/__tests__/AppSidebar.test.tsx
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
  - src/components/__tests__/ComingSoonCard.test.tsx
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/page.test.tsx
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/components/__tests__/ThemeSelector.test.tsx
-->

---
### Requirement: Log list display
The operation log page (`/settings/logs`) SHALL call `list_logs` to retrieve all operation logs and display them in a table sorted by timestamp DESC. Each row SHALL show: timestamp (formatted as `YYYY/MM/DD HH:mm`), action type, detail description. The page SHALL NOT display hardcoded mock data.

#### Scenario: Logs after operations
- **WHEN** user creates a case, then navigates to `/settings/logs`
- **THEN** the log table shows at least one entry with `action='建立案件'` and a recent timestamp

#### Scenario: Empty log state
- **WHEN** no operations have been performed and user views `/settings/logs`
- **THEN** the page displays "尚無操作紀錄"

<!-- @trace
source: aire-settings-polish
updated: 2026-05-16
code:
  - src/components/ThemeSelector.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/pdf-engine/document.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/lib/pdf-themes/theme-e-warm/index.tsx
  - src/app/(dashboard)/settings/page.tsx
  - src/lib/mock-backend.ts
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/lib/pdf-themes/theme-d-fresh/index.tsx
  - src/components/CaseSupplementDialog.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/lib/land-registry-api.ts
  - src/components/AppSidebar.tsx
  - src/lib/pdf-themes/registry.ts
  - src/components/settings/LandApiSection.tsx
  - src/app/(dashboard)/settings/branding/page.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src/lib/cases-api.ts
  - src/components/OwnerAuthorizationDialog.tsx
  - src/components/SettingsTabs.tsx
  - src/components/ComingSoonCard.tsx
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src/lib/pdf-themes/index.ts
  - src/components/case-wizard/CaseWizard.tsx
  - src/components/CaseListActions.tsx
  - src/app/(dashboard)/cases/page.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/components/case-wizard/CaseWizardStep2.tsx
tests:
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/components/__tests__/AppSidebar.test.tsx
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
  - src/components/__tests__/ComingSoonCard.test.tsx
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/page.test.tsx
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/components/__tests__/ThemeSelector.test.tsx
-->