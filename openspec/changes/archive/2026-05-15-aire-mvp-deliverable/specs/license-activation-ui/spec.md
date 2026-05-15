## ADDED Requirements

### Requirement: activation-page-form

The activation page SHALL display a form with a single text input for the license key and a submit button. All labels and messages SHALL be in Traditional Chinese.

#### Scenario: valid license key submission

- **WHEN** the user enters a valid license key and submits the form
- **THEN** the system SHALL call the activate_license Tauri IPC command with the entered key
- **THEN** on success, the system SHALL redirect the user to /cases

##### Example: successful activation

- **GIVEN** the user is on /activation with an empty license key input
- **WHEN** the user types "AIRE-2026-ABCD-1234" and clicks "啟動授權"
- **THEN** activate_license IPC is called with key "AIRE-2026-ABCD-1234"
- **THEN** IPC returns success, browser navigates to /cases

#### Scenario: invalid license key submission

- **WHEN** the user enters an invalid license key and submits the form
- **THEN** the system SHALL display an error Toast with a Traditional Chinese message corresponding to the error code returned by activate_license

##### Example: expired license key

- **GIVEN** the user is on /activation
- **WHEN** the user types "AIRE-EXPIRED-KEY" and clicks "啟動授權"
- **THEN** activate_license IPC returns error code "LICENSE_EXPIRED"
- **THEN** Toast displays "授權序號已過期，請聯繫客服"

#### Scenario: empty license key submission

- **WHEN** the user submits the form with an empty license key input
- **THEN** the form SHALL display a validation error "請輸入授權序號" and SHALL NOT call the IPC command

### Requirement: license-guard

The dashboard layout SHALL check the license status on mount and redirect unauthorized users to the activation page.

#### Scenario: no valid license on app launch

- **WHEN** the dashboard layout mounts and get_license_status returns status "none" or "expired"
- **THEN** the system SHALL redirect the user to /activation

#### Scenario: valid license on app launch

- **WHEN** the dashboard layout mounts and get_license_status returns status "valid"
- **THEN** the system SHALL render the dashboard content without redirection

#### Scenario: Tauri IPC unavailable (browser environment)

- **WHEN** the page is opened in a regular browser (not inside Tauri window) and Tauri IPC is unavailable
- **THEN** the activation page SHALL display a message "請在 AIRE 桌面 App 中開啟" instead of the license form
