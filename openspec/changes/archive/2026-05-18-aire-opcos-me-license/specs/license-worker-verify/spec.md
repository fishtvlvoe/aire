## ADDED Requirements

### Requirement: Verify returns active status for valid device

The Worker endpoint `POST /api/license/verify` SHALL, when the KV record exists with `status: "active"` and the requesting `device_id` matches, return HTTP 200 with `{ "status": "active", "valid_until": null, "last_verified_at": "<ISO timestamp>" }`.

#### Scenario: Verify an active license from correct device

- **GIVEN** KV contains `license:TESTKEY` = `{ "status": "active", "device_id": "dev-001" }`
- **WHEN** `POST /api/license/verify` with `{ "license_key": "TESTKEY", "device_id": "dev-001" }`
- **THEN** HTTP 200, body `{ "status": "active", "valid_until": null, "last_verified_at": "<ISO 8601 string>" }`

### Requirement: Device mismatch returns 403

When the KV record exists with `status: "active"` but the requesting `device_id` does NOT match, the endpoint SHALL return HTTP 403 with body `{ "error": "device_mismatch" }`.

#### Scenario: Wrong device verifies

- **GIVEN** KV contains `license:TESTKEY` = `{ "status": "active", "device_id": "dev-001" }`
- **WHEN** `POST /api/license/verify` with `{ "license_key": "TESTKEY", "device_id": "wrong-device" }`
- **THEN** HTTP 403, body `{ "error": "device_mismatch" }`

### Requirement: Non-active license returns 404

When the KV key does not exist or `status` is not `"active"`, the endpoint SHALL return HTTP 404 with body `{ "error": "invalid_license" }`.

#### Scenario: Verify an inactive license

- **GIVEN** KV contains `license:TESTKEY` = `{ "status": "inactive" }`
- **WHEN** `POST /api/license/verify` with `{ "license_key": "TESTKEY", "device_id": "dev-001" }`
- **THEN** HTTP 404, body `{ "error": "invalid_license" }`
