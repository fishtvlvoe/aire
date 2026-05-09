## ADDED Requirements

### Requirement: auto-provision-vendor-account

When the License init API receives a successful response from the License Server that includes a `vendorCredentials` object, the system SHALL automatically create or update a vendor account in the local users table.

#### Scenario: first-time license activation with vendor credentials

- **WHEN** a client activates their license for the first time and the License Server response includes `vendorCredentials` with username, passwordHash, and displayName
- **THEN** the system creates a new user record with `is_vendor = 1`, `role = 'admin'`, the provided username, passwordHash stored directly, displayName, and email set to `{username}@vendor.AIRE.app`

##### Example: initial vendor provisioning

- **GIVEN** License Server responds with `vendorCredentials: { username: "vendor-fish", passwordHash: "$2b$10$abc...", displayName: "系統維護" }`
- **WHEN** the license init API processes this response
- **THEN** a user record is inserted: `username = "vendor-fish"`, `email = "vendor-fish@vendor.AIRE.app"`, `role = "admin"`, `is_vendor = 1`, `password_hash = "$2b$10$abc..."`

### Requirement: update-existing-vendor-account

When a vendor account with the same username already exists (is_vendor = 1), the system SHALL update the password_hash and display_name instead of creating a duplicate.

#### Scenario: re-activation updates vendor password

- **WHEN** a client re-verifies their license and a vendor account with the same username already exists
- **THEN** the system updates the existing vendor account's password_hash and display_name without creating a new record

##### Example: vendor password rotation

- **GIVEN** user record exists: `username = "vendor-fish"`, `is_vendor = 1`, `password_hash = "$2b$10$old..."`
- **WHEN** License Server responds with `vendorCredentials: { username: "vendor-fish", passwordHash: "$2b$10$new...", displayName: "系統維護" }`
- **THEN** the existing record is updated: `password_hash = "$2b$10$new..."`, no new record is created

### Requirement: no-vendor-without-credentials

When the License Server response does NOT include `vendorCredentials`, the system SHALL NOT create any vendor account.

#### Scenario: license activation without vendor credentials

- **WHEN** the License Server response is valid but does not contain `vendorCredentials`
- **THEN** no vendor account is created or modified, and the license activation proceeds normally
