## ADDED Requirements

### Requirement: login-form-display

The login page SHALL display a centered card containing the AIRE logo, the subtitle text, an email input field, a password input field, a login button labeled in Traditional Chinese, and a "forgot password" link.

#### Scenario: login page renders all elements

- **WHEN** the user navigates to /login
- **THEN** the page SHALL display the AIRE logo image from src/assets/icon-dark.png
- **THEN** the page SHALL display the subtitle text
- **THEN** the page SHALL display an email input with placeholder
- **THEN** the page SHALL display a password input with type=password
- **THEN** the page SHALL display a login button
- **THEN** the page SHALL display a "forgot password" link that opens an external URL

##### Example: login page initial state

- **GIVEN** the user is not authenticated
- **WHEN** the user navigates to /login
- **THEN** the email input SHALL be empty with placeholder "Email"
- **THEN** the password input SHALL be empty with type="password"
- **THEN** the login button SHALL display "登入"
- **THEN** the "forgot password" link SHALL display "忘記密碼？"

### Requirement: login-form-submission

The login page SHALL call safeInvoke("login", { email, password }) when the user submits the form with non-empty fields. On success, the page SHALL redirect to /cases. On failure, the page SHALL display an error message in Traditional Chinese.

#### Scenario: successful login

- **WHEN** the user enters a valid email and password and clicks the login button
- **THEN** the system SHALL call safeInvoke("login", { email, password })
- **THEN** on success response, the browser SHALL navigate to /cases

##### Example: admin login success

- **GIVEN** the user is on /login
- **WHEN** the user enters email "admin@test.aire" and password "password" and clicks "登入"
- **THEN** safeInvoke("login") returns { success: true, user: { email: "admin@test.aire", role: "admin" } }
- **THEN** the browser navigates to /cases

#### Scenario: failed login with invalid credentials

- **WHEN** the user enters an incorrect email or password and clicks the login button
- **THEN** the system SHALL display an error message "帳號或密碼錯誤，請重新輸入"

##### Example: wrong password

- **GIVEN** the user is on /login
- **WHEN** the user enters email "wrong@example.com" and password "wrong" and clicks "登入"
- **THEN** safeInvoke("login") throws Error with message "INVALID_CREDENTIALS"
- **THEN** the page displays error text "帳號或密碼錯誤，請重新輸入"

#### Scenario: failed login with expired account

- **WHEN** the user enters credentials for an expired account
- **THEN** the system SHALL display an error message "此帳號已過期，請聯繫客服"

##### Example: expired account

- **GIVEN** the user is on /login
- **WHEN** the user enters email "expired@test.aire" and password "password" and clicks "登入"
- **THEN** safeInvoke("login") throws Error with message "ACCOUNT_EXPIRED"
- **THEN** the page displays error text "此帳號已過期，請聯繫客服"

#### Scenario: empty field validation

- **WHEN** the user clicks the login button with empty email or password
- **THEN** the form SHALL display a validation error and SHALL NOT call safeInvoke

##### Example: empty email

- **GIVEN** the user is on /login with empty email field
- **WHEN** the user clicks "登入"
- **THEN** the page displays validation error "請輸入 Email"
- **THEN** safeInvoke is NOT called

### Requirement: login-redirect-if-authenticated

The login page SHALL redirect to /cases if the user is already authenticated when navigating to /login.

#### Scenario: already authenticated user visits login

- **WHEN** an authenticated user navigates to /login
- **THEN** the browser SHALL immediately redirect to /cases

##### Example: authenticated redirect

- **GIVEN** the user has a valid session (get_session returns authenticated: true)
- **WHEN** the user navigates to /login
- **THEN** the browser redirects to /cases without showing the login form
