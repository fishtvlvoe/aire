# user-auth Specification

## Purpose

TBD - created by archiving change 'fe-software-commercialization'. Update Purpose after archive.

## Requirements

### Requirement: User login with credentials
The system SHALL use next-auth 4.x Credentials Provider for user authentication. The system SHALL replace the existing custom session management in src/lib/auth.ts with next-auth integration. The Auth.js handler SHALL be located at src/app/api/auth/[...nextauth]/route.ts. The session strategy SHALL be jwt. The login page at src/app/login/page.tsx SHALL call next-auth signIn() instead of the custom /api/auth/login endpoint. The login page SHALL display a "忘記密碼" link below the login button that navigates to /forgot-password.

#### Scenario: Successful login via next-auth
- **WHEN** a user submits valid username and password on /login
- **THEN** the system SHALL authenticate via next-auth Credentials Provider
- **THEN** the system SHALL issue a JWT Access Token (15 minutes TTL) and a Refresh Token (7 days TTL)
- **THEN** the system SHALL redirect to /listings

#### Scenario: Failed login
- **WHEN** a user submits invalid credentials
- **THEN** the system SHALL display an error message on the login page
- **THEN** the system SHALL NOT issue any tokens

##### Example: Wrong password login attempt
- **GIVEN** user "admin" exists with password hash for "correct123"
- **WHEN** user submits username "admin" and password "wrong456" on /login
- **THEN** the login page displays "帳號或密碼錯誤"
- **THEN** no JWT cookie is set in the response

#### Scenario: Forgot password link visible on login page
- **WHEN** user views the /login page
- **THEN** the page SHALL display a "忘記密碼" link
- **THEN** clicking the link SHALL navigate to /forgot-password


<!-- @trace
source: forgot-password
updated: 2026-05-09
code:
  - .github/prompts/spectra-discuss.prompt.md
  - .opencode/skills/spectra-propose/SKILL.md
  - .opencode/commands/spectra-ingest.md
  - src/app/api/auth/forgot-password/route.ts
  - src/lib/email.ts
  - src/app/api/setup/create-first-admin/route.ts
  - src/app/setup/page.tsx
  - src/lib/seed-admin.ts
  - .github/skills/spectra-ingest/SKILL.md
  - src/app/admin/(dashboard)/transfer/page.tsx
  - src/app/admin/(dashboard)/layout.tsx
  - .opencode/skills/spectra-ingest/SKILL.md
  - .github/prompts/spectra-ingest.prompt.md
  - src/lib/db/schema.ts
  - src/app/admin/users/page.tsx
  - .opencode/commands/spectra-discuss.md
  - src/app/admin/(dashboard)/templates/page.tsx
  - src/app/admin/(dashboard)/users/page.tsx
  - src/app/admin/login/page.tsx
  - src/lib/auth/credentials-login.ts
  - e2e/playwright.forgot.config.ts
  - .github/skills/spectra-propose/SKILL.md
  - src/app/api/auth/login/route.ts
  - src/app/forgot-password/page.tsx
  - src/app/layout.tsx
  - src/app/api/auth/[...nextauth]/route.ts
  - src/lib/auth/password-reset-token.ts
  - src/app/api/auth/reset-password/route.ts
  - .opencode/skills/spectra-discuss/SKILL.md
  - .opencode/skills/spectra-apply/SKILL.md
  - src/app/admin/features/page.tsx
  - src/app/admin/transfer/page.tsx
  - .github/prompts/spectra-drift.prompt.md
  - src/app/login/page.tsx
  - src/app/reset-password/page.tsx
  - .github/skills/spectra-drift/SKILL.md
  - .github/prompts/spectra-propose.prompt.md
  - src/app/admin/(dashboard)/audit-logs/page.tsx
  - .opencode/skills/spectra-drift/SKILL.md
  - src/instrumentation.ts
  - .opencode/commands/spectra-drift.md
  - src/app/setup/admin/page.tsx
  - src/app/admin/(dashboard)/licenses/page.tsx
  - .opencode/commands/spectra-apply.md
  - .env.example
  - .opencode/commands/spectra-propose.md
  - src/app/globals.css
  - src/app/api/admin/login/route.ts
  - src/middleware.ts
  - src/app/admin/layout.tsx
  - .github/skills/spectra-discuss/SKILL.md
  - .github/skills/spectra-apply/SKILL.md
  - src/lib/license/serial-key.ts
  - src/app/admin/audit-logs/page.tsx
  - .github/prompts/spectra-apply.prompt.md
  - src/app/admin/(dashboard)/features/page.tsx
  - src/app/admin/licenses/page.tsx
  - src/app/admin/templates/page.tsx
tests:
  - src/app/forgot-password/page.test.tsx
  - src/lib/license/serial-key.test.ts
  - src/app/api/auth/reset-password/route.test.ts
  - e2e/forgot-password-flow.spec.ts
  - src/middleware.test.ts
  - src/app/login/page.test.ts
  - src/app/api/auth/[...nextauth]/route.test.ts
  - src/lib/seed-admin.test.ts
  - src/app/api/auth/login/route.test.ts
  - src/lib/email.test.ts
  - src/app/api/admin/login/route.test.ts
  - src/lib/auth/__tests__/vendor.test.ts
  - src/lib/auth/password-reset-token.test.ts
  - src/app/reset-password/page.test.tsx
  - src/app/api/auth/forgot-password/route.test.ts
-->

---
### Requirement: Dual token mechanism
The system SHALL implement a dual token mechanism: a short-lived JWT Access Token (15 minutes) managed by next-auth, and a long-lived Refresh Token (7 days) stored as a SHA-256 hash in the SQLite refresh_tokens table. The Refresh Token SHALL be delivered as an HttpOnly, Secure, SameSite=Strict cookie. The refresh endpoint SHALL be located at src/app/api/auth/refresh/route.ts.

#### Scenario: Access token expired, refresh token valid
- **WHEN** a request is made with an expired Access Token and a valid Refresh Token cookie
- **THEN** the system SHALL revoke the old Refresh Token in the database
- **THEN** the system SHALL issue a new Access Token and a new Refresh Token
- **THEN** the system SHALL set the new Refresh Token as an HttpOnly cookie

##### Example: Token refresh cycle
- **GIVEN** Access Token issued at 10:00 (expires 10:15) and Refresh Token RT-001 (expires in 7 days)
- **WHEN** a request arrives at 10:20 with expired Access Token and valid RT-001 cookie
- **THEN** POST /api/auth/refresh revokes RT-001 in DB (revoked=1)
- **THEN** a new Access Token (expires 10:35) and new RT-002 are issued
- **THEN** RT-002 is set as HttpOnly Secure SameSite=Strict cookie

#### Scenario: Both tokens expired
- **WHEN** a request is made with an expired Access Token and an expired or revoked Refresh Token
- **THEN** the system SHALL redirect to /login

##### Example: Fully expired session
- **GIVEN** Access Token expired 2 hours ago and Refresh Token RT-001 expired 1 day ago
- **WHEN** a request arrives to /listings
- **THEN** middleware redirects to /login with HTTP 302


<!-- @trace
source: desktop-commercial-complete
updated: 2026-05-07
code:
  - src/app/setup/page.tsx
  - src/lib/scrapers/tax-calculator.ts
  - license-server/api/updates/check.ts
  - license-server/lib/serial.ts
  - src/types/electron.d.ts
  - src/middleware.ts
  - src/lib/codex-client/key-store.ts
  - src/app/api/admin/licenses/transfer/route.ts
  - src/lib/db/index.ts
  - src/app/api/setup/create-first-admin/route.ts
  - src/app/api/setup/verify-openai/route.ts
  - AGENTS.md
  - src/lib/pdf-generator/survey-sales.ts
  - src/lib/pdf-generator/dossier.ts
  - src/lib/auth/db.ts
  - license-server/api/license/transfer.ts
  - Dockerfile
  - license-server/vercel.json
  - scripts/materialize-standalone-symlinks.js
  - license-server/lib/machine-id.ts
  - src/app/api/admin/licenses/route.ts
  - electron/updater.ts
  - electron-builder.json
  - scripts/create-admin.ts
  - src/app/api/admin/licenses/revoke/route.ts
  - .vercelignore
  - src/lib/scrapers/bank-estimator.ts
  - migrations/004_auth_license.sql
  - scripts/generate-icons.ts
  - src/app/api/auth/refresh/route.ts
  - license-server/api/license/revoke.ts
  - package.json
  - src/proxy.ts
  - electron/preload.ts
  - src/lib/db/schema.ts
  - license-server/api/features/index.ts
  - license-server/api/license/create.ts
  - .env.example
  - license-server/api/license/list.ts
  - .github/workflows/release.yml
  - src/app/login/page.tsx
  - src/components/UpdateChecker.tsx
  - src/lib/pdf-generator/chromium-launcher.ts
  - license-server/api/license/activate.ts
  - scripts/fix-standalone-symlinks.js
  - vercel.json
  - src/app/api/admin/licenses/unbind-machine/route.ts
  - electron/launcher.ts
  - scripts/generate-license.ts
  - src/app/setup/codex/page.tsx
  - electron/main.ts
  - license-server/api/license/verify.ts
  - src/app/admin/licenses/page.tsx
  - license-server/lib/store.ts
  - src/app/setup/admin/page.tsx
  - src/lib/admin-auth.ts
  - electron/codex-guide.html
  - src/app/api/auth/[...nextauth]/route.ts
  - license-server/api/license/update-info.ts
  - license-server/lib/admin-auth.ts
  - src/app/api/admin/licenses/update-info/route.ts
  - src/app/listings/page.tsx
tests:
  - src/app/api/auth/[...nextauth]/route.test.ts
  - src/lib/db/__tests__/auth-license-migration.test.ts
  - src/middleware.test.ts
  - license-server/lib/__tests__/serial.test.ts
  - license-server/api/license/__tests__/update-info.test.ts
  - src/app/api/setup/verify-openai/route.test.ts
  - e2e/desktop-first-install.spec.ts
  - scripts/generate-icons.test.ts
  - license-server/api/license/__tests__/activate-verify.test.ts
  - src/lib/pdf-generator/__tests__/chromium-launcher.test.ts
  - src/lib/auth/__tests__/db.test.ts
  - e2e/admin-licenses.spec.ts
  - license-server/api/license/__tests__/revoke.test.ts
  - license-server/api/license/__tests__/create.test.ts
  - src/app/login/page.test.ts
  - src/app/api/auth/refresh/route.test.ts
  - src/lib/__tests__/scrapers/tax-calculator.test.ts
  - src/lib/codex-client/__tests__/key-store.test.ts
  - license-server/api/license/__tests__/end-to-end-flow.test.ts
  - scripts/create-admin.test.ts
  - license-server/api/license/__tests__/list.test.ts
  - license-server/api/license/__tests__/transfer.test.ts
  - src/lib/__tests__/scrapers/bank-estimator.test.ts
  - scripts/generate-license.test.ts
-->

---
### Requirement: Password storage
The system SHALL hash passwords with bcryptjs at cost factor 12. User records SHALL be stored in the SQLite users table with columns: id, username, password_hash, created_at.

#### Scenario: New user creation
- **WHEN** a new user is created via scripts/create-admin.ts
- **THEN** the password SHALL be hashed with bcryptjs cost 12
- **THEN** the record SHALL be inserted into the users table


<!-- @trace
source: desktop-commercial-complete
updated: 2026-05-07
code:
  - src/app/setup/page.tsx
  - src/lib/scrapers/tax-calculator.ts
  - license-server/api/updates/check.ts
  - license-server/lib/serial.ts
  - src/types/electron.d.ts
  - src/middleware.ts
  - src/lib/codex-client/key-store.ts
  - src/app/api/admin/licenses/transfer/route.ts
  - src/lib/db/index.ts
  - src/app/api/setup/create-first-admin/route.ts
  - src/app/api/setup/verify-openai/route.ts
  - AGENTS.md
  - src/lib/pdf-generator/survey-sales.ts
  - src/lib/pdf-generator/dossier.ts
  - src/lib/auth/db.ts
  - license-server/api/license/transfer.ts
  - Dockerfile
  - license-server/vercel.json
  - scripts/materialize-standalone-symlinks.js
  - license-server/lib/machine-id.ts
  - src/app/api/admin/licenses/route.ts
  - electron/updater.ts
  - electron-builder.json
  - scripts/create-admin.ts
  - src/app/api/admin/licenses/revoke/route.ts
  - .vercelignore
  - src/lib/scrapers/bank-estimator.ts
  - migrations/004_auth_license.sql
  - scripts/generate-icons.ts
  - src/app/api/auth/refresh/route.ts
  - license-server/api/license/revoke.ts
  - package.json
  - src/proxy.ts
  - electron/preload.ts
  - src/lib/db/schema.ts
  - license-server/api/features/index.ts
  - license-server/api/license/create.ts
  - .env.example
  - license-server/api/license/list.ts
  - .github/workflows/release.yml
  - src/app/login/page.tsx
  - src/components/UpdateChecker.tsx
  - src/lib/pdf-generator/chromium-launcher.ts
  - license-server/api/license/activate.ts
  - scripts/fix-standalone-symlinks.js
  - vercel.json
  - src/app/api/admin/licenses/unbind-machine/route.ts
  - electron/launcher.ts
  - scripts/generate-license.ts
  - src/app/setup/codex/page.tsx
  - electron/main.ts
  - license-server/api/license/verify.ts
  - src/app/admin/licenses/page.tsx
  - license-server/lib/store.ts
  - src/app/setup/admin/page.tsx
  - src/lib/admin-auth.ts
  - electron/codex-guide.html
  - src/app/api/auth/[...nextauth]/route.ts
  - license-server/api/license/update-info.ts
  - license-server/lib/admin-auth.ts
  - src/app/api/admin/licenses/update-info/route.ts
  - src/app/listings/page.tsx
tests:
  - src/app/api/auth/[...nextauth]/route.test.ts
  - src/lib/db/__tests__/auth-license-migration.test.ts
  - src/middleware.test.ts
  - license-server/lib/__tests__/serial.test.ts
  - license-server/api/license/__tests__/update-info.test.ts
  - src/app/api/setup/verify-openai/route.test.ts
  - e2e/desktop-first-install.spec.ts
  - scripts/generate-icons.test.ts
  - license-server/api/license/__tests__/activate-verify.test.ts
  - src/lib/pdf-generator/__tests__/chromium-launcher.test.ts
  - src/lib/auth/__tests__/db.test.ts
  - e2e/admin-licenses.spec.ts
  - license-server/api/license/__tests__/revoke.test.ts
  - license-server/api/license/__tests__/create.test.ts
  - src/app/login/page.test.ts
  - src/app/api/auth/refresh/route.test.ts
  - src/lib/__tests__/scrapers/tax-calculator.test.ts
  - src/lib/codex-client/__tests__/key-store.test.ts
  - license-server/api/license/__tests__/end-to-end-flow.test.ts
  - scripts/create-admin.test.ts
  - license-server/api/license/__tests__/list.test.ts
  - license-server/api/license/__tests__/transfer.test.ts
  - src/lib/__tests__/scrapers/bank-estimator.test.ts
  - scripts/generate-license.test.ts
-->

---
### Requirement: Admin account creation CLI
The system SHALL provide scripts/create-admin.ts that accepts --username and --password arguments. The script SHALL hash the password with bcryptjs (cost 12) and insert into the users table. If the username already exists, the script SHALL exit with code 1 and print an error message.

#### Scenario: Create admin successfully
- **WHEN** running tsx scripts/create-admin.ts --username admin --password secret123
- **THEN** the script SHALL create a user record with bcrypt-hashed password
- **THEN** the script SHALL print the created username and exit with code 0

#### Scenario: Duplicate username
- **WHEN** running the script with a username that already exists
- **THEN** the script SHALL print "Username already exists" and exit with code 1


<!-- @trace
source: desktop-commercial-complete
updated: 2026-05-07
code:
  - src/app/setup/page.tsx
  - src/lib/scrapers/tax-calculator.ts
  - license-server/api/updates/check.ts
  - license-server/lib/serial.ts
  - src/types/electron.d.ts
  - src/middleware.ts
  - src/lib/codex-client/key-store.ts
  - src/app/api/admin/licenses/transfer/route.ts
  - src/lib/db/index.ts
  - src/app/api/setup/create-first-admin/route.ts
  - src/app/api/setup/verify-openai/route.ts
  - AGENTS.md
  - src/lib/pdf-generator/survey-sales.ts
  - src/lib/pdf-generator/dossier.ts
  - src/lib/auth/db.ts
  - license-server/api/license/transfer.ts
  - Dockerfile
  - license-server/vercel.json
  - scripts/materialize-standalone-symlinks.js
  - license-server/lib/machine-id.ts
  - src/app/api/admin/licenses/route.ts
  - electron/updater.ts
  - electron-builder.json
  - scripts/create-admin.ts
  - src/app/api/admin/licenses/revoke/route.ts
  - .vercelignore
  - src/lib/scrapers/bank-estimator.ts
  - migrations/004_auth_license.sql
  - scripts/generate-icons.ts
  - src/app/api/auth/refresh/route.ts
  - license-server/api/license/revoke.ts
  - package.json
  - src/proxy.ts
  - electron/preload.ts
  - src/lib/db/schema.ts
  - license-server/api/features/index.ts
  - license-server/api/license/create.ts
  - .env.example
  - license-server/api/license/list.ts
  - .github/workflows/release.yml
  - src/app/login/page.tsx
  - src/components/UpdateChecker.tsx
  - src/lib/pdf-generator/chromium-launcher.ts
  - license-server/api/license/activate.ts
  - scripts/fix-standalone-symlinks.js
  - vercel.json
  - src/app/api/admin/licenses/unbind-machine/route.ts
  - electron/launcher.ts
  - scripts/generate-license.ts
  - src/app/setup/codex/page.tsx
  - electron/main.ts
  - license-server/api/license/verify.ts
  - src/app/admin/licenses/page.tsx
  - license-server/lib/store.ts
  - src/app/setup/admin/page.tsx
  - src/lib/admin-auth.ts
  - electron/codex-guide.html
  - src/app/api/auth/[...nextauth]/route.ts
  - license-server/api/license/update-info.ts
  - license-server/lib/admin-auth.ts
  - src/app/api/admin/licenses/update-info/route.ts
  - src/app/listings/page.tsx
tests:
  - src/app/api/auth/[...nextauth]/route.test.ts
  - src/lib/db/__tests__/auth-license-migration.test.ts
  - src/middleware.test.ts
  - license-server/lib/__tests__/serial.test.ts
  - license-server/api/license/__tests__/update-info.test.ts
  - src/app/api/setup/verify-openai/route.test.ts
  - e2e/desktop-first-install.spec.ts
  - scripts/generate-icons.test.ts
  - license-server/api/license/__tests__/activate-verify.test.ts
  - src/lib/pdf-generator/__tests__/chromium-launcher.test.ts
  - src/lib/auth/__tests__/db.test.ts
  - e2e/admin-licenses.spec.ts
  - license-server/api/license/__tests__/revoke.test.ts
  - license-server/api/license/__tests__/create.test.ts
  - src/app/login/page.test.ts
  - src/app/api/auth/refresh/route.test.ts
  - src/lib/__tests__/scrapers/tax-calculator.test.ts
  - src/lib/codex-client/__tests__/key-store.test.ts
  - license-server/api/license/__tests__/end-to-end-flow.test.ts
  - scripts/create-admin.test.ts
  - license-server/api/license/__tests__/list.test.ts
  - license-server/api/license/__tests__/transfer.test.ts
  - src/lib/__tests__/scrapers/bank-estimator.test.ts
  - scripts/generate-license.test.ts
-->

---
### Requirement: Auth middleware order

The system SHALL execute auth checks in `src/middleware.ts` without license checks in the middleware layer. The middleware SHALL only verify JWT Access Token presence for protected routes. License validation SHALL be performed during login API calls, not in middleware.

Auth-exempt paths SHALL include: `/login`, `/admin/login`, `/api/auth/*`, `/api/admin/*`, `/_next/*`, `/favicon.ico`.

#### Scenario: Auth-exempt paths include admin login

- **WHEN** the request path matches `/admin/login` or `/api/admin/login`
- **THEN** the middleware SHALL skip the auth check

#### Scenario: Authenticated request passes without license check

- **WHEN** a request has a valid JWT Access Token
- **THEN** the middleware SHALL allow the request without performing any license validation

##### Example: Authenticated request to listings

- **GIVEN** JWT cookie contains `{ sub: "agent@realty.com", exp: future_timestamp }`
- **WHEN** GET `/listings` is requested
- **THEN** middleware allows the request (no license check performed), listings page renders


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
### Requirement: Route protection scope

Exempt from authentication: `/login`, `/api/auth/*`, `/_next/*`, `/favicon.ico`. All other routes require valid Access Token.

#### Scenario: Access static asset
- Given: User has no Access Token
- When: Request hits `/_next/static/chunk.js`
- Then: Middleware SHALL allow the request without redirect

#### Scenario: Access protected listing page
- Given: User has no Access Token
- When: Request hits `/listings`
- Then: Middleware SHALL redirect to `/login` with HTTP 301

<!-- @trace
source: fe-software-commercialization
updated: 2026-05-04
code:
  - AIRE.db
  - kimi-statusline-issue-body.md
  - package.json
  - src/app/api/listings/[id]/regenerate/route.ts
  - src/lib/external-links/url-builder.ts
  - src/lib/parsers/transcript-parser.ts
  - src/app/api/listings/[id]/generate/route.ts
  - kimi-statusline-feature-request.md
  - src/lib/document-generator/build-input.ts
  - docs/kimi-prompts-wave1-fix-disclosure.md
  - src/lib/document-generator/pdf/dossier-land.ts
  - src/lib/pdf-generator/dossier.ts
  - .env.example
  - src/lib/codex-client/index.ts
  - src/lib/document-generator/tax-calculator.ts
  - src/lib/document-generator/types.ts
  - src/lib/schemas/supplementary-schema.ts
  - src/lib/codex-client/adapters/gemini.ts
  - scripts/e2e-verify-pdf.mjs
  - src/lib/document-generator/pdf/acroform-overlay.ts
  - scripts/verify-disclosure-pdf.ts
  - src/lib/document-generator/pdf/dossier-building.ts
  - src/lib/ocr/field-mapping.ts
  - src/app/api/listings/[id]/pdf/route.ts
  - src/lib/codex-client/types.ts
  - kimi-usage-ux-issue-body.md
  - listings.db
  - src/app/listings/[id]/supplementary/page.tsx
  - src/lib/pdf-generator/templates/dossier.html
tests:
  - src/lib/document-generator/__tests__/build-input.test.ts
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
  - src/lib/codex-client/__tests__/fallback-chain.test.ts
  - src/lib/document-generator/pdf/__tests__/dossier-building.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
  - src/lib/parsers/__tests__/transcript-parser.test.ts
  - src/lib/ocr/__tests__/e2e-autofill.spec.ts
  - src/lib/document-generator/__tests__/acroform-overlay.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
-->

---
### Requirement: Login requires valid license as precondition

The authentication flow SHALL verify license validity before allowing login.

#### Scenario: License invalid at login time

- **WHEN** user attempts to login but the license is invalid or expired
- **THEN** system SHALL display "授權已失效，請聯繫管理員" and block login

#### Scenario: License valid proceeds to auth

- **WHEN** user attempts to login and license verification passes
- **THEN** normal username/password authentication SHALL proceed

##### Example: Valid license login flow

- **GIVEN** license LIC-001 is active and not expired, client IP is within allowed CIDR
- **WHEN** user enters email "agent@realty.com" and password on the login page
- **THEN** system SHALL verify license first (pass) → then authenticate credentials → redirect to /listings

<!-- @trace
source: electron-desktop-app
updated: 2026-05-04
code:
  - license-server/lib/store.ts
  - src/app/admin/users/page.tsx
  - src/app/api/admin/users/[id]/reset-password/route.ts
  - src/app/api/listings/[id]/folder/route.ts
  - electron-builder.json
  - tsconfig.electron.json
  - license-server/package.json
  - src/app/admin/audit-logs/page.tsx
  - src/app/admin/transfer/page.tsx
  - electron/launcher.ts
  - src/app/setup/page.tsx
  - src/app/login/page.tsx
  - tsconfig.json
  - src/lib/codex-client/index.ts
  - src/app/api/auth/login/route.ts
  - src/app/admin/features/page.tsx
  - src/lib/db/schema.ts
  - src/app/api/admin/users/route.ts
  - license-server/api/updates/check.ts
  - src/app/api/listings/[id]/archive/route.ts
  - src/app/api/admin/audit-logs/route.ts
  - electron/splash.html
  - src/app/listings/[id]/supplementary/page.tsx
  - src/components/UpdateChecker.tsx
  - electron/preload.ts
  - src/app/listings/[id]/fill/page.tsx
  - license-server/api/license/activate.ts
  - src/app/api/auth/logout/route.ts
  - src/app/api/listings/[id]/route.ts
  - src/app/listings/page.tsx
  - src/components/Sidebar.tsx
  - src/app/api/admin/features/route.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/lib/auth.ts
  - src/app/api/listings/route.ts
  - license-server/api/license/verify.ts
  - src/components/listings/SupplementStatusIcon.tsx
  - license-server/api/features/index.ts
  - src/lib/db/list-recent-helper.ts
  - src/app/api/listings/folders/[id]/route.ts
  - src/lib/generators/disclosure-document.ts
  - src/types/electron.d.ts
  - scripts/obfuscate-build.js
  - src/app/api/admin/users/[id]/disable/route.ts
  - src/components/FolderSidebar.tsx
  - src/app/listings/[id]/generating/page.tsx
  - src/app/api/license/features/route.ts
  - src/components/Stepper.tsx
  - src/lib/pdf-generator/dossier.ts
  - src/proxy.ts
  - src/lib/audit.ts
  - src/app/api/license/init/route.ts
  - electron/updater.ts
  - src/lib/features/client.ts
  - electron/main.ts
  - .github/workflows/release.yml
  - src/app/api/listings/folders/route.ts
  - license-server/vercel.json
  - src/app/api/listings/[id]/restore/route.ts
  - src/lib/generators/property-sheet.ts
  - src/lib/db/index.ts
  - src/app/api/admin/transfer-cases/route.ts
  - config/branding.json
  - src/lib/generators/disclaimer.ts
  - src/components/SearchBar.tsx
  - package.json
  - src/lib/pdf-generator/survey-sales.ts
  - src/app/listings/[id]/supplement/page.tsx
  - src/app/settings/page.tsx
  - src/lib/listings/supplementary-status.ts
  - src/lib/license/server-verify.ts
  - scripts/upload-release-to-r2.js
tests:
  - e2e/listing-ux.spec.ts
  - e2e/user-management.spec.ts
  - src/components/__tests__/Stepper.test.tsx
-->

---
### Requirement: Login page removes default credential hints

The login page SHALL NOT display any default username, password, or credential hints. The username input field SHALL NOT have a default value of "admin". The text "預設帳號：admin / admin123" SHALL be removed from the page entirely, including in development mode.

#### Scenario: No default credentials displayed

- **WHEN** a user visits `/login` in any environment (development or production)
- **THEN** no default credential hints SHALL be visible
- **THEN** the email input field SHALL be empty

##### Example: Development mode login page

- **GIVEN** application running with `NODE_ENV=development`
- **WHEN** user navigates to `/login`
- **THEN** email field is empty (no "admin" prefill), no "預設帳號：admin / admin123" text visible

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