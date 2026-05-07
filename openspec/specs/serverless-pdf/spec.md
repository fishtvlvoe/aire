# serverless-pdf Specification

## Purpose

TBD - created by archiving change 'fe-software-commercialization'. Update Purpose after archive.

## Requirements

### Requirement: Dual-mode Chromium launcher
The src/lib/pdf-generator/chromium-launcher.ts SHALL export a launchBrowser() function. When CHROMIUM_MODE is "local", it SHALL launch puppeteer-core with the system Chromium path (process.env.PUPPETEER_EXECUTABLE_PATH or /usr/bin/chromium). When CHROMIUM_MODE is "serverless", it SHALL use @sparticuz/chromium to obtain the executable path and launch with serverless-optimized args. The function SHALL return a puppeteer Browser instance.

#### Scenario: Local mode launch
- **WHEN** CHROMIUM_MODE is set to "local"
- **THEN** launchBrowser() SHALL launch puppeteer-core with the local Chromium binary
- **THEN** the returned Browser instance SHALL be usable for PDF generation

#### Scenario: Serverless mode launch
- **WHEN** CHROMIUM_MODE is set to "serverless"
- **THEN** launchBrowser() SHALL call @sparticuz/chromium to get the executable path
- **THEN** launchBrowser() SHALL launch puppeteer-core with serverless-optimized arguments (--disable-gpu, --single-process, etc.)


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
### Requirement: PDF generator migration
All existing PDF generation files (dossier.ts, survey-sales.ts) SHALL replace direct puppeteer.launch() calls with launchBrowser() imported from chromium-launcher.ts. The try/finally browser.close() pattern SHALL be preserved.

#### Scenario: Dossier PDF uses chromium-launcher
- **WHEN** dossier.ts generates a PDF
- **THEN** it SHALL call launchBrowser() instead of puppeteer.launch()
- **THEN** it SHALL close the browser in a finally block

##### Example: Dossier PDF generation call
- **GIVEN** CHROMIUM_MODE=local and a listing with id "abc-123"
- **WHEN** dossier.ts generateDossierPDF("abc-123") is called
- **THEN** launchBrowser() is invoked returning a Browser instance
- **THEN** the PDF is generated and browser.close() is called in finally

#### Scenario: Survey-sales PDF uses chromium-launcher
- **WHEN** survey-sales.ts generates a PDF
- **THEN** it SHALL call launchBrowser() instead of puppeteer.launch()
- **THEN** it SHALL close the browser in a finally block

##### Example: Survey-sales PDF generation call
- **GIVEN** CHROMIUM_MODE=serverless and a listing with id "def-456"
- **WHEN** survey-sales.ts generateSurveyPDF("def-456") is called
- **THEN** launchBrowser() uses @sparticuz/chromium path
- **THEN** the PDF is generated and browser.close() is called in finally


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
### Requirement: Package replacement
The package.json SHALL remove puppeteer and add puppeteer-core@23.11.1 (pinned, no ^) and @sparticuz/chromium@131.0.0 (pinned, no ^). These versions SHALL be kept in sync per the @sparticuz/chromium compatibility matrix.

#### Scenario: Dependencies after replacement
- **WHEN** inspecting package.json dependencies
- **THEN** puppeteer SHALL NOT be present
- **THEN** puppeteer-core SHALL be at version 23.11.1 (exact)
- **THEN** @sparticuz/chromium SHALL be at version 131.0.0 (exact)


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
### Requirement: Vercel timeout config

When `CHROMIUM_MODE=serverless`, the PDF API route SHALL export `maxDuration = 60` for Vercel extended timeout.

#### Scenario: Serverless PDF request
- Given: Application is deployed to Vercel with `CHROMIUM_MODE=serverless`
- When: A PDF generation request hits `GET /api/listings/[id]/pdf`
- Then: Vercel SHALL allow up to 60 seconds execution time before returning 504

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