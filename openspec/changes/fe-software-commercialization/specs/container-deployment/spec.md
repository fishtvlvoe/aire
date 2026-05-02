## MODIFIED Requirements

### Requirement: Docker runner stage uses CHROMIUM_MODE=local

The runner stage ENV block SHALL include `CHROMIUM_MODE=local` so `chromium-launcher.ts` uses `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` (system Chromium).

**Scenario: Docker PDF generation**
- Given: Application runs in Docker runner with `CHROMIUM_MODE=local`
- When: A PDF generation request is made
- Then: `chromium-launcher.ts` SHALL use system Chromium path and generate PDF successfully
