## ADDED Requirements

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

### Requirement: Package replacement

`puppeteer` SHALL be removed from `package.json` dependencies. `puppeteer-core@23.x` and `@sparticuz/chromium@131` SHALL be added with pinned versions (no `^` prefix).

#### Scenario: Dependency list verification
- Given: `npm ci` runs in CI pipeline after package.json update
- When: Installer resolves dependencies
- Then: `puppeteer` SHALL NOT be present in `node_modules`, and `puppeteer-core` + `@sparticuz/chromium` SHALL be installed at exact pinned versions

### Requirement: Vercel timeout config

When `CHROMIUM_MODE=serverless`, the PDF API route SHALL export `maxDuration = 60` for Vercel extended timeout.

#### Scenario: Serverless PDF request
- Given: Application is deployed to Vercel with `CHROMIUM_MODE=serverless`
- When: A PDF generation request hits `GET /api/listings/[id]/pdf`
- Then: Vercel SHALL allow up to 60 seconds execution time before returning 504
