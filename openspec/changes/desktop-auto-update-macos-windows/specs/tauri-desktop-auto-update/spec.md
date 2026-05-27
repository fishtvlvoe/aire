# tauri-desktop-auto-update Specification

## ADDED Requirements

### Requirement: Signed desktop updates are configured

AIRE Desktop SHALL use the Tauri updater path for macOS and Windows stable releases.

#### Scenario: App checks a valid stable update manifest

- **GIVEN** a signed stable update manifest is reachable
- **WHEN** the desktop app checks for updates
- **THEN** it SHALL compare the installed app version with the manifest version
- **AND** it SHALL report an available update only when the manifest version is newer
- **AND** it SHALL verify the update signature before allowing installation

### Requirement: Electron updater is not used

AIRE Desktop SHALL NOT depend on Electron updater packages for the new desktop update lifecycle.

#### Scenario: Legacy Electron updater is present in history

- **GIVEN** historical Electron update files or docs exist in the repository
- **WHEN** the new update implementation is built
- **THEN** it SHALL NOT depend on Electron updater packages
- **AND** it SHALL NOT use Electron updater commands as the release path

### Requirement: Update checks are non-blocking

AIRE Desktop SHALL allow users to continue the case workflow when update checks fail or time out.

#### Scenario: Update endpoint times out

- **GIVEN** the update endpoint does not respond before the configured timeout
- **WHEN** the user opens the desktop app
- **THEN** the app SHALL still allow the user to open the new case screen
- **AND** the update failure SHALL be recorded as an update status and log entry
- **AND** the app SHALL NOT delete local case data

### Requirement: Downloaded updates require user restart

AIRE Desktop SHALL ask the user to restart before applying a downloaded update.

#### Scenario: Update has been downloaded

- **GIVEN** a newer signed update has been downloaded
- **WHEN** the user is editing a case
- **THEN** the app SHALL NOT force close the active workflow
- **AND** it SHALL show a restart action in the update status UI
- **AND** the update SHALL be applied only after the user confirms restart
