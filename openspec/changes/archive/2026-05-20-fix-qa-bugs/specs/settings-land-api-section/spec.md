## MODIFIED Requirements

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

#### Scenario: Save API credentials shows success toast

- **GIVEN** the user has entered Client ID `"test-client-123"` and Secret `"test-secret-456"`
- **WHEN** the user clicks "儲存"
- **THEN** the system SHALL call `save_land_api_settings({ clientId: "test-client-123", secret: "test-secret-456" })`
- **THEN** a success toast SHALL appear with text containing "儲存成功" or "地政 API 設定已儲存" within 2 seconds

#### Scenario: Empty credentials disable buttons

- **WHEN** Client ID or Secret is empty
- **THEN** the "測試連線" button SHALL be disabled
- **THEN** the "儲存" button SHALL be disabled

##### Example: Credentials saved

- **GIVEN** Client ID input is `"test-client-123"` and Secret input is `"test-secret-456"`
- **WHEN** user clicks "儲存"
- **THEN** `save_land_api_settings` is called
- **THEN** toast appears with text matching /儲存/

##### Example: One field empty

- **GIVEN** Client ID is `"test-client-123"` and Secret is `""`
- **WHEN** the form renders
- **THEN** "儲存" button has `disabled` attribute
- **THEN** "測試連線" button has `disabled` attribute

## ADDED Requirements

### Requirement: Test connection verifies credentials via real HTTP call

The "測試連線" button SHALL trigger an HTTP POST to `/api/land-api/test-connection` with `{ clientId: string, secret: string }`. The endpoint SHALL proxy the request to cop.land.moi.gov.tw authentication API. The system SHALL display a failure toast when credentials are invalid or the connection fails. The system SHALL NOT return a successful result without having made the actual HTTP call.

#### Scenario: Invalid credentials show failure toast

- **WHEN** user enters invalid credentials (e.g., clientId "QA-TEST-CLIENT", secret "QA-TEST-SECRET") and clicks "測試連線"
- **THEN** an HTTP POST to `/api/land-api/test-connection` SHALL be made
- **THEN** the response SHALL contain `{ success: false, error: "認證失敗" }` or similar failure message
- **THEN** a failure toast SHALL appear indicating the connection failed

#### Scenario: Valid credentials show success toast with latency

- **WHEN** user enters valid credentials and clicks "測試連線"
- **THEN** an HTTP POST to `/api/land-api/test-connection` SHALL be made
- **THEN** the response SHALL contain `{ success: true, latency_ms: <number> }`
- **THEN** a success toast SHALL appear showing "連線成功" and the latency in milliseconds

#### Scenario: Network timeout shows timeout toast

- **WHEN** `/api/land-api/test-connection` does not respond within 8 seconds
- **THEN** the system SHALL display a toast "連線逾時，請檢查網路或稍後再試"

##### Example: Fake credentials produce failure

| clientId | secret | Expected toast | Expected toast type |
|----------|--------|----------------|---------------------|
| "QA-TEST-CLIENT" | "QA-TEST-SECRET" | text contains "失敗" or "錯誤" | error |
| "" | "any" | button disabled, no request | — |
