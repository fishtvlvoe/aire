## MODIFIED Requirements

### Requirement: Docker image builds successfully for linux/amd64
The Dockerfile SHALL remove the puppeteer full installation and replace it with puppeteer-core. The runner stage SHALL set ENV CHROMIUM_MODE=local. The deps and builder stages SHALL maintain PUPPETEER_SKIP_DOWNLOAD=true. The Dockerfile SHALL install system Chromium (chromium or chromium-browser package) in the runner stage for local PDF generation.

#### Scenario: Docker build with puppeteer-core
- **WHEN** running docker build -t jianan-ai:latest .
- **THEN** the build SHALL complete successfully without downloading Chromium during npm install
- **THEN** the container SHALL have system Chromium available at /usr/bin/chromium or /usr/bin/chromium-browser

##### Example: Docker build output
- **GIVEN** Dockerfile has RUN apk add chromium in runner stage and PUPPETEER_SKIP_DOWNLOAD=true in deps stage
- **WHEN** running docker build -t jianan-ai:latest .
- **THEN** build completes in under 5 minutes, image size under 600MB
- **THEN** docker run jianan-ai which chromium returns /usr/bin/chromium

#### Scenario: PDF generation in container
- **WHEN** a PDF generation request is made inside the container
- **THEN** chromium-launcher SHALL detect CHROMIUM_MODE=local
- **THEN** chromium-launcher SHALL use the system Chromium binary
- **THEN** the PDF SHALL be generated successfully

##### Example: Container PDF generation
- **GIVEN** container running with CHROMIUM_MODE=local and a listing with id "test-001"
- **WHEN** POST /api/listings/test-001/pdf is called
- **THEN** chromium-launcher launches /usr/bin/chromium via puppeteer-core
- **THEN** a PDF file is returned with HTTP 200
