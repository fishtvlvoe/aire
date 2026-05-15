## ADDED Requirements

### Requirement: API key settings page

The system SHALL provide a settings page where users can input their MOI Land Registry client_id and client_secret. The page SHALL include a "Test Connection" button that verifies credentials against the token endpoint.

#### Scenario: Save and test API key

- **WHEN** user enters client_id and client_secret and clicks "Test Connection"
- **THEN** the system attempts token acquisition; on success shows green confirmation, on failure shows error message

##### Example: Successful connection test

- **GIVEN** valid sandbox credentials (CLIENT_ID=9646bd7c-5abc-4be4-916c-07644e5aefd5)
- **WHEN** user clicks "Test Connection"
- **THEN** system displays "連線成功" with green checkmark

##### Example: Invalid credentials

- **GIVEN** wrong client_secret "invalid-secret"
- **WHEN** user clicks "Test Connection"
- **THEN** system displays "認證失敗：請確認 Client ID 與安全碼" with red indicator

### Requirement: OS keychain storage

API credentials SHALL be stored in OS keychain via keyring crate. Credentials SHALL NOT be stored in plaintext on disk, localStorage, or .env files.

#### Scenario: Credentials persist across app restart

- **WHEN** user saves API key, closes app, and reopens
- **THEN** the settings page shows masked credentials (last 4 chars visible) without re-entry

### Requirement: Clear credentials

The system SHALL provide a "Clear" button to remove stored credentials from keychain.

#### Scenario: Clear removes keychain entry

- **WHEN** user clicks "Clear Credentials"
- **THEN** keychain entry is removed and subsequent API calls return ApiKeyNotConfigured
