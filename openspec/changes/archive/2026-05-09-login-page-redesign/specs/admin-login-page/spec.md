## ADDED Requirements

### Requirement: Admin login page at /admin/login

The system SHALL provide a dedicated admin login page at `/admin/login`. The page SHALL display a form with two fields: email (required) and password (required). The page title SHALL be "總管理員登入". The page SHALL NOT display any license key input field. The page SHALL NOT display any default credentials or hints.

#### Scenario: Successful admin login

- **WHEN** an admin user submits valid email and password on `/admin/login`
- **THEN** the system SHALL authenticate via NextAuth CredentialsProvider
- **THEN** the system SHALL verify the user has `role='admin'` in the users table
- **THEN** the system SHALL redirect to `/listings`

##### Example: Admin login success

- **GIVEN** user with email "admin@aire.com" and role "admin" exists in users table
- **WHEN** user submits email "admin@aire.com" and correct password on `/admin/login`
- **THEN** system issues JWT + Refresh Token and redirects to `/listings`

#### Scenario: Non-admin user attempts admin login

- **WHEN** a user with role other than "admin" submits credentials on `/admin/login`
- **THEN** the system SHALL return error "無管理員權限"
- **THEN** the system SHALL NOT issue any tokens

##### Example: Agent user rejected from admin login

- **GIVEN** user with email "agent@realty.com" and role "agent" exists in users table
- **WHEN** user submits email "agent@realty.com" and correct password on `/admin/login`
- **THEN** login page displays "無管理員權限"

#### Scenario: Invalid credentials on admin login

- **WHEN** a user submits incorrect email or password on `/admin/login`
- **THEN** the system SHALL return error "帳號或密碼錯誤"

### Requirement: Admin login API endpoint

The system SHALL provide `POST /api/admin/login` that accepts `{ email, password }`. The endpoint SHALL verify credentials via bcryptjs and check `role='admin'` in the users table. The endpoint SHALL NOT require a license key. On success, the endpoint SHALL create a NextAuth session and return `{ success: true }`. On failure, the endpoint SHALL return appropriate error codes (401 for wrong credentials, 403 for non-admin role).

#### Scenario: Admin API login success

- **WHEN** POST `/api/admin/login` with valid admin email and password
- **THEN** return 200 `{ success: true }`

#### Scenario: Admin API login wrong password

- **WHEN** POST `/api/admin/login` with valid admin email but wrong password
- **THEN** return 401 `{ error: "帳號或密碼錯誤" }`

#### Scenario: Admin API login non-admin role

- **WHEN** POST `/api/admin/login` with valid credentials but user role is not "admin"
- **THEN** return 403 `{ error: "無管理員權限" }`

### Requirement: Admin login link on customer login page

The customer login page at `/login` SHALL display a small text link "總管理員登入" below the login button. The link SHALL navigate to `/admin/login`. The link SHALL be styled as subtle secondary text (small font, muted color), not as a prominent button.

#### Scenario: Admin link visible on customer login page

- **WHEN** a user visits `/login`
- **THEN** below the login button, a small text link "總管理員登入" SHALL be visible
- **THEN** clicking the link SHALL navigate to `/admin/login`

##### Example: Link styling

- **GIVEN** user visits `/login`
- **WHEN** page renders
- **THEN** the "總管理員登入" link appears below the "登入" button in muted gray text (text-sm text-gray-500)
