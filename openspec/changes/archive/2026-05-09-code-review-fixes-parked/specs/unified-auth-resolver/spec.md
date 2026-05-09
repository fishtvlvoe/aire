## ADDED Requirements

### Requirement: Resolve current user from NextAuth JWT

The system SHALL provide a `resolveCurrentUser(req)` function that extracts the authenticated user from the NextAuth JWT token in the request.

#### Scenario: Valid NextAuth JWT present

- **WHEN** a request contains a valid NextAuth JWT cookie
- **THEN** the function returns the corresponding DB user record (id, username, email, role)

#### Scenario: No auth token present

- **WHEN** a request has no NextAuth JWT cookie and no legacy session_id cookie
- **THEN** the function returns null

#### Scenario: Legacy session_id cookie present

- **WHEN** a request has only a legacy session_id cookie (no JWT)
- **THEN** the function returns null (legacy auth path is deprecated)

### Requirement: All API routes use unified auth

Every API route that requires authentication SHALL call `resolveCurrentUser(req)` instead of reading `SESSION_COOKIE` or calling `getSessionUser`.

#### Scenario: Admin API after NextAuth login

- **WHEN** an admin user logs in via NextAuth and calls GET /api/admin/users
- **THEN** the route resolves the admin user and returns 200

#### Scenario: Agent listing API after NextAuth login

- **WHEN** an agent logs in via NextAuth and calls GET /api/listings
- **THEN** the route resolves the agent user and returns only their owned listings
