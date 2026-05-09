## MODIFIED Requirements

### Requirement: User login with credentials
The system SHALL use next-auth 4.x Credentials Provider for user authentication. The system SHALL replace the existing custom session management in src/lib/auth.ts with next-auth integration. The Auth.js handler SHALL be located at src/app/api/auth/[...nextauth]/route.ts. The session strategy SHALL be jwt. The login page at src/app/login/page.tsx SHALL call next-auth signIn() instead of the custom /api/auth/login endpoint. The login page SHALL display a "忘記密碼" link below the login button that navigates to /forgot-password.

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

#### Scenario: Forgot password link visible on login page
- **WHEN** user views the /login page
- **THEN** the page SHALL display a "忘記密碼" link
- **THEN** clicking the link SHALL navigate to /forgot-password
