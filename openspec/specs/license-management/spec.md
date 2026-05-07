# license-management Specification

## Purpose

TBD - created by archiving change 'fe-software-commercialization'. Update Purpose after archive.

## Requirements

### Requirement: License serial key validation

The system SHALL validate a license serial key using Ed25519 asymmetric signature verification via Next.js Middleware on every HTTP request.

**Scenario: Valid license present**
- Given: A license serial key has been activated in the `licenses` SQLite table and current date is before `expires_at` (Asia/Taipei timezone)
- When: Any HTTP request hits Next.js Middleware
- Then: The request proceeds normally

**Scenario: No license activated**
- Given: The `licenses` table is empty
- When: Any HTTP request hits a non-setup path
- Then: Middleware SHALL redirect to `/setup/license` with HTTP 301

**Scenario: Expired license**
- Given: A license key exists but `expires_at` is past current date (Asia/Taipei)
- When: Any HTTP request hits Middleware
- Then: Middleware SHALL redirect to `/setup/license` with HTTP 301

**Scenario: Tampered serial key**
- Given: A serial key string has been modified after issuance
- When: `/api/setup/activate` attempts Ed25519 verification
- Then: API SHALL return HTTP 400 with error code `INVALID_SIGNATURE`


<!-- @trace
source: fe-software-commercialization
updated: 2026-05-04
code:
  - three-ai.db
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
  - three-ai.db
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
  - three-ai.db
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

License DB query result SHALL be cached at module level for 60 seconds TTL to avoid per-request SQLite reads.

#### Scenario: Cached license within TTL
- Given: Middleware queried `licenses` table 30 seconds ago and found valid license
- When: A new HTTP request hits Middleware within 60 seconds
- Then: System SHALL use the cached result and skip the SQLite query

#### Scenario: Cache expired
- Given: Middleware license cache was last updated 61 seconds ago
- When: A new HTTP request hits Middleware
- Then: System SHALL re-query the `licenses` table and refresh the cache


<!-- @trace
source: fe-software-commercialization
updated: 2026-05-04
code:
  - three-ai.db
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
  - three-ai.db
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