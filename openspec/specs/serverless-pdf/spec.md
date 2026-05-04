# serverless-pdf Specification

## Purpose

TBD - created by archiving change 'fe-software-commercialization'. Update Purpose after archive.

## Requirements

### Requirement: Dual-mode Chromium launcher

`src/lib/pdf-generator/chromium-launcher.ts` SHALL export `launchBrowser()` returning a Puppeteer Browser instance, switching behavior based on `CHROMIUM_MODE` env var.

**Scenario: Local mode**
- Given: `CHROMIUM_MODE` is `local` or unset
- When: `launchBrowser()` is called
- Then: puppeteer-core SHALL launch using `PUPPETEER_EXECUTABLE_PATH` env var, falling back to `/usr/bin/chromium`

**Scenario: Serverless mode**
- Given: `CHROMIUM_MODE` is `serverless`
- When: `launchBrowser()` is called
- Then: `@sparticuz/chromium` SHALL provide the executable path and recommended args


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
### Requirement: PDF generator migration

`src/lib/pdf-generator/dossier.ts` and `src/lib/pdf-generator/survey-sales.ts` SHALL use `launchBrowser()` instead of `puppeteer.launch()`. The `try/finally browser.close()` pattern SHALL be preserved.

#### Scenario: Dossier PDF generation after migration
- Given: `dossier.ts` has been updated to import `launchBrowser()` from `chromium-launcher.ts`
- When: `generateDossierPDF()` is called
- Then: System SHALL call `launchBrowser()`, generate PDF, and ensure `browser.close()` in `finally` block

#### Scenario: Survey-sales PDF generation after migration
- Given: `survey-sales.ts` has been updated to import `launchBrowser()`
- When: `generateSurveySalesPDF()` is called
- Then: System SHALL call `launchBrowser()`, generate PDF, and ensure `browser.close()` in `finally` block


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
### Requirement: Package replacement

`puppeteer` SHALL be removed from `package.json` dependencies. `puppeteer-core@23.x` and `@sparticuz/chromium@131` SHALL be added with pinned versions (no `^` prefix).

#### Scenario: Dependency list verification
- Given: `npm ci` runs in CI pipeline after package.json update
- When: Installer resolves dependencies
- Then: `puppeteer` SHALL NOT be present in `node_modules`, and `puppeteer-core` + `@sparticuz/chromium` SHALL be installed at exact pinned versions


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