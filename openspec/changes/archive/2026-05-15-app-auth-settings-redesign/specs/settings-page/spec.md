## ADDED Requirements

### Requirement: settings-license-section

The settings page SHALL display a "序號管理" card section with license status display and a serial key input form. When the license is not activated, the section SHALL show an input field and an activate button. When activated, the section SHALL show the masked serial key and a deactivate button.

#### Scenario: license not activated

- **WHEN** the user views the settings page with license status "none"
- **THEN** the section SHALL display a serial key input field with placeholder "AIRE-XXXX-XXXX-XXXX"
- **THEN** the section SHALL display an "啟動授權" button

##### Example: activate license from settings

- **GIVEN** the user is on /settings with license status "none"
- **WHEN** the user enters "AIRE-TEST-VALID-001" and clicks "啟動授權"
- **THEN** safeInvoke("activate_license", { serial_key: "AIRE-TEST-VALID-001" }) is called
- **THEN** on success, the section updates to show activated status with masked key "AIRE-****-****-001"

#### Scenario: license already activated

- **WHEN** the user views the settings page with an active license
- **THEN** the section SHALL display the masked serial key
- **THEN** the section SHALL display a green status indicator with text "已啟動"
- **THEN** the section SHALL display a "解除授權" button

##### Example: deactivate license

- **GIVEN** the user is on /settings with an active license showing "AIRE-****-****-001"
- **WHEN** the user clicks "解除授權"
- **THEN** safeInvoke("deactivate_license") is called
- **THEN** on success, the section reverts to the input form state

#### Scenario: license activation error

- **WHEN** the user enters an invalid serial key and clicks activate
- **THEN** the section SHALL display a red error message corresponding to the error code

##### Example: invalid key error

- **GIVEN** the user is on /settings with license status "none"
- **WHEN** the user enters "invalid-key" and clicks "啟動授權"
- **THEN** safeInvoke throws Error with message "INVALID_KEY"
- **THEN** the section displays error "序號無效，請確認輸入是否正確"

### Requirement: settings-land-api-section

The settings page SHALL display a "地政 API 設定" card section with Client ID and secret input fields, a save button, an external help link, and a YouTube tutorial embed area.

#### Scenario: land api fields display

- **WHEN** the user views the settings page
- **THEN** the land API section SHALL display a Client ID text input
- **THEN** the section SHALL display a secret input with type=password
- **THEN** the section SHALL display a "儲存" button
- **THEN** the section SHALL display a help link labeled "如何申請地政 API？" that opens an external URL
- **THEN** the section SHALL display a YouTube embed area (iframe placeholder)

##### Example: save land api settings

- **GIVEN** the user is on /settings
- **WHEN** the user enters Client ID "test-client-123" and secret "test-secret-456" and clicks "儲存"
- **THEN** safeInvoke("save_app_settings", { landApi: { clientId: "test-client-123", secret: "test-secret-456" } }) is called
- **THEN** on success, a green toast displays "設定已儲存"

#### Scenario: land api fields pre-populated

- **WHEN** the user views the settings page with previously saved API settings
- **THEN** the Client ID input SHALL be pre-filled with the saved value
- **THEN** the secret input SHALL show masked dots (not the actual value)

##### Example: pre-populated fields

- **GIVEN** get_app_settings returns { landApi: { clientId: "existing-client", secret: "existing-secret" } }
- **WHEN** the user navigates to /settings
- **THEN** the Client ID input displays "existing-client"
- **THEN** the secret input displays masked dots

### Requirement: settings-premium-section

The settings page SHALL display a "進階功能" card section showing the premium feature status with a locked indicator and an external link button to OPCOS for subscription.

#### Scenario: premium feature locked

- **WHEN** the user views the settings page with premiumUnlocked = false
- **THEN** the section SHALL display a lock icon
- **THEN** the section SHALL display text "實價登錄 MCP Hub — 月費訂閱"
- **THEN** the section SHALL display a button "前往 OPCOS 開通" that opens an external URL

##### Example: click premium unlock

- **GIVEN** the user is on /settings with premiumUnlocked = false
- **WHEN** the user clicks "前往 OPCOS 開通"
- **THEN** the browser opens the OPCOS subscription URL in a new tab

#### Scenario: premium feature unlocked

- **WHEN** the user views the settings page with premiumUnlocked = true
- **THEN** the section SHALL display a green checkmark icon
- **THEN** the section SHALL display text "實價登錄 MCP Hub — 已開通"
- **THEN** the unlock button SHALL be hidden

##### Example: premium already unlocked

- **GIVEN** get_app_settings returns { premiumUnlocked: true }
- **WHEN** the user navigates to /settings
- **THEN** the section shows green checkmark with "已開通" text
