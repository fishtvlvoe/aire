## MODIFIED Requirements

### Requirement: Automatic update check on startup
The system SHALL use the electron-updater package instead of custom HTTP download logic. The electron/updater.ts SHALL be refactored to use autoUpdater API from electron-updater. The update source SHALL use a generic provider pointing to the License Server /api/updates/check endpoint. The system SHALL preserve existing IPC event names (update-status) to maintain frontend compatibility.

#### Scenario: Update available on startup
- **WHEN** the Electron app starts and electron-updater detects a newer version from the update server
- **THEN** the system SHALL emit an update-status IPC event with type "available" and version info
- **THEN** the system SHALL begin downloading the update automatically

#### Scenario: No update available
- **WHEN** electron-updater checks and the current version matches the latest
- **THEN** the system SHALL emit an update-status IPC event with type "up-to-date"

#### Scenario: Download progress
- **WHEN** an update is being downloaded
- **THEN** the system SHALL emit update-status IPC events with type "progress" and percentage

### Requirement: One-click update installation
The system SHALL use electron-updater quitAndInstall() to apply downloaded updates. After download completes and hash verification passes, the system SHALL prompt the user to restart.

#### Scenario: Install after download
- **WHEN** the update download completes successfully
- **THEN** the system SHALL emit an update-status IPC event with type "ready"
- **THEN** upon user confirmation the system SHALL call autoUpdater.quitAndInstall()
