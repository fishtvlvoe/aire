## MODIFIED Requirements

### Requirement: License activation flow

The system SHALL present an activation screen when `settings.license_status` is not `activated`, accepting a license key input field, and SHALL call the OPCOS production license activation API with a device-bound payload when the user submits. The AIRE desktop client SHALL send fields accepted by OPCOS production API and SHALL parse activation responses containing `{ success: true, status: 'active', token, valid_until }`.

##### Example: device_id is stable across launches

- **GIVEN** the application launches for the first time and generates `device_id = 'a1b2c3d4-...'` stored in `settings.device_id`
- **WHEN** the application launches a second time
- **THEN** the same `device_id` value is read from settings and used in subsequent API calls

#### Scenario: Successful activation persists license

- **WHEN** `POST /api/license/activate` returns HTTP 200 with `{ "success": true, "status": "active", "token": "jwt-or-opaque-token", "valid_until": null }`
- **THEN** the system writes `license_status='activated'`, `license_key`, and `license_verified_at` to settings and navigates to the main window

#### Scenario: Activation uses OPCOS-compatible payload

- **WHEN** the user submits license key `AIRE-TEST-0001` from AIRE desktop
- **THEN** the system sends POST `/api/license/activate` to OPCOS with a JSON body containing the license key, stable device fingerprint, device name, and OS version
- **THEN** the request SHALL NOT include case data, owner data, property address, land number, PDF content, or land registry query data

#### Scenario: Activation rejected as already bound to another device

- **WHEN** the OPCOS API returns HTTP 409 with `{ "error": "quota_exhausted" }`
- **THEN** the activation screen displays the message `此序號已綁定其他電腦，請至 OPCOS 後台解除舊裝置` and the input field remains editable

#### Scenario: Activation rejected as invalid key

- **WHEN** the OPCOS API returns HTTP 422 with `{ "error": "invalid_key" }`
- **THEN** the activation screen displays the message `序號無效，請重新輸入`

### Requirement: OPCOS API base URL points to production server in release build

In a `cargo build --release` build or when `AIRE_RELEASE_BUILD=1` is set, the compiled binary SHALL use `https://opcos.me` as the base URL for license API calls. The `build.rs` script SHALL emit `cargo:rustc-env=OPCOS_API_BASE_URL=https://opcos.me` when in release mode. Development and automated tests SHALL be able to override the base URL through `OPCOS_API_BASE_URL`.

#### Scenario: Release binary uses opcos.me

- **GIVEN** `cargo build --release` is executed
- **WHEN** the binary is inspected with `strings target/release/aire | grep opcos.me`
- **THEN** at least one match is found

#### Scenario: Development override uses explicit OPCOS_API_BASE_URL

- **GIVEN** the environment variable `OPCOS_API_BASE_URL=https://test.opcos.local` is set for a development run
- **WHEN** AIRE desktop creates an OPCOS license client
- **THEN** license activation and verification requests target `https://test.opcos.local`

## ADDED Requirements

### Requirement: OPCOS production license API compatibility

OPCOS production license API SHALL accept AIRE desktop activation and verification payloads, SHALL derive the client IP when IP is not supplied by the request body, and SHALL return lowercase error codes that AIRE desktop can map to localized messages.

#### Scenario: Activate accepts desktop alias payload

- **WHEN** AIRE desktop sends POST `/api/license/activate` with `{ "license_key": "AIRE-TEST-0001", "device_id": "device-001", "device_name": "macos arm64", "os_version": "macos arm64" }`
- **THEN** OPCOS returns HTTP 200 with `{ "success": true, "status": "active", "token": "<opaque>", "valid_until": null }` for a valid active license with device capacity

#### Scenario: Verify accepts desktop alias payload

- **WHEN** AIRE desktop sends POST `/api/license/verify` with `{ "license_key": "AIRE-TEST-0001", "device_id": "device-001" }`
- **THEN** OPCOS returns HTTP 200 with `{ "valid": true, "status": "active", "last_verified_at": "<ISO8601>", "license": { "productId": "aire" } }` when license, device, and IP match

#### Scenario: Invalid key returns desktop error code

- **WHEN** AIRE desktop sends POST `/api/license/activate` with an unknown license key
- **THEN** OPCOS returns HTTP 422 with `{ "error": "invalid_key" }`

#### Scenario: Device capacity returns desktop error code

- **WHEN** AIRE desktop sends POST `/api/license/activate` for an active license whose active device count is equal to `maxDevices`
- **THEN** OPCOS returns HTTP 409 with `{ "error": "quota_exhausted" }`

#### Scenario: Verify device mismatch returns desktop error code

- **WHEN** AIRE desktop sends POST `/api/license/verify` with a valid license key and a device id that is not activated for the license
- **THEN** OPCOS returns HTTP 403 with `{ "error": "device_mismatch" }`

#### Scenario: Verify IP mismatch returns desktop error code

- **WHEN** AIRE desktop sends POST `/api/license/verify` from an IP address different from the activation IP
- **THEN** OPCOS returns HTTP 403 with `{ "error": "ip_blocked" }`
