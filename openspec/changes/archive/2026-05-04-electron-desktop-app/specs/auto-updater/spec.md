## ADDED Requirements

### Requirement: Automatic update check on startup

The system SHALL automatically check for updates when the application starts.

#### Scenario: New version available

- **WHEN** application starts and server reports a newer version exists
- **THEN** system SHALL display a notification: "發現新版本 v{version}，要更新嗎？" with "立即更新" and "稍後" buttons

#### Scenario: Already on latest version

- **WHEN** application starts and current version matches server's latest
- **THEN** no update notification SHALL be displayed

##### Example: No update needed

- **GIVEN** installed version is 1.2.0 and server latest.json has version "1.2.0"
- **WHEN** application starts and calls GET /api/updates/check
- **THEN** server returns { "latest": "1.2.0", "current_is_latest": true } → no notification shown

### Requirement: Manual update check button

The system SHALL provide a "檢查更新" button in the application interface.

#### Scenario: Manual check finds update

- **WHEN** user clicks "檢查更新" and a new version exists
- **THEN** system SHALL display the update notification with version info

#### Scenario: Manual check no update

- **WHEN** user clicks "檢查更新" and no new version exists
- **THEN** system SHALL display "已是最新版本"

### Requirement: One-click update installation

The system SHALL download and install updates with a single user action.

#### Scenario: Update download and install

- **WHEN** user clicks "立即更新"
- **THEN** system SHALL show download progress, download the update from R2 signed URL, verify file hash, install the update, and restart the application

#### Scenario: Download failure

- **WHEN** download fails due to network error
- **THEN** system SHALL display "更新下載失敗，請檢查網路連線" and allow retry

### Requirement: Update requires valid license

The system SHALL only provide update downloads to clients with valid licenses.

#### Scenario: Invalid license requests update

- **WHEN** client with invalid or expired license requests update check
- **THEN** server SHALL return HTTP 403 and no download URL
