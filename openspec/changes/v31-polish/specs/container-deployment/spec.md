## ADDED Requirements

### Requirement: ci-cd-pipeline

- The system SHALL run automated tests and build verification on every push to main and every pull request via GitHub Actions.
- The CI pipeline SHALL use Node.js 22 and SQLite in-memory mode for testing.
- The CI pipeline SHALL fail the workflow if any test fails or the build produces errors.
- The CI pipeline SHALL handle Puppeteer dependencies without downloading Chromium during `npm ci`（using `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` and apt-installed `chromium-browser`）.

#### Scenario: push to main triggers CI

- **WHEN** a developer pushes code to the main branch
- **THEN** GitHub Actions runs npm ci, npm run test, and npm run build
- **THEN** the workflow reports pass/fail status on the commit

#### Scenario: PR check

- **WHEN** a pull request is opened or updated
- **THEN** the CI workflow runs and reports status as a PR check
- **THEN** merge is blocked if the check fails

#### Scenario: test environment uses in-memory SQLite

- **WHEN** the CI workflow runs `npm run test`
- **THEN** the environment variable `DATABASE_PATH` SHALL be set to `:memory:` (matching `vitest.config.ts`)
- **AND** no real database file SHALL be created

#### Scenario: Puppeteer-dependent tests do not download Chromium

- **WHEN** the CI workflow installs dependencies
- **THEN** `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` SHALL be set
- **AND** `chromium-browser` SHALL be installed via apt
- **AND** `PUPPETEER_EXECUTABLE_PATH` SHALL point to `/usr/bin/chromium-browser`
