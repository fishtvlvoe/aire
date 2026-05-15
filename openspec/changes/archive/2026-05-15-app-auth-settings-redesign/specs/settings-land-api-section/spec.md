## ADDED Requirements

### Requirement: Land API credentials input and save

The Settings page SHALL display a LandApiSection card as the second section.

- **WHEN** the user navigates to the Settings page
- **THEN** the system SHALL display:
  - A text input for "Client ID" pre-filled from saved settings
  - A password input for "安全碼" pre-filled and masked
  - A "儲存" button (disabled when either field is empty)
  - A "測試連線" button (disabled when either field is empty)
  - A "申請說明" external link
  - A YouTube tutorial placeholder area with text "教學影片即將上線"

#### Scenario: Save API credentials

- **GIVEN** the user has entered Client ID `"test-client-123"` and Secret `"test-secret-456"`
- **WHEN** the user clicks "儲存"
- **THEN** the system SHALL call `save_land_api_settings({ clientId: "test-client-123", secret: "test-secret-456" })`
- **THEN** a success toast "地政 API 設定已儲存" SHALL be displayed

##### Example: Credentials saved

- **GIVEN** Client ID input is `"test-client-123"` and Secret input is `"test-secret-456"`
- **WHEN** user clicks "儲存"
- **THEN** `save_land_api_settings` returns `{ success: true }`
- **THEN** toast shows "地政 API 設定已儲存"

#### Scenario: Empty credentials disable buttons

- **WHEN** Client ID or Secret is empty
- **THEN** the "測試連線" button SHALL be disabled
- **THEN** the "儲存" button SHALL be disabled

##### Example: One field empty

- **GIVEN** Client ID is `"test-client-123"` and Secret is `""`
- **WHEN** the form renders
- **THEN** "儲存" button has `disabled` attribute
- **THEN** "測試連線" button has `disabled` attribute

### Requirement: Connection test

- **WHEN** saved credentials exist and the user clicks "測試連線"
- **THEN** the system SHALL call `test_land_api_connection()`
- **THEN** a loading spinner SHALL appear on the button during the call

#### Scenario: Connection test success

- **GIVEN** saved credentials exist
- **WHEN** the user clicks "測試連線" and the call succeeds
- **THEN** the system SHALL display green status text "連線成功（延遲 {latency_ms}ms）"

##### Example: Successful test

- **GIVEN** `save_land_api_settings` was called with valid credentials
- **WHEN** user clicks "測試連線"
- **THEN** `test_land_api_connection` returns `{ success: true, latency_ms: 120 }`
- **THEN** status text shows "連線成功（延遲 120ms）"

#### Scenario: Connection test failure

- **GIVEN** saved credentials exist
- **WHEN** the user clicks "測試連線" and the call fails
- **THEN** the system SHALL display red status text "連線失敗，請確認 Client ID 和安全碼"

##### Example: Failed test

- **GIVEN** `test_land_api_connection` returns `{ success: false, latency_ms: 0 }`
- **WHEN** user clicks "測試連線"
- **THEN** status text shows "連線失敗，請確認 Client ID 和安全碼" in red
