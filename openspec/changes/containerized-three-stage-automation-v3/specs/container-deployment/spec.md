## ADDED Requirements

### Requirement: Docker image builds successfully for linux/amd64

The system SHALL provide a Dockerfile that builds a production-ready image including Next.js app, Node.js runtime, Puppeteer + Chromium, Codex CLI, Chinese fonts (Noto Sans TC, Noto Serif TC), and all runtime dependencies.

#### Scenario: Build image on developer Mac
- **WHEN** developer runs `docker build -t jianan-ai:latest .`
- **THEN** image builds within 10 minutes without error
- **AND** image size SHALL be under 2GB

#### Scenario: Image runs on Windows Docker Desktop (WSL2)
- **WHEN** customer runs `docker compose up -d` on Windows Docker Desktop with WSL2 backend
- **THEN** container starts successfully within 60 seconds
- **AND** HTTP endpoint http://localhost:3000 responds with 200 status

### Requirement: Codex CLI is installed inside container

The container SHALL include Codex CLI and support customer-account login persistence.

#### Scenario: First-time Codex login
- **WHEN** customer runs first-login.bat on fresh install
- **THEN** container starts in interactive mode and runs `codex login`
- **AND** browser opens for OAuth flow
- **AND** token is saved to `/root/.codex/auth.json` (mounted to host volume)

#### Scenario: Subsequent startups reuse login
- **WHEN** customer restarts the container after first login
- **THEN** codex CLI SHALL work without re-login
- **AND** `codex exec "test"` SHALL return successful response

### Requirement: Data persists on host volume

SQLite database, uploaded files, generated outputs, and Codex auth SHALL all persist across container restart/removal via host volume mounts.

#### Scenario: Container removal preserves data
- **WHEN** customer runs `docker compose down` and then `docker compose up -d`
- **THEN** all previous listings, uploaded files, and generated documents SHALL be accessible
- **AND** Codex login SHALL NOT require re-authentication

#### Scenario: Host volume structure
- **GIVEN** customer's home directory is `%USERPROFILE%\建安AI`
- **THEN** the following directories SHALL exist after first run:
  - `data/db/` — SQLite files
  - `data/uploads/` — uploaded photos, scanned deeds
  - `data/outputs/` — generated PDFs and Markdown files
  - `data/codex/` — Codex OAuth tokens

### Requirement: Windows launcher provides one-click startup

The system SHALL provide Windows batch files for non-technical users.

#### Scenario: start.bat on daily use
- **WHEN** customer double-clicks `start.bat`
- **THEN** script SHALL check Docker Desktop is running (prompt to start if not)
- **AND** run `docker compose up -d`
- **AND** wait for health check to pass
- **AND** open default browser to http://localhost:3000

#### Scenario: first-login.bat on fresh install
- **WHEN** customer double-clicks `first-login.bat` for first time
- **THEN** script SHALL pull image if missing
- **AND** create required data directories under `%USERPROFILE%\建安AI`
- **AND** run `docker compose run --rm app codex login` in interactive mode
- **AND** save confirmation flag to `data/codex/.logged-in`

### Requirement: Container exposes only localhost

For data security, container SHALL bind ports to 127.0.0.1 only, not 0.0.0.0.

#### Scenario: LAN isolation
- **WHEN** another device on the same network attempts to reach `<customer-ip>:3000`
- **THEN** connection SHALL be refused
- **AND** only `localhost:3000` on customer's own machine works

### Requirement: Container health check reports readiness

The container SHALL expose a health check endpoint for launcher scripts to wait on.

#### Scenario: Health endpoint
- **WHEN** `start.bat` polls `http://localhost:3000/api/health`
- **THEN** endpoint SHALL return 200 with `{"status":"ready","codex":true,"db":true}` when all subsystems ready
- **AND** return 503 with component status when any subsystem not ready
