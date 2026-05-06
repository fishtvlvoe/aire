## MODIFIED Requirements

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

### Requirement: Package replacement
The package.json SHALL remove puppeteer and add puppeteer-core@23.11.1 (pinned, no ^) and @sparticuz/chromium@131.0.0 (pinned, no ^). These versions SHALL be kept in sync per the @sparticuz/chromium compatibility matrix.

#### Scenario: Dependencies after replacement
- **WHEN** inspecting package.json dependencies
- **THEN** puppeteer SHALL NOT be present
- **THEN** puppeteer-core SHALL be at version 23.11.1 (exact)
- **THEN** @sparticuz/chromium SHALL be at version 131.0.0 (exact)
