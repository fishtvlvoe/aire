## ADDED Requirements

### Requirement: Mandatory consent before data pull

The system SHALL display an OwnerAuthorizationDialog before any land registry data pull. The dialog SHALL contain a checkbox labeled "客戶已書面授權查詢不動產資料" that the user MUST check before proceeding.

#### Scenario: Consent required to proceed

- **WHEN** user clicks "拉謄本" on a case
- **THEN** OwnerAuthorizationDialog appears with unchecked checkbox; confirm button is disabled until checked

##### Example: Consent flow

- **GIVEN** user is on case detail page with parcel_id "0301-0001"
- **WHEN** user clicks "拉謄本"
- **THEN** dialog shows with checkbox unchecked, confirm button disabled
- **WHEN** user checks the checkbox
- **THEN** confirm button becomes enabled

### Requirement: Consent logging

Upon consent confirmation, the system SHALL write a record to owner_consent_log table with case_id, timestamp (time-synced), and user identifier.

#### Scenario: Consent recorded in database

- **WHEN** user checks consent and clicks confirm
- **THEN** owner_consent_log contains a new row with case_id, current timestamp, and user email

##### Example: Consent record written

- **GIVEN** user email is "agent@example.com", case_id is "case-001", time-synced now is 2026-05-15T10:30:00Z
- **WHEN** user checks consent and clicks confirm
- **THEN** owner_consent_log row: case_id="case-001", timestamp="2026-05-15T10:30:00Z", user_email="agent@example.com"

### Requirement: Backend enforcement

The IPC command for data pull SHALL verify that a consent record exists for the given case_id within the current session. If no consent record exists, the command SHALL return ConsentRequired error.

#### Scenario: IPC rejects without consent

- **WHEN** pull_data IPC is called without prior consent record for case_id
- **THEN** IPC returns LandRegistryError::ConsentRequired

##### Example: No consent blocks pull

- **GIVEN** no consent record for case_id "case-002" in owner_consent_log
- **WHEN** land_registry_pull_data is called with case_id "case-002"
- **THEN** returns Err(LandRegistryError::ConsentRequired)
