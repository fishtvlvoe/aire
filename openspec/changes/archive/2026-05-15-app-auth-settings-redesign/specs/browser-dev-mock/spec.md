## ADDED Requirements

### Requirement: mock-auth-commands

The mock backend SHALL support 3 auth-related commands: login, logout, and get_session. The login command SHALL validate against a fixed test account table.

#### Scenario: mock login with valid credentials

- **WHEN** mockInvoke("login", { email, password }) is called with a valid test account
- **THEN** the mock SHALL return { success: true, user: { email, role } }
- **THEN** the mock SHALL store the session in memory

##### Example: admin login

- **GIVEN** the mock test account table contains { email: "admin@test.aire", password: "password", role: "admin" }
- **WHEN** mockInvoke("login", { email: "admin@test.aire", password: "password" }) is called
- **THEN** returns { success: true, user: { email: "admin@test.aire", role: "admin" } }

#### Scenario: mock login with invalid credentials

- **WHEN** mockInvoke("login", { email, password }) is called with credentials not in the test table
- **THEN** the mock SHALL throw Error with message "INVALID_CREDENTIALS"

##### Example: wrong credentials

- **GIVEN** email "wrong@example.com" is not in the test account table
- **WHEN** mockInvoke("login", { email: "wrong@example.com", password: "wrong" }) is called
- **THEN** throws Error("INVALID_CREDENTIALS")

#### Scenario: mock login with expired account

- **WHEN** mockInvoke("login") is called with an expired test account
- **THEN** the mock SHALL throw Error with message "ACCOUNT_EXPIRED"

##### Example: expired account login

- **GIVEN** the test account table contains { email: "expired@test.aire", password: "password", status: "expired" }
- **WHEN** mockInvoke("login", { email: "expired@test.aire", password: "password" }) is called
- **THEN** throws Error("ACCOUNT_EXPIRED")

#### Scenario: mock get_session when authenticated

- **WHEN** mockInvoke("get_session") is called after a successful login
- **THEN** returns { authenticated: true, user: { email, role } }

##### Example: session after login

- **GIVEN** the user logged in as admin@test.aire
- **WHEN** mockInvoke("get_session") is called
- **THEN** returns { authenticated: true, user: { email: "admin@test.aire", role: "admin" } }

#### Scenario: mock get_session when not authenticated

- **WHEN** mockInvoke("get_session") is called without prior login
- **THEN** returns { authenticated: false }

##### Example: no session

- **GIVEN** no login has occurred
- **WHEN** mockInvoke("get_session") is called
- **THEN** returns { authenticated: false }

### Requirement: mock-app-settings-commands

The mock backend SHALL support get_app_settings and save_app_settings commands for managing license, land API, and premium settings.

#### Scenario: get default app settings

- **WHEN** mockInvoke("get_app_settings") is called without prior save
- **THEN** returns default settings with license status none, empty land API, and premiumUnlocked false

##### Example: default settings

- **GIVEN** fresh mock store
- **WHEN** mockInvoke("get_app_settings") is called
- **THEN** returns { license: { status: "none", serialKey: null }, landApi: { clientId: "", secret: "" }, premiumUnlocked: false }

#### Scenario: save and retrieve app settings

- **WHEN** mockInvoke("save_app_settings", data) is called
- **THEN** the settings SHALL be merged and persisted
- **THEN** subsequent get_app_settings SHALL return the updated values

##### Example: save land API credentials

- **GIVEN** the user saves land API settings
- **WHEN** mockInvoke("save_app_settings", { landApi: { clientId: "c1", secret: "s1" } }) is called
- **THEN** returns { success: true }
- **THEN** mockInvoke("get_app_settings") returns { landApi: { clientId: "c1", secret: "s1" }, ... }

### Requirement: mock-localstorage-persistence

The mock backend SHALL serialize its state to localStorage after each command invocation and deserialize on initialization. If localStorage is unavailable, the mock SHALL fall back to in-memory only without error.

#### Scenario: state persists across page reload

- **WHEN** the user logs in via mock and reloads the page
- **THEN** the mock SHALL restore the session from localStorage
- **THEN** get_session SHALL return authenticated: true

##### Example: login persists

- **GIVEN** the user logged in as admin@test.aire
- **WHEN** the page reloads (MockStore re-initializes)
- **THEN** MockStore reads localStorage key "aire-mock-store"
- **THEN** get_session returns { authenticated: true, user: { email: "admin@test.aire", role: "admin" } }

#### Scenario: localStorage unavailable fallback

- **WHEN** localStorage throws an error (e.g., private browsing mode)
- **THEN** the mock SHALL operate in memory-only mode
- **THEN** no error SHALL be thrown to the caller

##### Example: private browsing

- **GIVEN** localStorage.getItem throws DOMException
- **WHEN** MockStore initializes
- **THEN** MockStore uses default seed data without error
