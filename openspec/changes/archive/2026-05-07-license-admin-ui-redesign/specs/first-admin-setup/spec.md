## ADDED Requirements

### Requirement: Setup wizard includes admin account creation step

The setup wizard SHALL consist of three sequential steps: Step 1 License activation (/setup), Step 2 Admin account creation (/setup/admin), Step 3 Codex API Key (/setup/codex). Step 2 SHALL only be accessible after Step 1 completes successfully.

#### Scenario: Navigate through three-step setup
- **WHEN** user completes license activation on /setup
- **THEN** the system redirects to /setup/admin

##### Example: Full setup sequence
- **GIVEN** fresh install with no license cache and no users in database
- **WHEN** user enters valid license key on /setup and clicks submit
- **THEN** browser redirects to /setup/admin showing admin account creation form

#### Scenario: Step 2 redirects back if license not activated
- **WHEN** user directly navigates to /setup/admin without completing Step 1
- **THEN** the system redirects to /setup

### Requirement: First admin account creation API

The system SHALL provide POST /api/setup/create-first-admin that creates the first admin user. This endpoint SHALL only succeed when the users table is empty. The created user SHALL have role "admin".

#### Scenario: Successful first admin creation
- **WHEN** users table is empty and request body is { email: "boss@company.tw", displayName: "陳老闆", password: "secure123" }
- **THEN** the system returns 201 with { success: true, user: { id: 1, email: "boss@company.tw", displayName: "陳老闆", role: "admin" } }

#### Scenario: Reject if admin already exists
- **WHEN** users table already has one or more records
- **THEN** the system returns 409 { error: "管理員帳號已存在" }

#### Scenario: Reject short password
- **WHEN** password is fewer than 6 characters
- **THEN** the system returns 400 { error: "密碼至少 6 字元" }

### Requirement: First admin setup page UI

The /setup/admin page SHALL display a form with three fields: email (required, email format), display name (required), and password (required, minimum 6 characters). A "建立管理員帳號" submit button SHALL trigger the API call.

#### Scenario: Form validation
- **WHEN** user submits with empty email field
- **THEN** the form shows inline validation error "請輸入 Email"

#### Scenario: Successful creation redirects to next step
- **WHEN** admin account is created successfully
- **THEN** the system redirects to /setup/codex

##### Example: Admin created then redirect
- **GIVEN** user filled email="boss@company.tw", displayName="陳老闆", password="secure123"
- **WHEN** user clicks "建立管理員帳號" and API returns 201
- **THEN** browser redirects to /setup/codex showing OpenAI API Key input form

### Requirement: Middleware redirects to admin setup when users table is empty

The middleware SHALL check if the users table is empty after license validation passes. If empty, all routes except /setup/admin and /api/setup/create-first-admin SHALL redirect to /setup/admin.

#### Scenario: License valid but no users
- **WHEN** license is valid and users table is empty and user navigates to /login
- **THEN** the system redirects to /setup/admin

##### Example: Redirect on empty users table
- **GIVEN** license-cache.json is valid (not expired) and SQLite users table has 0 rows
- **WHEN** user navigates to /login
- **THEN** middleware returns 302 redirect to /setup/admin

#### Scenario: License valid and users exist
- **WHEN** license is valid and users table has records
- **THEN** normal routing proceeds (no redirect to /setup/admin)

##### Example: Normal routing with existing admin
- **GIVEN** license-cache.json is valid and SQLite users table has 1 row (admin@local)
- **WHEN** user navigates to /login
- **THEN** middleware allows the request through to /login page (no redirect)
