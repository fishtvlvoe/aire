## ADDED Requirements

### Requirement: Session guard with mock auth support

The session guard SHALL check authentication status via `get_session()` and redirect unauthenticated users to `/login`.

#### Scenario: Authenticated user accesses dashboard

- **GIVEN** `get_session` returns `{ authenticated: true, user: { email: "admin@test.aire", role: "admin" } }`
- **WHEN** the user navigates to any dashboard route
- **THEN** the page SHALL render normally

##### Example: Admin session active

- **GIVEN** mock session is authenticated as `admin@test.aire`
- **WHEN** user navigates to `/dashboard`
- **THEN** dashboard content is visible

#### Scenario: Unauthenticated user redirected

- **GIVEN** `get_session` returns `{ authenticated: false }`
- **WHEN** the user navigates to any dashboard route
- **THEN** the system SHALL redirect to `/login`

##### Example: No session

- **GIVEN** no user is logged in
- **WHEN** user navigates to `/dashboard`
- **THEN** browser redirects to `/login`

### Requirement: Development auto-login

- **WHEN** `NODE_ENV` equals `"development"` and no session exists
- **THEN** the session guard SHALL auto-login as `admin@test.aire` for development convenience

#### Scenario: Dev auto-login

- **GIVEN** `NODE_ENV` is `"development"` and `get_session` returns `{ authenticated: false }`
- **WHEN** the user navigates to a dashboard route
- **THEN** the system SHALL automatically call `login({ email: "admin@test.aire", password: "password" })`
- **THEN** the dashboard SHALL render without manual login

##### Example: Auto-login in dev

- **GIVEN** development environment, no active session
- **WHEN** user navigates to `/dashboard`
- **THEN** `login` is called automatically with dev credentials
- **THEN** dashboard renders with admin@test.aire session
