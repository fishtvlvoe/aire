# license-management Specification

## Purpose

TBD - created by archiving change 'fe-software-commercialization'. Update Purpose after archive.

## Requirements

### Requirement: License serial key validation

The license serial key validation SHALL be performed during the customer login API call instead of in Next.js Middleware. The login API SHALL accept a `licenseKey` field in the request body and validate it using Ed25519 asymmetric signature verification. The middleware SHALL no longer perform license validation on every HTTP request.

#### Scenario: License validated during login

- **WHEN** customer submits login form with `{ email, password, licenseKey }`
- **THEN** the login API SHALL validate the license key signature and expiration before authenticating credentials

##### Example: Login API license validation flow

- **GIVEN** customer submits licenseKey "RE-AI-abc123..." with valid Ed25519 signature and expires "2027-12-31"
- **WHEN** POST `/api/auth/login` processes the request
- **THEN** license validation passes → credential authentication proceeds

#### Scenario: License validation moved out of middleware

- **WHEN** any HTTP request hits Next.js Middleware
- **THEN** the middleware SHALL NOT perform license validation
- **THEN** the middleware SHALL only check JWT token presence for protected routes

##### Example: Middleware no longer checks license

- **GIVEN** user has valid JWT token but no license key was submitted in this session
- **WHEN** GET `/listings` is requested
- **THEN** middleware checks JWT only (valid) → request passes through without any license verification


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
### Requirement: License activation flow

The system SHALL provide `/setup/license` page for entering and activating a serial key. On success, stores serial_key, company_name, expires_at in `licenses` table and redirects to `/login`. If valid license already exists, redirects to homepage.

#### Scenario: First-time activation
- Given: The `licenses` table is empty
- When: User submits a valid serial key on `/setup/license`
- Then: System SHALL verify signature, insert record into `licenses`, and redirect to `/login`

#### Scenario: Already activated
- Given: A valid non-expired license exists in `licenses` table
- When: User visits `/setup/license`
- Then: System SHALL redirect to homepage without showing the form


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
### Requirement: License payload format

Serial key SHALL be a base64url-encoded Ed25519-signed JSON: `{ company: string, expires: ISO8601 string (Asia/Taipei), version: 1 }`.

#### Scenario: Decode valid payload
- Given: A serial key generated by `scripts/generate-license.ts`
- When: System base64url-decodes the payload
- Then: Result SHALL be valid JSON containing `company`, `expires` (ISO8601 Asia/Taipei), and `version: 1`


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
### Requirement: Middleware license cache

This requirement is MODIFIED to remove license checking from middleware. The middleware SHALL no longer call `getCachedLicense()` or redirect to `/setup` based on license status. License validity is verified at login time, not on every request.

#### Scenario: Middleware skips license check

- **WHEN** any HTTP request arrives at the middleware
- **THEN** the middleware SHALL NOT call `getCachedLicense()`
- **THEN** the middleware SHALL NOT redirect to `/setup` based on license status
- **THEN** the middleware SHALL only verify JWT token and redirect to `/login` if missing


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
### Requirement: License generation CLI

`scripts/generate-license.ts` SHALL accept `--company` and `--expires` CLI arguments and print the signed serial key to stdout.

#### Scenario: Generate serial key
- Given: Operator runs `npx tsx scripts/generate-license.ts --company "Foo" --expires "2027-12-31T23:59:59+08:00"`
- When: Script executes with valid Ed25519 private key present
- Then: Script SHALL print one base64url-encoded serial key to stdout and exit 0

#### Scenario: Missing required arguments
- Given: Operator runs script without `--company` or `--expires`
- When: Argument parsing fails
- Then: Script SHALL print usage to stderr and exit 1

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
### Requirement: License verification moved to server-side

The license validation SHALL be performed by the remote server instead of local Ed25519 verification. The local middleware SHALL call the server API and act on the response.

#### Scenario: Middleware calls server for verification

- **WHEN** any HTTP request hits Next.js Middleware
- **THEN** middleware SHALL check cached verification result (valid for current session)
- **THEN** if no cached result, middleware SHALL call POST /api/license/verify on the license server

##### Example: First request in session

- **GIVEN** user opens the app and no cached verification exists
- **WHEN** browser requests GET /listings
- **THEN** middleware SHALL POST to https://license.vercel.app/api/license/verify with body { email: "agent@realty.com", license_key: "LIC-001", client_ip: "192.168.1.50" }
- **THEN** server returns 200 → middleware caches "valid" for the session and allows the request

#### Scenario: Server returns invalid

- **WHEN** server returns non-200 response for license verification
- **THEN** middleware SHALL redirect to a "授權失敗" page showing the error reason


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
### Requirement: License includes IP CIDR field

The license record SHALL include an allowed_cidr field that restricts which IP addresses can use the license.

#### Scenario: License with CIDR restriction

- **WHEN** a license is activated with allowed_cidr "192.168.1.0/24"
- **THEN** only requests from IPs within that CIDR range SHALL pass verification

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
### Requirement: 序號激活頁面

系統 SHALL 提供 `/setup/license` 頁面，首次啟動且無有效授權時自動重導至此頁。

#### Scenario: 首次啟動無授權

- **WHEN** 用戶首次啟動 app 且 SQLite `licenses` 表無有效紀錄
- **THEN** 所有頁面請求被 Middleware 攔截，重導至 `/setup/license`（HTTP 301）

#### Scenario: 激活成功

- **WHEN** 用戶輸入有效序號 + Email，且序號未被其他機器激活
- **THEN** 系統呼叫 License Server activate API → 綁定 machineId → 寫入 SQLite `licenses` 表 → 重導至 `/login`

#### Scenario: 序號已被其他機器使用

- **WHEN** 用戶輸入已在另一台機器激活的序號
- **THEN** 顯示錯誤訊息「此序號已在另一台電腦激活，請聯繫技術支援」

##### Example: 重複激活

- **GIVEN** 序號 `RE-AI-abc123...` 已在 Machine-A 激活
- **WHEN** 用戶在 Machine-B 輸入同一序號
- **THEN** Server 回傳 HTTP 409 + `LICENSE_ALREADY_ACTIVATED`，頁面顯示錯誤


<!-- @trace
source: license-and-auto-update
updated: 2026-05-06
code:
  - src/app/api/auth/[...nextauth]/route.ts
  - Dockerfile
  - migrations/004_auth_license.sql
  - src/app/api/auth/refresh/route.ts
  - src/types/electron.d.ts
  - src/app/listings/page.tsx
  - scripts/generate-license.ts
  - src/lib/auth/db.ts
  - src/lib/scrapers/bank-estimator.ts
  - electron/updater.ts
  - src/lib/scrapers/tax-calculator.ts
  - package.json
  - src/lib/pdf-generator/dossier.ts
  - src/app/login/page.tsx
  - src/components/UpdateChecker.tsx
  - src/proxy.ts
  - src/lib/pdf-generator/chromium-launcher.ts
  - src/middleware.ts
  - src/lib/db/index.ts
  - AGENTS.md
  - .env.example
  - electron/main.ts
  - electron/preload.ts
  - src/lib/pdf-generator/survey-sales.ts
  - scripts/create-admin.ts
tests:
  - src/lib/db/__tests__/auth-license-migration.test.ts
  - src/lib/pdf-generator/__tests__/chromium-launcher.test.ts
  - src/app/login/page.test.ts
  - src/lib/auth/__tests__/db.test.ts
  - src/lib/__tests__/scrapers/bank-estimator.test.ts
  - src/middleware.test.ts
  - src/lib/__tests__/scrapers/tax-calculator.test.ts
  - scripts/create-admin.test.ts
  - src/app/api/auth/[...nextauth]/route.test.ts
  - e2e/desktop-first-install.spec.ts
  - scripts/generate-license.test.ts
  - src/app/api/auth/refresh/route.test.ts
-->

---
### Requirement: Middleware 授權攔截

Next.js Middleware SHALL 在每個 HTTP 請求驗證授權狀態，無效授權則阻擋存取。

#### Scenario: 有效授權請求

- **WHEN** 請求到達且 SQLite 有未過期的有效序號
- **THEN** 請求正常通過

##### Example: 正常存取物件列表

- **GIVEN** SQLite licenses 表有序號 RE-AI-abc123，expires 為 2027-12-31，machineId 匹配當前主機
- **WHEN** 用戶瀏覽 /listings 頁面
- **THEN** Middleware 查快取（或查 SQLite）→ 授權有效 → 請求正常通過，頁面載入物件列表

#### Scenario: 授權過期

- **WHEN** 請求到達且序號的 `expires` 日期已過
- **THEN** 重導至 `/setup/license` 並顯示「授權已過期，請聯繫技術支援續約」

#### Scenario: 授權快取

- **WHEN** 連續多個請求在 60 秒內到達
- **THEN** 僅第一次查詢 SQLite，後續用記憶體快取結果（TTL 60 秒）


<!-- @trace
source: license-and-auto-update
updated: 2026-05-06
code:
  - src/app/api/auth/[...nextauth]/route.ts
  - Dockerfile
  - migrations/004_auth_license.sql
  - src/app/api/auth/refresh/route.ts
  - src/types/electron.d.ts
  - src/app/listings/page.tsx
  - scripts/generate-license.ts
  - src/lib/auth/db.ts
  - src/lib/scrapers/bank-estimator.ts
  - electron/updater.ts
  - src/lib/scrapers/tax-calculator.ts
  - package.json
  - src/lib/pdf-generator/dossier.ts
  - src/app/login/page.tsx
  - src/components/UpdateChecker.tsx
  - src/proxy.ts
  - src/lib/pdf-generator/chromium-launcher.ts
  - src/middleware.ts
  - src/lib/db/index.ts
  - AGENTS.md
  - .env.example
  - electron/main.ts
  - electron/preload.ts
  - src/lib/pdf-generator/survey-sales.ts
  - scripts/create-admin.ts
tests:
  - src/lib/db/__tests__/auth-license-migration.test.ts
  - src/lib/pdf-generator/__tests__/chromium-launcher.test.ts
  - src/app/login/page.test.ts
  - src/lib/auth/__tests__/db.test.ts
  - src/lib/__tests__/scrapers/bank-estimator.test.ts
  - src/middleware.test.ts
  - src/lib/__tests__/scrapers/tax-calculator.test.ts
  - scripts/create-admin.test.ts
  - src/app/api/auth/[...nextauth]/route.test.ts
  - e2e/desktop-first-install.spec.ts
  - scripts/generate-license.test.ts
  - src/app/api/auth/refresh/route.test.ts
-->

---
### Requirement: Ed25519 序號驗證

序號 SHALL 使用 Ed25519 非對稱簽名，公鑰內嵌在 app 中驗證。

#### Scenario: 簽名驗證通過

- **WHEN** 序號的 Base64url payload 與 signature 經公鑰驗證一致
- **THEN** 解析 payload 中的 company、email、expires、machineId 欄位

#### Scenario: 簽名被竄改

- **WHEN** 序號的 payload 或 signature 被修改
- **THEN** 驗證失敗，回傳 `INVALID_SIGNATURE` 錯誤


<!-- @trace
source: license-and-auto-update
updated: 2026-05-06
code:
  - src/app/api/auth/[...nextauth]/route.ts
  - Dockerfile
  - migrations/004_auth_license.sql
  - src/app/api/auth/refresh/route.ts
  - src/types/electron.d.ts
  - src/app/listings/page.tsx
  - scripts/generate-license.ts
  - src/lib/auth/db.ts
  - src/lib/scrapers/bank-estimator.ts
  - electron/updater.ts
  - src/lib/scrapers/tax-calculator.ts
  - package.json
  - src/lib/pdf-generator/dossier.ts
  - src/app/login/page.tsx
  - src/components/UpdateChecker.tsx
  - src/proxy.ts
  - src/lib/pdf-generator/chromium-launcher.ts
  - src/middleware.ts
  - src/lib/db/index.ts
  - AGENTS.md
  - .env.example
  - electron/main.ts
  - electron/preload.ts
  - src/lib/pdf-generator/survey-sales.ts
  - scripts/create-admin.ts
tests:
  - src/lib/db/__tests__/auth-license-migration.test.ts
  - src/lib/pdf-generator/__tests__/chromium-launcher.test.ts
  - src/app/login/page.test.ts
  - src/lib/auth/__tests__/db.test.ts
  - src/lib/__tests__/scrapers/bank-estimator.test.ts
  - src/middleware.test.ts
  - src/lib/__tests__/scrapers/tax-calculator.test.ts
  - scripts/create-admin.test.ts
  - src/app/api/auth/[...nextauth]/route.test.ts
  - e2e/desktop-first-install.spec.ts
  - scripts/generate-license.test.ts
  - src/app/api/auth/refresh/route.test.ts
-->

---
### Requirement: Machine Fingerprint 綁定

系統 SHALL 生成唯一的主機指紋，用於綁定序號至特定電腦。

#### Scenario: macOS 指紋生成

- **WHEN** app 在 macOS 上執行
- **THEN** 讀取 `IOPlatformUUID`（透過 `ioreg` 命令），計算 SHA-256 取前 16 字元作為 machineId

#### Scenario: Windows 指紋生成

- **WHEN** app 在 Windows 上執行
- **THEN** 讀取 Registry `HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid`，計算 SHA-256 取前 16 字元作為 machineId

<!-- @trace
source: license-and-auto-update
updated: 2026-05-06
code:
  - src/app/api/auth/[...nextauth]/route.ts
  - Dockerfile
  - migrations/004_auth_license.sql
  - src/app/api/auth/refresh/route.ts
  - src/types/electron.d.ts
  - src/app/listings/page.tsx
  - scripts/generate-license.ts
  - src/lib/auth/db.ts
  - src/lib/scrapers/bank-estimator.ts
  - electron/updater.ts
  - src/lib/scrapers/tax-calculator.ts
  - package.json
  - src/lib/pdf-generator/dossier.ts
  - src/app/login/page.tsx
  - src/components/UpdateChecker.tsx
  - src/proxy.ts
  - src/lib/pdf-generator/chromium-launcher.ts
  - src/middleware.ts
  - src/lib/db/index.ts
  - AGENTS.md
  - .env.example
  - electron/main.ts
  - electron/preload.ts
  - src/lib/pdf-generator/survey-sales.ts
  - scripts/create-admin.ts
tests:
  - src/lib/db/__tests__/auth-license-migration.test.ts
  - src/lib/pdf-generator/__tests__/chromium-launcher.test.ts
  - src/app/login/page.test.ts
  - src/lib/auth/__tests__/db.test.ts
  - src/lib/__tests__/scrapers/bank-estimator.test.ts
  - src/middleware.test.ts
  - src/lib/__tests__/scrapers/tax-calculator.test.ts
  - scripts/create-admin.test.ts
  - src/app/api/auth/[...nextauth]/route.test.ts
  - e2e/desktop-first-install.spec.ts
  - scripts/generate-license.test.ts
  - src/app/api/auth/refresh/route.test.ts
-->

---
### Requirement: Consultant handoff uses pre-created serials

The system SHALL support on-site delivery workflow where consultant pre-generates serials and hands one serial to the customer during installation.

#### Scenario: On-site activation with handed serial

- **WHEN** consultant provides one pre-created serial and customer enters it in setup flow
- **THEN** setup flow SHALL call `POST /api/license/activate` and continue only on HTTP 200
- **THEN** system SHALL block access when activation response is not successful

##### Example: handoff flow outcome

| Activation API result | Setup result |
| --- | --- |
| `200 {"ok":true}` | continue to next setup step |
| `403 {"reason":"license_inactive"}` | show activation error and stay on setup page |
| `404 {"reason":"license_not_found"}` | show invalid serial error and stay on setup page |


<!-- @trace
source: license-serial-generator-flow
updated: 2026-05-07
code:
  - electron/launcher.ts
  - electron/preload.ts
  - license-server/lib/store.ts
  - .vercelignore
  - src/app/setup/admin/page.tsx
  - scripts/fix-standalone-symlinks.js
  - scripts/materialize-standalone-symlinks.js
  - src/app/api/admin/licenses/revoke/route.ts
  - electron/main.ts
  - scripts/generate-license.ts
  - src/lib/admin-auth.ts
  - license-server/api/license/list.ts
  - license-server/vercel.json
  - src/lib/codex-client/key-store.ts
  - src/app/admin/licenses/page.tsx
  - src/app/api/setup/verify-openai/route.ts
  - license-server/lib/machine-id.ts
  - license-server/api/license/revoke.ts
  - src/app/api/admin/licenses/route.ts
  - license-server/api/license/create.ts
  - electron/codex-guide.html
  - license-server/api/license/transfer.ts
  - src/app/api/setup/create-first-admin/route.ts
  - electron/updater.ts
  - .github/workflows/release.yml
  - license-server/lib/admin-auth.ts
  - license-server/lib/serial.ts
  - src/app/setup/codex/page.tsx
  - src/app/api/admin/licenses/update-info/route.ts
  - src/app/api/admin/licenses/transfer/route.ts
  - scripts/generate-icons.ts
  - license-server/api/license/activate.ts
  - src/lib/db/schema.ts
  - license-server/api/license/update-info.ts
  - license-server/api/features/index.ts
  - electron-builder.json
  - license-server/api/license/verify.ts
  - license-server/api/updates/check.ts
  - src/app/api/admin/licenses/unbind-machine/route.ts
  - src/app/setup/page.tsx
  - src/middleware.ts
  - package.json
  - vercel.json
tests:
  - license-server/api/license/__tests__/update-info.test.ts
  - license-server/api/license/__tests__/transfer.test.ts
  - license-server/lib/__tests__/serial.test.ts
  - src/app/api/setup/verify-openai/route.test.ts
  - license-server/api/license/__tests__/end-to-end-flow.test.ts
  - license-server/api/license/__tests__/create.test.ts
  - e2e/admin-licenses.spec.ts
  - license-server/api/license/__tests__/revoke.test.ts
  - scripts/generate-icons.test.ts
  - license-server/api/license/__tests__/list.test.ts
  - license-server/api/license/__tests__/activate-verify.test.ts
  - src/lib/codex-client/__tests__/key-store.test.ts
-->

---
### Requirement: License generation CLI uses create API

The system SHALL provide a CLI command that requests serial creation from `POST /api/license/create` instead of generating unsigned local placeholders.

#### Scenario: Generate 10 serial keys for delivery batch

- **WHEN** operator runs `tsx scripts/generate-license.ts --count 10 --expires 2026-12-31T15:59:59.000Z --output ./output/license-batch.csv`
- **THEN** CLI SHALL call `POST /api/license/create` with admin token
- **THEN** CLI SHALL output exactly 10 serial keys to the output file

#### Scenario: Reject missing admin token in CLI

- **WHEN** operator runs generation CLI without `LICENSE_ADMIN_TOKEN`
- **THEN** CLI SHALL exit with code `1` and print `LICENSE_ADMIN_TOKEN is required`

<!-- @trace
source: license-serial-generator-flow
updated: 2026-05-07
code:
  - electron/launcher.ts
  - electron/preload.ts
  - license-server/lib/store.ts
  - .vercelignore
  - src/app/setup/admin/page.tsx
  - scripts/fix-standalone-symlinks.js
  - scripts/materialize-standalone-symlinks.js
  - src/app/api/admin/licenses/revoke/route.ts
  - electron/main.ts
  - scripts/generate-license.ts
  - src/lib/admin-auth.ts
  - license-server/api/license/list.ts
  - license-server/vercel.json
  - src/lib/codex-client/key-store.ts
  - src/app/admin/licenses/page.tsx
  - src/app/api/setup/verify-openai/route.ts
  - license-server/lib/machine-id.ts
  - license-server/api/license/revoke.ts
  - src/app/api/admin/licenses/route.ts
  - license-server/api/license/create.ts
  - electron/codex-guide.html
  - license-server/api/license/transfer.ts
  - src/app/api/setup/create-first-admin/route.ts
  - electron/updater.ts
  - .github/workflows/release.yml
  - license-server/lib/admin-auth.ts
  - license-server/lib/serial.ts
  - src/app/setup/codex/page.tsx
  - src/app/api/admin/licenses/update-info/route.ts
  - src/app/api/admin/licenses/transfer/route.ts
  - scripts/generate-icons.ts
  - license-server/api/license/activate.ts
  - src/lib/db/schema.ts
  - license-server/api/license/update-info.ts
  - license-server/api/features/index.ts
  - electron-builder.json
  - license-server/api/license/verify.ts
  - license-server/api/updates/check.ts
  - src/app/api/admin/licenses/unbind-machine/route.ts
  - src/app/setup/page.tsx
  - src/middleware.ts
  - package.json
  - vercel.json
tests:
  - license-server/api/license/__tests__/update-info.test.ts
  - license-server/api/license/__tests__/transfer.test.ts
  - license-server/lib/__tests__/serial.test.ts
  - src/app/api/setup/verify-openai/route.test.ts
  - license-server/api/license/__tests__/end-to-end-flow.test.ts
  - license-server/api/license/__tests__/create.test.ts
  - e2e/admin-licenses.spec.ts
  - license-server/api/license/__tests__/revoke.test.ts
  - scripts/generate-icons.test.ts
  - license-server/api/license/__tests__/list.test.ts
  - license-server/api/license/__tests__/activate-verify.test.ts
  - src/lib/codex-client/__tests__/key-store.test.ts
-->

---
### Requirement: License activation includes machine ID binding

The POST /api/license/activate endpoint SHALL accept an additional machineId field in the request body. The machineId SHALL be hashed with SHA-256 and stored in the license record. Activation SHALL only succeed for licenses with status "issued" or licenses with status "activated" but null machineId (re-activation after unbind).

#### Scenario: First activation with machine ID
- **WHEN** client sends POST /api/license/activate with { key: "ABCD-1234", email: "user@test.com", machineId: "uuid-string" }
- **THEN** the license status changes to "activated" with machineId set to SHA-256("uuid-string")

#### Scenario: Activation of already-bound license
- **WHEN** license already has a non-null machineId and a different machineId is sent
- **THEN** the system returns 403 { error: "此序號已綁定其他電腦" }

#### Scenario: Re-activation after unbind
- **WHEN** license has status "activated" and machineId is null
- **THEN** activation succeeds and stores the new machineId


<!-- @trace
source: license-admin-ui-redesign
updated: 2026-05-07
code:
  - license-server/api/license/transfer.ts
  - scripts/fix-standalone-symlinks.js
  - license-server/api/license/verify.ts
  - scripts/generate-icons.ts
  - src/lib/codex-client/key-store.ts
  - electron/updater.ts
  - .github/workflows/release.yml
  - license-server/api/updates/check.ts
  - vercel.json
  - src/app/api/admin/licenses/route.ts
  - scripts/materialize-standalone-symlinks.js
  - src/app/api/admin/licenses/transfer/route.ts
  - src/app/api/admin/licenses/unbind-machine/route.ts
  - license-server/lib/store.ts
  - src/app/api/setup/create-first-admin/route.ts
  - src/app/setup/admin/page.tsx
  - src/app/setup/page.tsx
  - src/app/api/admin/licenses/revoke/route.ts
  - electron-builder.json
  - electron/preload.ts
  - src/app/api/setup/verify-openai/route.ts
  - license-server/vercel.json
  - license-server/lib/machine-id.ts
  - license-server/api/license/update-info.ts
  - electron/main.ts
  - license-server/api/features/index.ts
  - scripts/generate-license.ts
  - license-server/api/license/activate.ts
  - .vercelignore
  - src/app/admin/licenses/page.tsx
  - license-server/lib/serial.ts
  - src/middleware.ts
  - license-server/api/license/create.ts
  - src/lib/admin-auth.ts
  - electron/codex-guide.html
  - src/lib/db/schema.ts
  - src/app/api/admin/licenses/update-info/route.ts
  - license-server/lib/admin-auth.ts
  - electron/launcher.ts
  - license-server/api/license/revoke.ts
  - src/app/setup/codex/page.tsx
  - package.json
  - license-server/api/license/list.ts
tests:
  - license-server/api/license/__tests__/update-info.test.ts
  - license-server/api/license/__tests__/revoke.test.ts
  - license-server/api/license/__tests__/list.test.ts
  - scripts/generate-icons.test.ts
  - license-server/lib/__tests__/serial.test.ts
  - license-server/api/license/__tests__/end-to-end-flow.test.ts
  - license-server/api/license/__tests__/transfer.test.ts
  - src/app/api/setup/verify-openai/route.test.ts
  - license-server/api/license/__tests__/create.test.ts
  - license-server/api/license/__tests__/activate-verify.test.ts
  - src/lib/codex-client/__tests__/key-store.test.ts
  - e2e/admin-licenses.spec.ts
-->

---
### Requirement: License verification validates machine ID

The GET /api/license/verify endpoint SHALL accept a machineId query parameter. When the license has a stored machineId, the system SHALL compare it against the SHA-256 hash of the provided machineId. Mismatch SHALL return 403.

#### Scenario: Verification with matching machine
- **WHEN** stored machineId matches hash of provided machineId
- **THEN** verification succeeds (200)

#### Scenario: Verification with mismatched machine
- **WHEN** stored machineId does NOT match hash of provided machineId
- **THEN** the system returns 403 { error: "此序號已綁定其他電腦" }

#### Scenario: Verification for license without machine binding
- **WHEN** license has null machineId (not yet activated or unbound)
- **THEN** verification proceeds without machine check

##### Example: Unbound license passes any machine
- **GIVEN** license ABCD-1234 has machineId = null
- **WHEN** client sends GET /api/license/verify?key=ABCD-1234&machineId=any-machine-uuid
- **THEN** verification returns 200 (machine check skipped)

<!-- @trace
source: license-admin-ui-redesign
updated: 2026-05-07
code:
  - license-server/api/license/transfer.ts
  - scripts/fix-standalone-symlinks.js
  - license-server/api/license/verify.ts
  - scripts/generate-icons.ts
  - src/lib/codex-client/key-store.ts
  - electron/updater.ts
  - .github/workflows/release.yml
  - license-server/api/updates/check.ts
  - vercel.json
  - src/app/api/admin/licenses/route.ts
  - scripts/materialize-standalone-symlinks.js
  - src/app/api/admin/licenses/transfer/route.ts
  - src/app/api/admin/licenses/unbind-machine/route.ts
  - license-server/lib/store.ts
  - src/app/api/setup/create-first-admin/route.ts
  - src/app/setup/admin/page.tsx
  - src/app/setup/page.tsx
  - src/app/api/admin/licenses/revoke/route.ts
  - electron-builder.json
  - electron/preload.ts
  - src/app/api/setup/verify-openai/route.ts
  - license-server/vercel.json
  - license-server/lib/machine-id.ts
  - license-server/api/license/update-info.ts
  - electron/main.ts
  - license-server/api/features/index.ts
  - scripts/generate-license.ts
  - license-server/api/license/activate.ts
  - .vercelignore
  - src/app/admin/licenses/page.tsx
  - license-server/lib/serial.ts
  - src/middleware.ts
  - license-server/api/license/create.ts
  - src/lib/admin-auth.ts
  - electron/codex-guide.html
  - src/lib/db/schema.ts
  - src/app/api/admin/licenses/update-info/route.ts
  - license-server/lib/admin-auth.ts
  - electron/launcher.ts
  - license-server/api/license/revoke.ts
  - src/app/setup/codex/page.tsx
  - package.json
  - license-server/api/license/list.ts
tests:
  - license-server/api/license/__tests__/update-info.test.ts
  - license-server/api/license/__tests__/revoke.test.ts
  - license-server/api/license/__tests__/list.test.ts
  - scripts/generate-icons.test.ts
  - license-server/lib/__tests__/serial.test.ts
  - license-server/api/license/__tests__/end-to-end-flow.test.ts
  - license-server/api/license/__tests__/transfer.test.ts
  - src/app/api/setup/verify-openai/route.test.ts
  - license-server/api/license/__tests__/create.test.ts
  - license-server/api/license/__tests__/activate-verify.test.ts
  - src/lib/codex-client/__tests__/key-store.test.ts
  - e2e/admin-licenses.spec.ts
-->

---
### Requirement: Login requires valid license as precondition

License validation SHALL occur within the login API endpoint when the customer submits a license key, not as a middleware precondition. The login API SHALL validate the license key before authenticating credentials.

#### Scenario: Invalid license key at login

- **WHEN** customer submits login with an invalid or expired license key
- **THEN** the login API SHALL return an error message specific to the license issue
- **THEN** the login API SHALL NOT attempt credential authentication

##### Example: Expired license at login

- **GIVEN** license key "RE-AI-expired..." has expires "2024-01-01T00:00:00+08:00"
- **WHEN** customer submits this key with valid credentials on `/login`
- **THEN** login API returns 403 `{ error: "授權序號已過期" }` without checking credentials

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