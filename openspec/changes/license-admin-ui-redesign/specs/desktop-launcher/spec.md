## ADDED Requirements

### Requirement: Launcher checks for Codex CLI before starting Next.js server

The Electron launcher SHALL check for the Codex CLI binary availability before spawning the Next.js standalone server. On macOS the check SHALL use "which codex"; on Windows the check SHALL use "where codex". If the check fails, the launcher SHALL display the Codex CLI installation guide screen instead of loading the main application.

#### Scenario: Codex CLI available on macOS
- **WHEN** the app starts on macOS and "which codex" returns exit code 0
- **THEN** the launcher proceeds to spawn the Next.js server at localhost:3000

#### Scenario: Codex CLI missing on macOS
- **WHEN** the app starts on macOS and "which codex" returns exit code 1
- **THEN** the launcher loads the Codex CLI installation guide HTML instead of splash.html

#### Scenario: Codex CLI available on Windows
- **WHEN** the app starts on Windows and "where codex" returns exit code 0
- **THEN** the launcher proceeds to spawn the Next.js server

#### Scenario: Codex CLI missing on Windows
- **WHEN** the app starts on Windows and "where codex" returns exit code 1
- **THEN** the launcher loads the Codex CLI installation guide HTML
