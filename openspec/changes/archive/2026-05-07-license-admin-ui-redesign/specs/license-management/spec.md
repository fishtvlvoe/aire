## ADDED Requirements

### Requirement: License activation includes machine ID binding

The POST /api/license/activate endpoint SHALL accept an additional machineId field in the request body. The machineId SHALL be hashed with SHA-256 and stored in the license record. Activation SHALL only succeed for licenses with status "issued" or licenses with status "activated" but null machineId (re-activation after unbind).

#### Scenario: First activation with machine ID
- **WHEN** client sends POST /api/license/activate with { key: "ABCD-1234", email: "user@test.com", machineId: "uuid-string" }
- **THEN** the license status changes to "activated" with machineId set to SHA-256("uuid-string")

#### Scenario: Activation of already-bound license
- **WHEN** license already has a non-null machineId and a different machineId is sent
- **THEN** the system returns 403 { error: "此序號已綁定其他電腦" }

#### Scenario: Re-activation after unbind
- **WHEN** license has status "activated" and machineId is null
- **THEN** activation succeeds and stores the new machineId

### Requirement: License verification validates machine ID

The GET /api/license/verify endpoint SHALL accept a machineId query parameter. When the license has a stored machineId, the system SHALL compare it against the SHA-256 hash of the provided machineId. Mismatch SHALL return 403.

#### Scenario: Verification with matching machine
- **WHEN** stored machineId matches hash of provided machineId
- **THEN** verification succeeds (200)

#### Scenario: Verification with mismatched machine
- **WHEN** stored machineId does NOT match hash of provided machineId
- **THEN** the system returns 403 { error: "此序號已綁定其他電腦" }

#### Scenario: Verification for license without machine binding
- **WHEN** license has null machineId (not yet activated or unbound)
- **THEN** verification proceeds without machine check

##### Example: Unbound license passes any machine
- **GIVEN** license ABCD-1234 has machineId = null
- **WHEN** client sends GET /api/license/verify?key=ABCD-1234&machineId=any-machine-uuid
- **THEN** verification returns 200 (machine check skipped)
