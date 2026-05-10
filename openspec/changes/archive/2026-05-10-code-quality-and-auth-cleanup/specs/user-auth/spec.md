## MODIFIED Requirements

### Requirement: User login with credentials
The system SHALL use next-auth 4.x Credentials Provider for user authentication. The system SHALL replace all legacy session management (including SESSION_COOKIE and getSessionUser) with next-auth integration. The system SHALL provide a unified auth resolver helper resolveCurrentUser(req) that extracts the user from the next-auth JWT token. The login page at src/app/login/page.tsx SHALL call next-auth signIn() instead of the custom /api/auth/login endpoint.

#### Scenario: Successful login via next-auth
- **WHEN** a user submits valid username and password on /login
- **THEN** the system SHALL authenticate via next-auth Credentials Provider
- **THEN** the system SHALL issue a JWT Access Token (15 minutes TTL) and a Refresh Token (7 days TTL)
- **THEN** the system SHALL redirect to /listings

#### Scenario: API authentication using unified resolver
- **WHEN** a GET request is made to /api/me with a valid next-auth JWT session
- **THEN** the system SHALL use resolveCurrentUser(req) to identify the user
- **THEN** the system SHALL return the user profile with status 200

## REMOVED Requirements

### Requirement: Legacy session management
**Reason**: Replaced by unified next-auth JWT authentication to avoid auth/session split issues.
**Migration**: Remove getSessionUser from src/lib/auth.ts and replace its usage in src/app/api/me/route.ts with resolveCurrentUser(req).

#### Scenario: Verify legacy session removal
- **WHEN** searching the codebase for getSessionUser or SESSION_COOKIE
- **THEN** no active functional code references SHALL be found in the application source
