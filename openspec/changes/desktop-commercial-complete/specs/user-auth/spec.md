## MODIFIED Requirements

### Requirement: User login with credentials
The system SHALL use next-auth 4.x Credentials Provider for user authentication. The system SHALL replace the existing custom session management in src/lib/auth.ts with next-auth integration. The Auth.js handler SHALL be located at src/app/api/auth/[...nextauth]/route.ts. The session strategy SHALL be jwt. The login page at src/app/login/page.tsx SHALL call next-auth signIn() instead of the custom /api/auth/login endpoint.

#### Scenario: Successful login via next-auth
- **WHEN** a user submits valid username and password on /login
- **THEN** the system SHALL authenticate via next-auth Credentials Provider
- **THEN** the system SHALL issue a JWT Access Token (15 minutes TTL) and a Refresh Token (7 days TTL)
- **THEN** the system SHALL redirect to /listings

#### Scenario: Failed login
- **WHEN** a user submits invalid credentials
- **THEN** the system SHALL display an error message on the login page
- **THEN** the system SHALL NOT issue any tokens

##### Example: Wrong password login attempt
- **GIVEN** user "admin" exists with password hash for "correct123"
- **WHEN** user submits username "admin" and password "wrong456" on /login
- **THEN** the login page displays "帳號或密碼錯誤"
- **THEN** no JWT cookie is set in the response

### Requirement: Dual token mechanism
The system SHALL implement a dual token mechanism: a short-lived JWT Access Token (15 minutes) managed by next-auth, and a long-lived Refresh Token (7 days) stored as a SHA-256 hash in the SQLite refresh_tokens table. The Refresh Token SHALL be delivered as an HttpOnly, Secure, SameSite=Strict cookie. The refresh endpoint SHALL be located at src/app/api/auth/refresh/route.ts.

#### Scenario: Access token expired, refresh token valid
- **WHEN** a request is made with an expired Access Token and a valid Refresh Token cookie
- **THEN** the system SHALL revoke the old Refresh Token in the database
- **THEN** the system SHALL issue a new Access Token and a new Refresh Token
- **THEN** the system SHALL set the new Refresh Token as an HttpOnly cookie

##### Example: Token refresh cycle
- **GIVEN** Access Token issued at 10:00 (expires 10:15) and Refresh Token RT-001 (expires in 7 days)
- **WHEN** a request arrives at 10:20 with expired Access Token and valid RT-001 cookie
- **THEN** POST /api/auth/refresh revokes RT-001 in DB (revoked=1)
- **THEN** a new Access Token (expires 10:35) and new RT-002 are issued
- **THEN** RT-002 is set as HttpOnly Secure SameSite=Strict cookie

#### Scenario: Both tokens expired
- **WHEN** a request is made with an expired Access Token and an expired or revoked Refresh Token
- **THEN** the system SHALL redirect to /login

##### Example: Fully expired session
- **GIVEN** Access Token expired 2 hours ago and Refresh Token RT-001 expired 1 day ago
- **WHEN** a request arrives to /listings
- **THEN** middleware redirects to /login with HTTP 302

### Requirement: Auth middleware order
The system SHALL execute auth checks in src/middleware.ts after the license check passes. The middleware SHALL use next-auth getToken() to verify the JWT Access Token. When the token is missing or invalid, the middleware SHALL redirect to /login.

#### Scenario: Authenticated request passes
- **WHEN** a request has a valid license and a valid JWT Access Token
- **THEN** the middleware SHALL allow the request to proceed to the route handler

##### Example: Valid auth request to listings
- **GIVEN** license is valid (cached) and JWT contains {sub: "admin", exp: future}
- **WHEN** GET /listings is requested
- **THEN** middleware passes through, listings page renders

#### Scenario: Unauthenticated request redirects
- **WHEN** a request has a valid license but no JWT or an invalid JWT
- **THEN** the middleware SHALL redirect to /login with HTTP 302

#### Scenario: Auth-exempt paths
- **WHEN** the request path matches /login, /api/auth/*, /setup/*, /api/setup/*, /_next/*, or /favicon.ico
- **THEN** the middleware SHALL skip the auth check

##### Example: Login page accessible without auth
- **GIVEN** no JWT cookie present
- **WHEN** GET /login is requested
- **THEN** middleware skips auth check, login page renders normally

### Requirement: Password storage
The system SHALL hash passwords with bcryptjs at cost factor 12. User records SHALL be stored in the SQLite users table with columns: id, username, password_hash, created_at.

#### Scenario: New user creation
- **WHEN** a new user is created via scripts/create-admin.ts
- **THEN** the password SHALL be hashed with bcryptjs cost 12
- **THEN** the record SHALL be inserted into the users table

### Requirement: Admin account creation CLI
The system SHALL provide scripts/create-admin.ts that accepts --username and --password arguments. The script SHALL hash the password with bcryptjs (cost 12) and insert into the users table. If the username already exists, the script SHALL exit with code 1 and print an error message.

#### Scenario: Create admin successfully
- **WHEN** running tsx scripts/create-admin.ts --username admin --password secret123
- **THEN** the script SHALL create a user record with bcrypt-hashed password
- **THEN** the script SHALL print the created username and exit with code 0

#### Scenario: Duplicate username
- **WHEN** running the script with a username that already exists
- **THEN** the script SHALL print "Username already exists" and exit with code 1
