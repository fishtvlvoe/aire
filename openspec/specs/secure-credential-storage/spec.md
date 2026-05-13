# secure-credential-storage Specification

## Purpose

TBD - created by archiving change 'aire-desktop-phase1'. Update Purpose after archive.

## Requirements

### Requirement: OS-native credential storage

The system SHALL store the license key, the OPCOS-issued JWT token, and any client-provided land registry API keys in the OS-native credential store via the `keyring` crate, namespaced under service name `aire` with per-credential account names (`license_key`, `license_token`, `land_registry_api_key`).

#### Scenario: License key persisted to macOS Keychain

- **WHEN** activation succeeds on macOS and the system stores the license key
- **THEN** the value is accessible via `keyring::Entry::new("aire", "license_key").get_password()` and is NOT present in `aire.db` or any file under the application data directory

#### Scenario: License key persisted to Windows Credential Manager

- **WHEN** activation succeeds on Windows and the system stores the license key
- **THEN** the value is accessible via `keyring::Entry::new("aire", "license_key").get_password()` and is NOT present in `aire.db` or any file under `%APPDATA%\aire\`

---
### Requirement: No plaintext credentials in SQLite

The system MUST NOT write the license key, license token, or land registry API key as plaintext values into any column of `aire.db`. Only references such as `license_status` (state-only) SHALL appear in the settings table.

#### Scenario: Settings table contains no credential values

- **WHEN** a user inspects `aire.db` after activation completes
- **THEN** the `settings` table contains keys including `license_status` but no row whose value is the literal license key string or token

---
### Requirement: Keychain write failure surfaces explicit error

The system SHALL surface keychain write failures during activation as a structured error with code `CREDENTIAL_STORE_UNAVAILABLE` and SHALL NOT silently fall back to plaintext storage.

#### Scenario: Activation fails when keychain unavailable

- **WHEN** the OS keychain returns an error during `keyring::Entry::set_password`
- **THEN** the activation handler returns `Err(ActivationError { code: 'CREDENTIAL_STORE_UNAVAILABLE', message })`, settings are NOT updated, and the UI displays `無法寫入系統憑證儲存區，請以管理員身份開啟`

---
### Requirement: Credential retrieval boundary cases

The system SHALL return `Ok(None)` when a credential is missing from the keychain (e.g., before first activation) and SHALL return `Err` only for true storage errors.

#### Scenario: Missing credential returns None

- **WHEN** the system queries `get_credential('license_key')` before any activation has occurred
- **THEN** the function returns `Ok(None)`, not an error

#### Scenario: Keychain locked returns error

- **WHEN** the macOS Keychain is locked and queried
- **THEN** the function returns `Err(CredentialError { code: 'LOCKED', message })`
