## ADDED Requirements

### Requirement: First-time activation binds device to license

The Worker endpoint `POST /api/license/activate` SHALL, when the KV record for the license key exists with `status: "inactive"`, update the record to `status: "active"` with the provided `device_id`, `device_name`, `os_version`, and `activated_at` (ISO 8601 timestamp), and return HTTP 200.

#### Scenario: Activate an inactive license key

- **GIVEN** KV contains `license:TESTKEY` = `{ "status": "inactive" }`
- **WHEN** `POST /api/license/activate` with body `{ "license_key": "TESTKEY", "device_id": "dev-001", "device_name": "MacBook", "os_version": "14.0" }`
- **THEN** HTTP 200, body `{ "status": "active", "token": "TESTKEY", "valid_until": null }`
- **AND** KV `license:TESTKEY` contains `{ "status": "active", "device_id": "dev-001" }`

### Requirement: Re-activation by same device is idempotent

When the license key is `status: "active"` and the requesting `device_id` matches the stored one, the endpoint SHALL return HTTP 200 without modifying the KV record.

#### Scenario: Same device re-activates

- **GIVEN** KV contains `license:TESTKEY` = `{ "status": "active", "device_id": "dev-001" }`
- **WHEN** `POST /api/license/activate` with `{ "license_key": "TESTKEY", "device_id": "dev-001", ... }`
- **THEN** HTTP 200, body `{ "status": "active", "token": "TESTKEY", "valid_until": null }`

### Requirement: Different device returns 409

When the license key is `status: "active"` and the requesting `device_id` does NOT match, the endpoint SHALL return HTTP 409 with body `{ "error": "device_locked" }`.

#### Scenario: Second device tries to activate a locked key

- **GIVEN** KV contains `license:TESTKEY` = `{ "status": "active", "device_id": "dev-001" }`
- **WHEN** `POST /api/license/activate` with `{ "license_key": "TESTKEY", "device_id": "other-device", ... }`
- **THEN** HTTP 409, body `{ "error": "device_locked" }`

### Requirement: Unknown or revoked key returns 404

When the KV key does not exist or `status` is `"revoked"`, the endpoint SHALL return HTTP 404 with body `{ "error": "invalid_license" }`.

#### Scenario: Activate a non-existent key

- **GIVEN** KV has no entry for `license:UNKNOWN`
- **WHEN** `POST /api/license/activate` with `{ "license_key": "UNKNOWN", ... }`
- **THEN** HTTP 404, body `{ "error": "invalid_license" }`
