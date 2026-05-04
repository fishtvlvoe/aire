## ADDED Requirements

### Requirement: Build standalone desktop application

The system SHALL be packaged as an Electron desktop application producing installers for Windows (.exe) and macOS (.app/.dmg).

#### Scenario: Windows build output

- **WHEN** the build pipeline runs for Windows platform
- **THEN** an NSIS installer (.exe) SHALL be produced containing bundled Node.js, Next.js standalone, and Chromium

##### Example: Windows artifact

- **GIVEN** version is 1.0.0
- **WHEN** GitHub Actions runs electron-builder for win
- **THEN** output SHALL include `releases/v1.0.0/AI-不動產說明書系統-Setup-1.0.0.exe`

#### Scenario: macOS build output

- **WHEN** the build pipeline runs for macOS platform
- **THEN** a DMG installer SHALL be produced containing the .app bundle

##### Example: macOS artifact

- **GIVEN** version is 1.0.0
- **WHEN** GitHub Actions runs electron-builder for mac
- **THEN** output SHALL include `releases/v1.0.0/AI-不動產說明書系統-1.0.0.dmg`

### Requirement: Next.js standalone integration

The system SHALL use Next.js output: standalone mode to minimize the bundled application size.

#### Scenario: Standalone build size

- **WHEN** the application is built in standalone mode
- **THEN** the total application size SHALL be under 350MB (excluding Chromium)

### Requirement: Desktop shortcut creation

The system SHALL create a desktop shortcut during installation.

#### Scenario: Post-installation shortcut

- **WHEN** installation completes
- **THEN** a desktop shortcut named "AI 不動產說明書系統" with the application icon SHALL be present
