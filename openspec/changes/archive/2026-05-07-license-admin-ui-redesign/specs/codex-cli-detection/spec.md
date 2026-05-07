## ADDED Requirements

### Requirement: Electron launcher detects Codex CLI before starting

The Electron launcher SHALL execute a check for the Codex CLI binary (via "which codex" on macOS, "where codex" on Windows) before spawning the Next.js server. The detection result SHALL be communicated to the renderer process via Electron IPC.

#### Scenario: Codex CLI found
- **WHEN** "which codex" returns a valid path (exit code 0)
- **THEN** the launcher proceeds to start the Next.js server normally

#### Scenario: Codex CLI not found
- **WHEN** "which codex" returns exit code 1 (not found)
- **THEN** the launcher displays an installation guide screen instead of the main app

### Requirement: Installation guide screen for missing Codex CLI

When Codex CLI is not detected, the Electron app SHALL display a guide screen with: (1) installation command "npm install -g @openai/codex", (2) instruction to run "codex login" for OAuth authentication, (3) a "重新偵測" (Re-detect) button that re-runs the CLI check, (4) an optional text input for manually specifying the codex binary path.

#### Scenario: Display installation instructions
- **WHEN** Codex CLI is not found
- **THEN** the guide screen shows the npm install command and codex login instruction

##### Example: Guide screen content
- **GIVEN** Codex CLI not found on macOS
- **WHEN** guide screen renders
- **THEN** screen displays: (1) heading "需要安裝 Codex CLI", (2) code block "npm install -g @openai/codex", (3) text "安裝完成後請執行 codex login 進行授權", (4) "重新偵測" button, (5) "手動指定路徑" text input

#### Scenario: Re-detect after installation
- **WHEN** user installs Codex CLI and clicks "重新偵測"
- **THEN** the system re-runs "which codex" and proceeds to start the app if found

#### Scenario: Manual path input
- **WHEN** user enters "/usr/local/bin/codex" in the manual path input and clicks confirm
- **THEN** the system verifies the path exists and is executable, then proceeds to start the app

#### Scenario: Manual path invalid
- **WHEN** user enters an invalid path and clicks confirm
- **THEN** the system displays error "找不到 Codex CLI，請確認路徑正確"
