## ADDED Requirements

### Requirement: dashboard-auth-guard

The dashboard layout SHALL check the user's authentication status on mount. If the user is not authenticated, the layout SHALL redirect to /login. If authenticated, the layout SHALL render the dashboard content.

#### Scenario: unauthenticated user redirected

- **WHEN** an unauthenticated user navigates to any dashboard route
- **THEN** the layout SHALL redirect the browser to /login

##### Example: unauthenticated visits cases

- **GIVEN** get_session returns { authenticated: false }
- **WHEN** the user navigates to /cases
- **THEN** the browser redirects to /login

#### Scenario: authenticated user sees dashboard

- **WHEN** an authenticated user navigates to a dashboard route
- **THEN** the layout SHALL render the sidebar, topbar, and page content

##### Example: authenticated visits cases

- **GIVEN** get_session returns { authenticated: true, user: { email: "admin@test.aire", role: "admin" } }
- **WHEN** the user navigates to /cases
- **THEN** the dashboard renders with sidebar, topbar, and cases page content

### Requirement: logout-action

The dashboard SHALL provide a logout mechanism that calls safeInvoke("logout") and redirects to /login.

#### Scenario: user logs out

- **WHEN** the user triggers the logout action
- **THEN** the system SHALL call safeInvoke("logout")
- **THEN** the browser SHALL redirect to /login

##### Example: logout from dashboard

- **GIVEN** the user is authenticated and on /cases
- **WHEN** the user clicks the logout button in the topbar
- **THEN** safeInvoke("logout") is called and returns { success: true }
- **THEN** the browser redirects to /login
