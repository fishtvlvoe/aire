# first-admin-setup Specification

## Purpose

TBD - created by archiving change 'license-admin-ui-redesign'. Update Purpose after archive.

## Requirements

### Requirement: license-init-handles-vendor-credentials

The license init API handler SHALL check the License Server response for a `vendorCredentials` field. When present, it SHALL call `provisionVendorAccount()` to create or update the vendor account before proceeding with the normal license activation flow.

#### Scenario: license init with vendor credentials

- **WHEN** the License Server responds with `{ valid: true, features: [...], vendorCredentials: { username, passwordHash, displayName } }`
- **THEN** the license init API calls `provisionVendorAccount()` with the vendor credentials, then continues to write the license cache and return success to the client

#### Scenario: license init without vendor credentials

- **WHEN** the License Server responds with `{ valid: true, features: [...] }` without `vendorCredentials`
- **THEN** the license init API proceeds normally without creating any vendor account

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
### Requirement: Admin account seed from environment variables

The system SHALL read `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables at application startup. When both variables are present, the system SHALL upsert a user record in the SQLite users table with `role='admin'`. The password SHALL be hashed with bcryptjs at cost factor 10. If the email already exists in the users table, the system SHALL update the password hash and ensure the role is set to "admin". If either environment variable is missing, the seed function SHALL skip account creation and log a warning to console using `console.warn("ADMIN_EMAIL / ADMIN_PASSWORD 環境變數未設定，未建立管理員帳號")`.

#### Scenario: First startup with environment variables set

- **WHEN** the application starts with `ADMIN_EMAIL=admin@aire.com` and `ADMIN_PASSWORD=securepass`
- **THEN** the system SHALL create a user record: `{ email: "admin@aire.com", password_hash: bcrypt("securepass", 10), role: "admin" }`

##### Example: Seed creates admin record

- **GIVEN** users table is empty
- **GIVEN** `ADMIN_EMAIL=admin@aire.com` and `ADMIN_PASSWORD=MySecret123`
- **WHEN** application starts
- **THEN** users table contains one record: email="admin@aire.com", role="admin", password_hash is bcrypt hash of "MySecret123"

#### Scenario: Subsequent startup updates password

- **WHEN** the application starts with `ADMIN_EMAIL=admin@aire.com` and a different `ADMIN_PASSWORD` than what is stored
- **THEN** the system SHALL update the password hash for the existing admin record

##### Example: Password update on restart

- **GIVEN** users table has email="admin@aire.com" with old password hash
- **GIVEN** `ADMIN_PASSWORD=NewPassword456`
- **WHEN** application restarts
- **THEN** the password_hash for "admin@aire.com" is updated to bcrypt hash of "NewPassword456"

#### Scenario: Missing environment variables

- **WHEN** the application starts without `ADMIN_EMAIL` or without `ADMIN_PASSWORD`
- **THEN** the seed function SHALL skip account creation
- **THEN** the system SHALL log `console.warn("ADMIN_EMAIL / ADMIN_PASSWORD 環境變數未設定，未建立管理員帳號")`
- **THEN** the application SHALL still start normally


<!-- @trace
source: login-page-redesign
updated: 2026-05-09
code:
  - e2e/playwright.forgot.config.ts
  - .opencode/skills/spectra-apply/SKILL.md
  - .opencode/skills/spectra-ingest/SKILL.md
  - src/app/admin/(dashboard)/layout.tsx
  - src/app/forgot-password/page.tsx
  - src/app/admin/login/page.tsx
  - src/app/api/setup/create-first-admin/route.ts
  - .opencode/skills/spectra-discuss/SKILL.md
  - src/app/api/auth/reset-password/route.ts
  - src/lib/auth/credentials-login.ts
  - src/app/setup/admin/page.tsx
  - src/app/api/auth/forgot-password/route.ts
  - src/lib/auth/password-reset-token.ts
  - src/instrumentation.ts
  - .github/skills/spectra-propose/SKILL.md
  - src/app/layout.tsx
  - src/app/admin/(dashboard)/transfer/page.tsx
  - .github/prompts/spectra-drift.prompt.md
  - .github/skills/spectra-apply/SKILL.md
  - src/app/globals.css
  - .env.example
  - .opencode/commands/spectra-ingest.md
  - src/app/admin/audit-logs/page.tsx
  - src/middleware.ts
  - src/app/admin/(dashboard)/users/page.tsx
  - src/app/setup/page.tsx
  - src/app/admin/(dashboard)/features/page.tsx
  - .github/skills/spectra-discuss/SKILL.md
  - src/app/api/admin/login/route.ts
  - .github/prompts/spectra-discuss.prompt.md
  - .github/prompts/spectra-apply.prompt.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/skills/spectra-propose/SKILL.md
  - .opencode/commands/spectra-discuss.md
  - .opencode/skills/spectra-drift/SKILL.md
  - .github/skills/spectra-ingest/SKILL.md
  - src/lib/email.ts
  - src/app/admin/features/page.tsx
  - src/app/admin/users/page.tsx
  - src/app/admin/(dashboard)/audit-logs/page.tsx
  - src/app/admin/licenses/page.tsx
  - src/app/admin/transfer/page.tsx
  - .github/skills/spectra-drift/SKILL.md
  - src/app/admin/(dashboard)/licenses/page.tsx
  - src/app/admin/templates/page.tsx
  - src/app/login/page.tsx
  - src/lib/seed-admin.ts
  - .github/prompts/spectra-propose.prompt.md
  - .opencode/commands/spectra-apply.md
  - src/app/admin/layout.tsx
  - .opencode/commands/spectra-propose.md
  - .opencode/commands/spectra-drift.md
  - src/app/api/auth/[...nextauth]/route.ts
  - src/app/api/auth/login/route.ts
  - src/app/admin/(dashboard)/templates/page.tsx
  - src/app/reset-password/page.tsx
  - src/lib/license/serial-key.ts
  - src/lib/db/schema.ts
tests:
  - src/app/api/auth/login/route.test.ts
  - src/lib/auth/__tests__/vendor.test.ts
  - src/app/api/auth/forgot-password/route.test.ts
  - src/app/reset-password/page.test.tsx
  - src/app/api/auth/reset-password/route.test.ts
  - src/app/api/auth/[...nextauth]/route.test.ts
  - src/lib/email.test.ts
  - src/app/forgot-password/page.test.tsx
  - src/app/api/admin/login/route.test.ts
  - src/middleware.test.ts
  - src/lib/license/serial-key.test.ts
  - src/lib/seed-admin.test.ts
  - src/lib/auth/password-reset-token.test.ts
  - e2e/forgot-password-flow.spec.ts
  - src/app/login/page.test.ts
-->

---
### Requirement: Seed function execution point

The admin seed function SHALL be called during Next.js application initialization via `instrumentation.ts` (Next.js Instrumentation API). The function SHALL be idempotent — safe to call on every application start.

#### Scenario: Seed runs on every startup

- **WHEN** the application starts
- **THEN** the seed function runs exactly once during initialization
- **THEN** no duplicate records are created if the admin already exists

##### Example: Idempotent seed on restart

- **GIVEN** users table already has email="admin@aire.com" with role="admin"
- **GIVEN** `ADMIN_EMAIL=admin@aire.com` and `ADMIN_PASSWORD=SamePass`
- **WHEN** application restarts
- **THEN** users table still has exactly one record for "admin@aire.com" (no duplicate)

<!-- @trace
source: login-page-redesign
updated: 2026-05-09
code:
  - e2e/playwright.forgot.config.ts
  - .opencode/skills/spectra-apply/SKILL.md
  - .opencode/skills/spectra-ingest/SKILL.md
  - src/app/admin/(dashboard)/layout.tsx
  - src/app/forgot-password/page.tsx
  - src/app/admin/login/page.tsx
  - src/app/api/setup/create-first-admin/route.ts
  - .opencode/skills/spectra-discuss/SKILL.md
  - src/app/api/auth/reset-password/route.ts
  - src/lib/auth/credentials-login.ts
  - src/app/setup/admin/page.tsx
  - src/app/api/auth/forgot-password/route.ts
  - src/lib/auth/password-reset-token.ts
  - src/instrumentation.ts
  - .github/skills/spectra-propose/SKILL.md
  - src/app/layout.tsx
  - src/app/admin/(dashboard)/transfer/page.tsx
  - .github/prompts/spectra-drift.prompt.md
  - .github/skills/spectra-apply/SKILL.md
  - src/app/globals.css
  - .env.example
  - .opencode/commands/spectra-ingest.md
  - src/app/admin/audit-logs/page.tsx
  - src/middleware.ts
  - src/app/admin/(dashboard)/users/page.tsx
  - src/app/setup/page.tsx
  - src/app/admin/(dashboard)/features/page.tsx
  - .github/skills/spectra-discuss/SKILL.md
  - src/app/api/admin/login/route.ts
  - .github/prompts/spectra-discuss.prompt.md
  - .github/prompts/spectra-apply.prompt.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/skills/spectra-propose/SKILL.md
  - .opencode/commands/spectra-discuss.md
  - .opencode/skills/spectra-drift/SKILL.md
  - .github/skills/spectra-ingest/SKILL.md
  - src/lib/email.ts
  - src/app/admin/features/page.tsx
  - src/app/admin/users/page.tsx
  - src/app/admin/(dashboard)/audit-logs/page.tsx
  - src/app/admin/licenses/page.tsx
  - src/app/admin/transfer/page.tsx
  - .github/skills/spectra-drift/SKILL.md
  - src/app/admin/(dashboard)/licenses/page.tsx
  - src/app/admin/templates/page.tsx
  - src/app/login/page.tsx
  - src/lib/seed-admin.ts
  - .github/prompts/spectra-propose.prompt.md
  - .opencode/commands/spectra-apply.md
  - src/app/admin/layout.tsx
  - .opencode/commands/spectra-propose.md
  - .opencode/commands/spectra-drift.md
  - src/app/api/auth/[...nextauth]/route.ts
  - src/app/api/auth/login/route.ts
  - src/app/admin/(dashboard)/templates/page.tsx
  - src/app/reset-password/page.tsx
  - src/lib/license/serial-key.ts
  - src/lib/db/schema.ts
tests:
  - src/app/api/auth/login/route.test.ts
  - src/lib/auth/__tests__/vendor.test.ts
  - src/app/api/auth/forgot-password/route.test.ts
  - src/app/reset-password/page.test.tsx
  - src/app/api/auth/reset-password/route.test.ts
  - src/app/api/auth/[...nextauth]/route.test.ts
  - src/lib/email.test.ts
  - src/app/forgot-password/page.test.tsx
  - src/app/api/admin/login/route.test.ts
  - src/middleware.test.ts
  - src/lib/license/serial-key.test.ts
  - src/lib/seed-admin.test.ts
  - src/lib/auth/password-reset-token.test.ts
  - e2e/forgot-password-flow.spec.ts
  - src/app/login/page.test.ts
-->