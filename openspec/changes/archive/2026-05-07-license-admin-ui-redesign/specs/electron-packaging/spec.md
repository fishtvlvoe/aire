## ADDED Requirements

### Requirement: Electron build produces valid Mac and Windows installers

The electron:pack:mac command SHALL produce a DMG installer for macOS (arm64 + x64). The electron:pack:win command SHALL produce an NSIS installer for Windows (x64). Both installers SHALL include the Next.js standalone build, Codex CLI detection logic, and updated setup wizard (3-step flow).

#### Scenario: Mac DMG build succeeds
- **WHEN** developer runs "npm run electron:pack:mac"
- **THEN** a DMG file is produced in the dist/ directory without errors

#### Scenario: Windows NSIS build succeeds
- **WHEN** developer runs "npm run electron:pack:win"
- **THEN** an NSIS installer (.exe) is produced in the dist/ directory without errors

#### Scenario: Built app launches and shows setup wizard
- **WHEN** user opens the built app for the first time (no license cache)
- **THEN** the app displays the license activation page (/setup) after splash screen

##### Example: First launch flow
- **GIVEN** freshly installed app on macOS with no ~/.AIRE/license-cache.json
- **WHEN** user double-clicks the .app
- **THEN** splash screen appears for 3-5 seconds, then browser window loads /setup with license key input form

#### Scenario: Built app includes Codex CLI detection
- **WHEN** user opens the built app and Codex CLI is not installed
- **THEN** the app displays the Codex CLI installation guide instead of the main application

##### Example: Missing Codex on fresh Windows install
- **GIVEN** freshly installed app on Windows where "where codex" returns exit code 1
- **WHEN** user opens the .exe
- **THEN** instead of splash screen transitioning to /setup, the app shows the Codex CLI installation guide HTML with "npm install -g @openai/codex" command
