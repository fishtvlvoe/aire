# license-activation Specification

## Purpose

TBD - created by archiving change 'aire-desktop-phase1'. Update Purpose after archive.

## Requirements

### Requirement: License verification on startup

The system SHALL check license status on every application startup; if status is `activated` and the last successful verification was less than 7 days ago, the application MUST proceed to the main window without contacting OPCOS.

#### Scenario: Recently verified license skips network call

- **WHEN** the application starts with `settings.license_status='activated'` and `settings.license_verified_at` 3 days ago
- **THEN** no HTTP request is made to OPCOS and the user lands on the main window

#### Scenario: Verification older than 7 days triggers network check

- **WHEN** the application starts with `settings.license_status='activated'` and `settings.license_verified_at` 10 days ago
- **THEN** the system calls `POST /api/license/verify` against the OPCOS base URL

---
### Requirement: License activation flow

The system SHALL present an activation screen when `settings.license_status` is not `activated`, accepting a license key input field, and SHALL call `POST /api/license/activate` with body `{ license_key, device_id, device_name, os_version }` when the user submits.

##### Example: device_id is stable across launches

- **GIVEN** the application launches for the first time and generates `device_id = 'a1b2c3d4-...'` stored in `settings.device_id`
- **WHEN** the application launches a second time
- **THEN** the same `device_id` value is read from settings and used in subsequent API calls

#### Scenario: Successful activation persists license

- **WHEN** the OPCOS API returns 200 with `{ status: 'active', token, valid_until }`
- **THEN** the system writes `license_status='activated'`, `license_key`, and `license_verified_at` to settings and navigates to the main window

#### Scenario: Activation rejected as already bound to another device

- **WHEN** the OPCOS API returns 409 with `{ error: 'already_activated_other_device' }`
- **THEN** the activation screen displays the message `此序號已綁定其他電腦，請至 OPCOS 後台解除舊裝置` and the input field remains editable

#### Scenario: Activation rejected as invalid key

- **WHEN** the OPCOS API returns 422 with `{ error: 'invalid_key' }`
- **THEN** the activation screen displays the message `序號無效，請重新輸入`

---
### Requirement: Offline grace period

The system SHALL allow the application to operate offline for up to 30 days after the last successful verification; verification attempts SHALL be made on launch when verification is older than 7 days, but failures within the 30-day window MUST NOT block the user.

##### Example: grace period boundary behavior

| Days since last verify | Network state | Behavior |
| --- | --- | --- |
| 3 | offline | enter main window, no network call |
| 10 | offline | enter main window, log network failure |
| 10 | online OK | call verify, update verified_at, enter main window |
| 31 | offline | block at activation screen with message |
| 31 | online OK | call verify, on success enter main window |

#### Scenario: Verification fails with network error within grace

- **WHEN** verification API call fails with a network error and `now - license_verified_at < 30 days`
- **THEN** the system writes a row to `operation_log` with `action='license_verify'`, `result='error'`, payload containing `reason='network_failed'`, and the user enters the main window

#### Scenario: Verification fails outside grace

- **WHEN** the application launches with `now - license_verified_at >= 30 days` and the network is unreachable
- **THEN** the system displays the activation screen with message `授權需要重新驗證，請連線網路` and prevents entry to the main window

---
### Requirement: Remote revocation handling

The system SHALL treat a 401 or 403 response from `POST /api/license/verify` as remote revocation and SHALL redirect the user to the activation screen while preserving all local SQLite data.

#### Scenario: Revoked license redirects to activation

- **WHEN** verification returns 401 with `{ error: 'revoked' }`
- **THEN** the system sets `license_status='revoked'` in settings, navigates to activation screen with message `授權已被遠端撤銷，請重新啟用`, and SQLite tables `cases`, `disclosure_drafts`, `settings` remain unchanged

#### Scenario: Device mismatch on verify

- **WHEN** verification returns 403 with `{ error: 'device_mismatch' }`
- **THEN** the system shows activation screen with message `此電腦不在授權清單，請重新啟用`
