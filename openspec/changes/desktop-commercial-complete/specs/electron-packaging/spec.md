## MODIFIED Requirements

### Requirement: Build standalone desktop application
The system SHALL produce installable desktop applications via electron-builder: a DMG installer for macOS containing a .app bundle, and an NSIS installer for Windows producing a .exe. The electron-builder configuration in package.json SHALL include publish settings for the generic update provider. The build process SHALL include the electron-updater package in the output.

#### Scenario: macOS build produces DMG
- **WHEN** running electron-builder for macOS target
- **THEN** the build SHALL produce a DMG file containing the .app bundle
- **THEN** the .app SHALL launch successfully and start the Next.js server

##### Example: macOS DMG build
- **GIVEN** electron-builder configured with mac target in package.json
- **WHEN** running `npm run dist:mac`
- **THEN** dist/AI 不動產說明書系統-1.0.0.dmg is created
- **THEN** opening the DMG and launching the .app shows the splash screen then the main UI

#### Scenario: Windows build produces NSIS installer
- **WHEN** running electron-builder for Windows target
- **THEN** the build SHALL produce an NSIS .exe installer
- **THEN** the installer SHALL create a desktop shortcut upon installation

##### Example: Windows NSIS build
- **GIVEN** electron-builder configured with win target in package.json
- **WHEN** running `npm run dist:win`
- **THEN** dist/AI 不動產說明書系統 Setup 1.0.0.exe is created
- **THEN** running the installer creates a desktop shortcut that launches the app
