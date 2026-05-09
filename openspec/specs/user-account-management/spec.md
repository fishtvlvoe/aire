# user-account-management Specification

## Purpose

TBD - created by archiving change 'user-management'. Update Purpose after archive.

## Requirements

### Requirement: Admin creates agent accounts

The admin user SHALL be able to create new agent accounts with email, display name, and initial password.

#### Scenario: Create agent account

- **WHEN** admin submits the new user form with email "agent01@store.com", name "王小明", and password
- **THEN** system SHALL create a new user with role "agent" and is_active = true

##### Example: Successful creation

- **GIVEN** admin is logged in and on /admin/users
- **WHEN** admin fills email "wang@store.com", name "王小明", password "initial123" and clicks "建立"
- **THEN** users table SHALL contain a new row with email="wang@store.com", role="agent", is_active=1


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
### Requirement: Admin disables agent accounts

The admin user SHALL be able to deactivate an agent account, immediately blocking their access.

#### Scenario: Disable agent

- **WHEN** admin clicks "停用" on an active agent account
- **THEN** the agent's is_active SHALL be set to 0
- **THEN** any active session for that agent SHALL be invalidated immediately

##### Example: Immediate lockout

- **GIVEN** agent "王小明" is currently logged in with an active session
- **WHEN** admin disables "王小明"'s account
- **THEN** 王小明's next request SHALL be redirected to /login with message "帳號已停用，請聯繫管理員"


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
### Requirement: Admin resets agent password

The admin user SHALL be able to reset any agent's password without knowing the current password.

#### Scenario: Reset password

- **WHEN** admin clicks "重設密碼" for an agent and enters new password
- **THEN** the agent's password_hash SHALL be updated
- **THEN** all active sessions for that agent SHALL be invalidated

##### Example: Password reset

- **GIVEN** admin is on /admin/users and agent "王小明" exists
- **WHEN** admin clicks "重設密碼", enters "newpass456", and confirms
- **THEN** 王小明 must use "newpass456" to login next time

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
### Requirement: is-vendor-column

The users table SHALL include an `is_vendor` column (INTEGER NOT NULL DEFAULT 0) to distinguish vendor accounts from regular user accounts.

#### Scenario: schema migration adds is_vendor

- **WHEN** the migration `005_vendor_account.sql` runs
- **THEN** the users table gains an `is_vendor` column with default value 0, and all existing user records have `is_vendor = 0`

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