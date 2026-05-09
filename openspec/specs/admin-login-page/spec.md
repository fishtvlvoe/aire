# admin-login-page Specification

## Purpose

TBD - created by archiving change 'login-page-redesign'. Update Purpose after archive.

## Requirements

### Requirement: Admin login page at /admin/login

The system SHALL provide a dedicated admin login page at `/admin/login`. The page SHALL display a form with two fields: email (required) and password (required). The page title SHALL be "總管理員登入". The page SHALL NOT display any license key input field. The page SHALL NOT display any default credentials or hints.

#### Scenario: Successful admin login

- **WHEN** an admin user submits valid email and password on `/admin/login`
- **THEN** the system SHALL authenticate via NextAuth CredentialsProvider
- **THEN** the system SHALL verify the user has `role='admin'` in the users table
- **THEN** the system SHALL redirect to `/listings`

##### Example: Admin login success

- **GIVEN** user with email "admin@aire.com" and role "admin" exists in users table
- **WHEN** user submits email "admin@aire.com" and correct password on `/admin/login`
- **THEN** system issues JWT + Refresh Token and redirects to `/listings`

#### Scenario: Non-admin user attempts admin login

- **WHEN** a user with role other than "admin" submits credentials on `/admin/login`
- **THEN** the system SHALL return error "無管理員權限"
- **THEN** the system SHALL NOT issue any tokens

##### Example: Agent user rejected from admin login

- **GIVEN** user with email "agent@realty.com" and role "agent" exists in users table
- **WHEN** user submits email "agent@realty.com" and correct password on `/admin/login`
- **THEN** login page displays "無管理員權限"

#### Scenario: Invalid credentials on admin login

- **WHEN** a user submits incorrect email or password on `/admin/login`
- **THEN** the system SHALL return error "帳號或密碼錯誤"


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
### Requirement: Admin login API endpoint

The system SHALL provide `POST /api/admin/login` that accepts `{ email, password }`. The endpoint SHALL verify credentials via bcryptjs and check `role='admin'` in the users table. The endpoint SHALL NOT require a license key. On success, the endpoint SHALL create a NextAuth session and return `{ success: true }`. On failure, the endpoint SHALL return appropriate error codes (401 for wrong credentials, 403 for non-admin role).

#### Scenario: Admin API login success

- **WHEN** POST `/api/admin/login` with valid admin email and password
- **THEN** return 200 `{ success: true }`

#### Scenario: Admin API login wrong password

- **WHEN** POST `/api/admin/login` with valid admin email but wrong password
- **THEN** return 401 `{ error: "帳號或密碼錯誤" }`

#### Scenario: Admin API login non-admin role

- **WHEN** POST `/api/admin/login` with valid credentials but user role is not "admin"
- **THEN** return 403 `{ error: "無管理員權限" }`


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
### Requirement: Admin login link on customer login page

The customer login page at `/login` SHALL display a small text link "總管理員登入" below the login button. The link SHALL navigate to `/admin/login`. The link SHALL be styled as subtle secondary text (small font, muted color), not as a prominent button.

#### Scenario: Admin link visible on customer login page

- **WHEN** a user visits `/login`
- **THEN** below the login button, a small text link "總管理員登入" SHALL be visible
- **THEN** clicking the link SHALL navigate to `/admin/login`

##### Example: Link styling

- **GIVEN** user visits `/login`
- **WHEN** page renders
- **THEN** the "總管理員登入" link appears below the "登入" button in muted gray text (text-sm text-gray-500)

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