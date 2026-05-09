## MODIFIED Requirements

### Requirement: User login with credentials

The login page at `/login` SHALL display three input fields: email (required), password (required), and license key (required, displayed as password-type input for visual masking). The login page SHALL NOT display any default credentials, hints, or prefilled values. The placeholder for the email field SHALL be "請輸入帳號". The placeholder for the password field SHALL be "請輸入密碼". The placeholder for the license key field SHALL be "請輸入授權序號". The page title SHALL remain "AI 不動產說明書".

The login form SHALL call the login API with three parameters: `{ email, password, licenseKey }`. The login API SHALL first validate the license key (Ed25519 signature + expiration check), then authenticate the user credentials. If the license key is invalid or expired, the API SHALL return an error before attempting credential verification.

#### Scenario: Successful login with valid license key

- **WHEN** a user submits valid email, password, and a valid non-expired license key on `/login`
- **THEN** the system SHALL verify the license key first (Ed25519 signature + expiration)
- **THEN** the system SHALL authenticate credentials via NextAuth CredentialsProvider
- **THEN** the system SHALL issue JWT Access Token and Refresh Token
- **THEN** the system SHALL redirect to `/listings`

##### Example: Customer login with license key

- **GIVEN** license key "RE-AI-abc123..." is valid (signature OK, expires 2027-12-31)
- **GIVEN** user "agent@realty.com" exists with valid password hash
- **WHEN** user submits email "agent@realty.com", password "pass123", licenseKey "RE-AI-abc123..." on `/login`
- **THEN** license verification passes → credential authentication passes → redirect to `/listings`

#### Scenario: Invalid license key blocks login

- **WHEN** a user submits a license key with invalid Ed25519 signature
- **THEN** the system SHALL return error "授權序號無效"
- **THEN** the system SHALL NOT attempt credential verification

#### Scenario: Expired license key blocks login

- **WHEN** a user submits a license key whose expiration date has passed (Asia/Taipei timezone)
- **THEN** the system SHALL return error "授權序號已過期"
- **THEN** the system SHALL NOT attempt credential verification

##### Example: Expired license key

- **GIVEN** license key "RE-AI-expired..." has expires "2024-01-01T00:00:00+08:00"
- **WHEN** user submits this key on 2026-05-09
- **THEN** login page displays "授權序號已過期"

#### Scenario: Valid license key but wrong credentials

- **WHEN** a user submits a valid license key but incorrect email or password
- **THEN** the system SHALL return error "帳號或密碼錯誤"

## ADDED Requirements

### Requirement: Login page removes default credential hints

The login page SHALL NOT display any default username, password, or credential hints. The username input field SHALL NOT have a default value of "admin". The text "預設帳號：admin / admin123" SHALL be removed from the page entirely, including in development mode.

#### Scenario: No default credentials displayed

- **WHEN** a user visits `/login` in any environment (development or production)
- **THEN** no default credential hints SHALL be visible
- **THEN** the email input field SHALL be empty

##### Example: Development mode login page

- **GIVEN** application running with `NODE_ENV=development`
- **WHEN** user navigates to `/login`
- **THEN** email field is empty (no "admin" prefill), no "預設帳號：admin / admin123" text visible

## MODIFIED Requirements

### Requirement: Auth middleware order

The system SHALL execute auth checks in `src/middleware.ts` without license checks in the middleware layer. The middleware SHALL only verify JWT Access Token presence for protected routes. License validation SHALL be performed during login API calls, not in middleware.

Auth-exempt paths SHALL include: `/login`, `/admin/login`, `/api/auth/*`, `/api/admin/*`, `/_next/*`, `/favicon.ico`.

#### Scenario: Auth-exempt paths include admin login

- **WHEN** the request path matches `/admin/login` or `/api/admin/login`
- **THEN** the middleware SHALL skip the auth check

#### Scenario: Authenticated request passes without license check

- **WHEN** a request has a valid JWT Access Token
- **THEN** the middleware SHALL allow the request without performing any license validation

##### Example: Authenticated request to listings

- **GIVEN** JWT cookie contains `{ sub: "agent@realty.com", exp: future_timestamp }`
- **WHEN** GET `/listings` is requested
- **THEN** middleware allows the request (no license check performed), listings page renders
