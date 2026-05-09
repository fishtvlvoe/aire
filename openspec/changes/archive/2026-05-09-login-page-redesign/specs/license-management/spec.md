## MODIFIED Requirements

### Requirement: License serial key validation

The license serial key validation SHALL be performed during the customer login API call instead of in Next.js Middleware. The login API SHALL accept a `licenseKey` field in the request body and validate it using Ed25519 asymmetric signature verification. The middleware SHALL no longer perform license validation on every HTTP request.

#### Scenario: License validated during login

- **WHEN** customer submits login form with `{ email, password, licenseKey }`
- **THEN** the login API SHALL validate the license key signature and expiration before authenticating credentials

##### Example: Login API license validation flow

- **GIVEN** customer submits licenseKey "RE-AI-abc123..." with valid Ed25519 signature and expires "2027-12-31"
- **WHEN** POST `/api/auth/login` processes the request
- **THEN** license validation passes → credential authentication proceeds

#### Scenario: License validation moved out of middleware

- **WHEN** any HTTP request hits Next.js Middleware
- **THEN** the middleware SHALL NOT perform license validation
- **THEN** the middleware SHALL only check JWT token presence for protected routes

##### Example: Middleware no longer checks license

- **GIVEN** user has valid JWT token but no license key was submitted in this session
- **WHEN** GET `/listings` is requested
- **THEN** middleware checks JWT only (valid) → request passes through without any license verification

### Requirement: Middleware license cache

This requirement is MODIFIED to remove license checking from middleware. The middleware SHALL no longer call `getCachedLicense()` or redirect to `/setup` based on license status. License validity is verified at login time, not on every request.

#### Scenario: Middleware skips license check

- **WHEN** any HTTP request arrives at the middleware
- **THEN** the middleware SHALL NOT call `getCachedLicense()`
- **THEN** the middleware SHALL NOT redirect to `/setup` based on license status
- **THEN** the middleware SHALL only verify JWT token and redirect to `/login` if missing

## ADDED Requirements

### Requirement: Login requires valid license as precondition

License validation SHALL occur within the login API endpoint when the customer submits a license key, not as a middleware precondition. The login API SHALL validate the license key before authenticating credentials.

#### Scenario: Invalid license key at login

- **WHEN** customer submits login with an invalid or expired license key
- **THEN** the login API SHALL return an error message specific to the license issue
- **THEN** the login API SHALL NOT attempt credential authentication

##### Example: Expired license at login

- **GIVEN** license key "RE-AI-expired..." has expires "2024-01-01T00:00:00+08:00"
- **WHEN** customer submits this key with valid credentials on `/login`
- **THEN** login API returns 403 `{ error: "授權序號已過期" }` without checking credentials
