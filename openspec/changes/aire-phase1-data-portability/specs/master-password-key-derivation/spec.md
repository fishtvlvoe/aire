# master-password-key-derivation Specification

## Purpose

Derive the SQLCipher database key from a customer-set master password using Argon2id with OWASP-recommended parameters, store the database key wrapped under the master-derived key in a local keystore, and never persist the master password itself.

## ADDED Requirements

### Requirement: System SHALL derive a key wrap with Argon2id OWASP parameters

The system SHALL derive a 32-byte key from the master password using Argon2id with `m_cost = 19456` (19 MiB), `t_cost = 2`, `p_cost = 1`, and a per-keystore random salt of 16 bytes. The derived key SHALL be used solely as the AES-GCM key that wraps the actual SQLCipher key in `keystore.json`.

#### Scenario: Identical password and salt yield identical derived key

- **WHEN** the system runs Argon2id twice with the same password and the same salt
- **THEN** the two derived 32-byte outputs are byte-for-byte identical

#### Scenario: Different salts yield different derived keys

- **WHEN** the system runs Argon2id twice with the same password but different 16-byte salts
- **THEN** the two derived 32-byte outputs are different

### Requirement: System SHALL never persist the master password

The system SHALL hold the master password only in process memory for the duration required to derive the wrapping key and SHALL zeroize the password buffer immediately after derivation. The system SHALL NOT write the master password to disk, log files, telemetry, or crash dumps.

#### Scenario: Master password buffer is zeroized after derivation

- **WHEN** Argon2id derivation completes
- **THEN** the byte buffer that held the master password contains only zero bytes when inspected before the buffer is dropped

### Requirement: SQLCipher key SHALL be a random 32-byte value wrapped twice

The system SHALL generate a 32-byte random SQLCipher key on first master password setup and SHALL wrap that key once with the master-derived key (`vault_master`) and once with the recovery-derived key (`vault_recovery`), both using AES-256-GCM with random 12-byte nonces. The system SHALL store both wrapped vaults in `keystore.json`.

#### Scenario: First-time setup writes both vaults

- **WHEN** the user completes first-time master password setup
- **THEN** `keystore.json` contains `vault_master` and `vault_recovery` entries that both decrypt to the same 32-byte SQLCipher key when the correct master password or recovery code is supplied

### Requirement: Unlock SHALL succeed with the correct master password

The system SHALL accept a master password attempt, derive the wrapping key with the stored salt and Argon2id parameters, attempt AES-GCM decryption of `vault_master`, and apply the recovered SQLCipher key via `PRAGMA key`. The system SHALL surface `UnlockError::WrongPassword` on AES-GCM authentication failure.

#### Scenario: Correct master password unlocks the database

- **WHEN** the user enters the correct master password during unlock
- **THEN** the system applies the recovered SQLCipher key via `PRAGMA key` and the next database query returns rows

#### Scenario: Wrong master password is rejected

- **WHEN** the user enters an incorrect master password during unlock
- **THEN** the system surfaces `UnlockError::WrongPassword` and the UI displays "主密碼錯誤，請再試一次"

### Requirement: First-time master password SHALL enforce minimum length

The system SHALL reject a master password shorter than 8 Unicode code points during first-time setup and during reset. The system SHALL NOT impose any other complexity rules in Phase 1.

#### Scenario: Short master password is rejected

- **WHEN** the user submits a master password with fewer than 8 code points
- **THEN** the system surfaces `SetupError::PasswordTooShort` and the UI displays "主密碼至少需 8 個字元"

### Requirement: Argon2id parameters SHALL be persisted alongside salts

The system SHALL store the Argon2id `m_cost`, `t_cost`, `p_cost` values inside `keystore.json` so future binary upgrades can recognize and tune parameters without breaking existing customers.

#### Scenario: Keystore records Argon2id parameters

- **WHEN** the system writes `keystore.json` after first-time setup
- **THEN** the file contains an `argon2_params` object with `m_cost: 19456`, `t_cost: 2`, `p_cost: 1`
