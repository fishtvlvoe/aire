## ADDED Requirements

### Requirement: Activation requires pre-issued serial

The system SHALL allow `POST /api/license/activate` only for serial keys that were pre-created by admin and are currently in `issued` status.

#### Scenario: Activate a pre-issued serial key

- **WHEN** client calls `POST /api/license/activate` with `email` and an `issued` serial key
- **THEN** server SHALL return HTTP 200 and set record status to `activated`
- **THEN** server SHALL persist `activatedAt` and normalized lowercase email

#### Scenario: Reject activation for non-preissued key

- **WHEN** client calls `POST /api/license/activate` with a key that does not exist in serial inventory
- **THEN** server SHALL return HTTP 404 with `{ "valid": false, "reason": "license_not_found" }`

#### Scenario: Reject activation for revoked key

- **WHEN** client calls `POST /api/license/activate` with a key whose status is `revoked`
- **THEN** server SHALL return HTTP 403 with `{ "valid": false, "reason": "license_inactive" }`

### Requirement: Verification enforces lifecycle status

The system SHALL enforce lifecycle status on `POST /api/license/verify` so only `activated` and non-expired records can pass verification.

#### Scenario: Verify activated and non-expired key

- **WHEN** client calls `POST /api/license/verify` with matching email and an `activated` key before `expiresAt`
- **THEN** server SHALL return HTTP 200 with `{ "valid": true }`

#### Scenario: Verify issued but not activated key

- **WHEN** client calls `POST /api/license/verify` for an `issued` key
- **THEN** server SHALL return HTTP 403 with `{ "valid": false, "reason": "license_not_activated" }`

#### Scenario: Verify revoked key

- **WHEN** client calls `POST /api/license/verify` for a `revoked` key
- **THEN** server SHALL return HTTP 403 with `{ "valid": false, "reason": "license_inactive" }`
