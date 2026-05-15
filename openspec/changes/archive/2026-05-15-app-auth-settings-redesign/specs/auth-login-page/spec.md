## ADDED Requirements

### Requirement: Minimal login page layout

The login page SHALL display only:
- AIRE Logo (centered, top)
- Email text input
- Password text input (masked)
- "登入" button
- "忘記密碼" link (below button)

The login page SHALL NOT display any license activation UI, serial key input, or trial period messaging.

#### Scenario: Clean login page render

- **WHEN** the user navigates to `/login`
- **THEN** the page SHALL display AIRE Logo, Email input, Password input, Login button, and "忘記密碼" link
- **THEN** no license-related text or UI elements SHALL be present

##### Example: Login page elements

- **GIVEN** user visits `/login`
- **WHEN** the page renders
- **THEN** `document.querySelector('[data-testid="license-section"]')` returns `null`
- **THEN** `document.querySelector('[data-testid="login-form"]')` is present

#### Scenario: Successful login

- **GIVEN** mock user `admin@test.aire` with password `password`
- **WHEN** the user enters email `"admin@test.aire"` and password `"password"` and clicks "登入"
- **THEN** the system SHALL call `login({ email: "admin@test.aire", password: "password" })`
- **THEN** on success the system SHALL redirect to `/dashboard`

##### Example: Admin login

- **GIVEN** email input is `"admin@test.aire"`, password input is `"password"`
- **WHEN** user clicks "登入"
- **THEN** `login` returns `{ success: true, user: { email: "admin@test.aire", role: "admin" } }`
- **THEN** router navigates to `/dashboard`

#### Scenario: Failed login with invalid credentials

- **GIVEN** email `"wrong@example.com"` and password `"wrong"`
- **WHEN** the user clicks "登入"
- **THEN** the system SHALL display an error message "帳號或密碼錯誤"

##### Example: Wrong credentials

- **GIVEN** email input is `"wrong@example.com"`, password input is `"wrong"`
- **WHEN** user clicks "登入"
- **THEN** `login` throws `"INVALID_CREDENTIALS"`
- **THEN** error text "帳號或密碼錯誤" is visible

#### Scenario: Failed login with expired account

- **GIVEN** email `"expired@test.aire"` and password `"password"`
- **WHEN** the user clicks "登入"
- **THEN** the system SHALL display an error message "帳號已過期"

##### Example: Expired account

- **GIVEN** email input is `"expired@test.aire"`, password input is `"password"`
- **WHEN** user clicks "登入"
- **THEN** `login` throws `"ACCOUNT_EXPIRED"`
- **THEN** error text "帳號已過期" is visible

### Requirement: No trial period messaging

The login page and all related auth pages SHALL NOT contain any text referencing "30天", "30 天", "30日", "試用", or "trial".

#### Scenario: No trial text anywhere

- **WHEN** the login page renders
- **THEN** the rendered HTML SHALL NOT contain "30天", "30 天", "30日", "試用", or "trial"

##### Example: Text search

- **GIVEN** login page rendered
- **WHEN** searching page text content
- **THEN** none of ["30天", "30 天", "30日", "試用", "trial"] are found
