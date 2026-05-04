## ADDED Requirements

### Requirement: Server-side license activation

The system SHALL activate a license key by binding it to an email address and recording the client IP on first use.

#### Scenario: Successful activation

- **WHEN** client sends POST /api/license/activate with valid license_key and email
- **THEN** server SHALL bind the license to that email and record the allowed IP CIDR
- **THEN** server SHALL return HTTP 200 with activation confirmation

#### Scenario: Already activated license

- **WHEN** client sends activation request for an already-activated license
- **THEN** server SHALL return HTTP 409 with error "LICENSE_ALREADY_ACTIVATED"

### Requirement: Server-side license verification

The system SHALL verify license validity on every application startup by checking email, license key, IP, and expiration.

#### Scenario: Valid license and IP

- **WHEN** client sends POST /api/license/verify with valid license_key, matching email, and IP within allowed CIDR
- **THEN** server SHALL return HTTP 200 with status "valid"

#### Scenario: IP outside allowed range

- **WHEN** client IP is outside the license's allowed CIDR
- **THEN** server SHALL return HTTP 403 with error "IP_NOT_ALLOWED"

#### Scenario: Expired license

- **WHEN** license expiration date has passed
- **THEN** server SHALL return HTTP 403 with error "LICENSE_EXPIRED"

### Requirement: Offline lockout

The system SHALL lock the application when it cannot reach the license server.

#### Scenario: Network unavailable

- **WHEN** application cannot connect to the license server on startup
- **THEN** application SHALL display "請連接網路以驗證授權" and block all functionality
