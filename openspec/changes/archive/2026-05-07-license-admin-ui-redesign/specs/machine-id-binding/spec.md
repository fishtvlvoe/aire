## ADDED Requirements

### Requirement: License activation binds to machine ID

The system SHALL capture the machine's unique identifier (via node-machine-id) during license activation. The machineId SHALL be hashed with SHA-256 before storage. The hashed machineId SHALL be stored in the Vercel KV license object under the machineId field.

#### Scenario: Activation stores machine ID
- **WHEN** client sends POST /api/license/activate with { key: "ABCD-1234", email: "user@test.com", machineId: "raw-uuid-string" }
- **THEN** the system stores machineId as SHA-256 hash of "raw-uuid-string" in license:ABCD-1234

##### Example: Machine ID hashing
- **GIVEN** raw machineId = "550e8400-e29b-41d4-a716-446655440000"
- **WHEN** activation is processed
- **THEN** stored machineId = SHA-256("550e8400-e29b-41d4-a716-446655440000")

### Requirement: License verification validates machine ID

The system SHALL compare the requesting machine's hashed machineId against the stored value during license verification. Mismatch SHALL result in verification failure.

#### Scenario: Same machine passes verification
- **WHEN** verify request machineId hash matches stored machineId hash
- **THEN** verification succeeds (200)

#### Scenario: Different machine fails verification
- **WHEN** verify request machineId hash does NOT match stored machineId hash
- **THEN** verification fails with 403 { error: "此序號已綁定其他電腦" }

### Requirement: Admin can unbind machine ID

The admin dashboard SHALL provide an "解綁機器" (Unbind Machine) action button for activated licenses. Clicking it SHALL clear the machineId from the license record, allowing re-activation on a different machine.

#### Scenario: Unbind machine ID
- **WHEN** admin clicks "解綁機器" for license ABCD-1234
- **THEN** the system clears machineId from license:ABCD-1234 in Vercel KV
- **THEN** the license status remains "activated" but machineId is null

#### Scenario: Customer re-activates on new machine after unbind
- **WHEN** machineId is null and client sends activation with a new machineId
- **THEN** the new machineId is stored and subsequent verifications use the new value

##### Example: Machine swap flow
- **GIVEN** license ABCD-1234 has machineId = null (admin unbound it), status = "activated"
- **WHEN** client on new machine sends POST /api/license/activate with { key: "ABCD-1234", email: "user@test.com", machineId: "new-machine-uuid-999" }
- **THEN** license ABCD-1234 machineId is set to SHA-256("new-machine-uuid-999") and verify with this machineId returns 200
