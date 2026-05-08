## ADDED Requirements

### Requirement: Single Instance Lock

The Electron main process SHALL enforce single-instance execution. Only one instance of the application SHALL run at any time.

#### Scenario: Second instance launch attempt

- **WHEN** a user opens the app while another instance is already running
- **THEN** the existing instance's main window is focused and brought to front
- **THEN** the new instance exits immediately without creating a window

##### Example: Double-click from Finder while app is running

- **GIVEN** AI 不動產說明書.app is already running with its main window
- **WHEN** the user double-clicks the app icon again
- **THEN** the existing window receives focus
- **THEN** no additional Electron process is created

#### Scenario: First instance launch

- **WHEN** no instance of the app is currently running
- **THEN** the app acquires the single-instance lock and starts normally

##### Example: Cold start from Finder

- **GIVEN** no Electron process for AI 不動產說明書 exists in the system
- **WHEN** the user double-clicks the app icon
- **THEN** requestSingleInstanceLock() returns true
- **THEN** the app proceeds to create the main window

## MODIFIED Requirements

### Requirement: Next.js standalone integration

The electron:build script SHALL verify that .next/standalone/server.js exists after running next build and before invoking electron-builder.

#### Scenario: Build with missing standalone output

- **WHEN** next build does not produce a .next/standalone directory
- **THEN** the build script exits with a non-zero code and logs an error message

##### Example: next build without standalone config

- **GIVEN** next.config.ts does not have output: "standalone"
- **WHEN** npm run electron:build is executed
- **THEN** the script checks for .next/standalone/server.js
- **THEN** the file does not exist, script prints "ERROR: .next/standalone/server.js not found" and exits with code 1

#### Scenario: Successful build packaging

- **WHEN** next build produces .next/standalone/server.js
- **THEN** electron-builder includes the standalone directory in the packaged app resources

##### Example: Normal build flow

- **GIVEN** next.config.ts has output: "standalone"
- **WHEN** npm run electron:build is executed
- **THEN** .next/standalone/server.js exists after next build
- **THEN** electron-builder packages it into app.asar or app.asar.unpacked
