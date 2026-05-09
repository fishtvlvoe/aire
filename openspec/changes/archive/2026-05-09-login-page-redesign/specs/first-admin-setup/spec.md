## REMOVED Requirements

### Requirement: Setup wizard includes admin account creation step

**Reason:** Admin account creation is no longer self-service. Admin accounts are seeded from environment variables at application startup. The `/setup/admin` page and its API endpoint are removed.

**Migration:** Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables before starting the application. The system will automatically create the admin account on first startup.

#### Scenario: Setup wizard step 2 no longer available

- **WHEN** user navigates to `/setup/admin`
- **THEN** the system SHALL return HTTP 404

### Requirement: First admin account creation API

**Reason:** The `POST /api/setup/create-first-admin` endpoint is removed. Admin creation is handled internally by the seed function at startup, not through an HTTP API.

**Migration:** No API consumers need to update. The endpoint was only called from the `/setup/admin` UI which is also removed.

#### Scenario: Create-first-admin endpoint removed

- **WHEN** client sends POST to `/api/setup/create-first-admin`
- **THEN** the system SHALL return HTTP 404

### Requirement: First admin setup page UI

**Reason:** The `/setup/admin` page is removed. No self-service admin creation is available.

**Migration:** Admin credentials are provided via environment variables.

#### Scenario: Admin setup page removed

- **WHEN** user navigates to `/setup/admin`
- **THEN** the page SHALL not render; system returns HTTP 404

### Requirement: Middleware redirects to admin setup when users table is empty

**Reason:** The middleware no longer redirects to `/setup/admin` when the users table is empty. Instead, if no admin account exists (because environment variables were not set), users simply cannot log in as admin.

**Migration:** Ensure `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set before first deployment.

#### Scenario: Empty users table no longer triggers redirect

- **WHEN** the users table is empty and user navigates to `/login`
- **THEN** the middleware SHALL NOT redirect to `/setup/admin`
- **THEN** the login page SHALL render normally

## ADDED Requirements

### Requirement: Admin account seed from environment variables

The system SHALL read `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables at application startup. When both variables are present, the system SHALL upsert a user record in the SQLite users table with `role='admin'`. The password SHALL be hashed with bcryptjs at cost factor 10. If the email already exists in the users table, the system SHALL update the password hash and ensure the role is set to "admin". If either environment variable is missing, the seed function SHALL skip account creation and log a warning to console using `console.warn("ADMIN_EMAIL / ADMIN_PASSWORD 環境變數未設定，未建立管理員帳號")`.

#### Scenario: First startup with environment variables set

- **WHEN** the application starts with `ADMIN_EMAIL=admin@aire.com` and `ADMIN_PASSWORD=securepass`
- **THEN** the system SHALL create a user record: `{ email: "admin@aire.com", password_hash: bcrypt("securepass", 10), role: "admin" }`

##### Example: Seed creates admin record

- **GIVEN** users table is empty
- **GIVEN** `ADMIN_EMAIL=admin@aire.com` and `ADMIN_PASSWORD=MySecret123`
- **WHEN** application starts
- **THEN** users table contains one record: email="admin@aire.com", role="admin", password_hash is bcrypt hash of "MySecret123"

#### Scenario: Subsequent startup updates password

- **WHEN** the application starts with `ADMIN_EMAIL=admin@aire.com` and a different `ADMIN_PASSWORD` than what is stored
- **THEN** the system SHALL update the password hash for the existing admin record

##### Example: Password update on restart

- **GIVEN** users table has email="admin@aire.com" with old password hash
- **GIVEN** `ADMIN_PASSWORD=NewPassword456`
- **WHEN** application restarts
- **THEN** the password_hash for "admin@aire.com" is updated to bcrypt hash of "NewPassword456"

#### Scenario: Missing environment variables

- **WHEN** the application starts without `ADMIN_EMAIL` or without `ADMIN_PASSWORD`
- **THEN** the seed function SHALL skip account creation
- **THEN** the system SHALL log `console.warn("ADMIN_EMAIL / ADMIN_PASSWORD 環境變數未設定，未建立管理員帳號")`
- **THEN** the application SHALL still start normally

### Requirement: Seed function execution point

The admin seed function SHALL be called during Next.js application initialization via `instrumentation.ts` (Next.js Instrumentation API). The function SHALL be idempotent — safe to call on every application start.

#### Scenario: Seed runs on every startup

- **WHEN** the application starts
- **THEN** the seed function runs exactly once during initialization
- **THEN** no duplicate records are created if the admin already exists

##### Example: Idempotent seed on restart

- **GIVEN** users table already has email="admin@aire.com" with role="admin"
- **GIVEN** `ADMIN_EMAIL=admin@aire.com` and `ADMIN_PASSWORD=SamePass`
- **WHEN** application restarts
- **THEN** users table still has exactly one record for "admin@aire.com" (no duplicate)
