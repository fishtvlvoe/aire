## ADDED Requirements

### Requirement: User login with credentials

The system SHALL authenticate users via Auth.js Credentials Provider with username/password stored in SQLite `users` table (bcryptjs cost=12 hash).

**Scenario: Successful login**
- Given: User account exists with matching bcrypt-hashed password
- When: User submits valid credentials on `/login`
- Then: Access Token (JWT, 15-min expiry) SHALL be issued and a Refresh Token SHALL be set as HttpOnly Secure SameSite=Strict cookie (7-day expiry)
- And: User SHALL be redirected to the application homepage

**Scenario: Invalid credentials**
- Given: User submits wrong username or password
- When: Auth.js processes the login
- Then: System SHALL return HTTP 401 and user remains on `/login` with error message

**Scenario: Unauthenticated access**
- Given: No valid Access Token is present
- When: Request reaches any protected route
- Then: Next.js Middleware SHALL redirect to `/login` with HTTP 301

### Requirement: Dual token mechanism

**Scenario: Access Token expiry with valid Refresh Token**
- Given: Access Token has expired (15 min elapsed) and valid non-revoked Refresh Token exists in `refresh_tokens` table
- When: Client calls `/api/auth/refresh`
- Then: New Access Token SHALL be issued, old Refresh Token SHALL be revoked (revoked=1), new Refresh Token SHALL be issued (token rotation)

**Scenario: Refresh Token expired or revoked**
- Given: Refresh Token is past `expires_at` or has `revoked=1`
- When: Client calls `/api/auth/refresh`
- Then: Endpoint SHALL return HTTP 401 and user SHALL be redirected to `/login`

### Requirement: Password storage

User passwords SHALL be hashed with bcryptjs at cost factor 12 before storage. Plaintext passwords SHALL never be stored or logged.

#### Scenario: Create user with plaintext password
- Given: Admin runs `create-admin.ts --username admin --password secret123`
- When: Script calls `createUser()`
- Then: `users` table SHALL store bcrypt-hashed password with cost factor 12, and plaintext SHALL NOT appear in logs or DB

### Requirement: Admin account creation CLI

`scripts/create-admin.ts` SHALL accept `--username` and `--password` arguments to create the initial admin account. SHALL fail if username already exists.

#### Scenario: Create initial admin
- Given: `users` table is empty
- When: Operator runs `npx tsx scripts/create-admin.ts --username admin --password secret123`
- Then: Script SHALL insert one user record and exit 0

#### Scenario: Duplicate username
- Given: User "admin" already exists in `users` table
- When: Operator runs script with `--username admin`
- Then: Script SHALL print error to stderr and exit 1 without modifying DB

### Requirement: Auth middleware order

Auth check SHALL run only after License check passes. Invalid license causes redirect to `/setup/license` before any auth check.

#### Scenario: Unlicensed unauthenticated request
- Given: No valid license exists and user has no Access Token
- When: Request hits a protected page
- Then: Middleware SHALL redirect to `/setup/license` (not `/login`)

#### Scenario: Licensed but unauthenticated request
- Given: Valid license exists but user has no Access Token
- When: Request hits a protected page
- Then: Middleware SHALL redirect to `/login`

### Requirement: Route protection scope

Exempt from authentication: `/login`, `/api/auth/*`, `/_next/*`, `/favicon.ico`. All other routes require valid Access Token.

#### Scenario: Access static asset
- Given: User has no Access Token
- When: Request hits `/_next/static/chunk.js`
- Then: Middleware SHALL allow the request without redirect

#### Scenario: Access protected listing page
- Given: User has no Access Token
- When: Request hits `/listings`
- Then: Middleware SHALL redirect to `/login` with HTTP 301
