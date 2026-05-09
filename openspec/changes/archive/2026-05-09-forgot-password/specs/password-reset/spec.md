## ADDED Requirements

### Requirement: Password reset request via email

The system SHALL provide a POST /api/auth/forgot-password endpoint that accepts `{ email: string }` in the request body. The endpoint SHALL always return HTTP 200 with `{ message: "如果帳號存在，重設連結已發送至您的信箱" }` regardless of whether the email exists in the database. When the email exists in the users table, the system SHALL generate a JWT token signed with NEXTAUTH_SECRET containing `{ email, purpose: "password-reset" }` with a 15-minute expiration, and SHALL send an email via the toSend API with a reset link in the format `{NEXTAUTH_URL}/reset-password?token={jwt}`. When the email does not exist, the system SHALL NOT send any email and SHALL NOT reveal the non-existence in the response.

#### Scenario: Valid email triggers reset email

- **WHEN** POST /api/auth/forgot-password with `{ email: "user@example.com" }` and email exists in users table
- **THEN** system returns HTTP 200 `{ message: "如果帳號存在，重設連結已發送至您的信箱" }`
- **THEN** system sends email via toSend API containing a reset link with a JWT token

##### Example: Reset email sent

- **GIVEN** users table contains a row with email "agent@realty.com"
- **WHEN** POST /api/auth/forgot-password with `{ email: "agent@realty.com" }`
- **THEN** HTTP 200 returned
- **THEN** toSend API called with `{ from: TOSEND_FROM_EMAIL, to: "agent@realty.com", subject: "密碼重設 - AI 不動產系統" }`

#### Scenario: Non-existent email returns same response

- **WHEN** POST /api/auth/forgot-password with `{ email: "nobody@example.com" }` and email does not exist in users table
- **THEN** system returns HTTP 200 `{ message: "如果帳號存在，重設連結已發送至您的信箱" }`
- **THEN** system SHALL NOT call toSend API

#### Scenario: Missing email field

- **WHEN** POST /api/auth/forgot-password with empty body or missing email field
- **THEN** system returns HTTP 400 `{ error: "請輸入 Email" }`

### Requirement: Password reset confirmation with token

The system SHALL provide a POST /api/auth/reset-password endpoint that accepts `{ token: string, password: string }` in the request body. The endpoint SHALL verify the JWT token signature using NEXTAUTH_SECRET and check that the purpose field equals "password-reset". Upon successful verification, the system SHALL hash the new password using bcryptjs with cost factor 10 and update the corresponding user record in the SQLite users table. The endpoint SHALL return HTTP 200 `{ message: "密碼已重設，請重新登入" }` on success.

#### Scenario: Valid token and new password

- **WHEN** POST /api/auth/reset-password with a valid, unexpired token and `{ password: "newPass123" }`
- **THEN** system returns HTTP 200 `{ message: "密碼已重設，請重新登入" }`
- **THEN** user's password in the database is updated to bcryptjs hash of "newPass123"

##### Example: Successful password reset

- **GIVEN** JWT token signed with NEXTAUTH_SECRET, payload `{ email: "agent@realty.com", purpose: "password-reset" }`, issued 5 minutes ago, expires in 10 minutes
- **WHEN** POST /api/auth/reset-password with `{ token: "<valid-jwt>", password: "MyNewPass456" }`
- **THEN** HTTP 200 returned
- **THEN** users table row where email="agent@realty.com" has password_hash updated

#### Scenario: Expired token

- **WHEN** POST /api/auth/reset-password with a token that has expired (issued more than 15 minutes ago)
- **THEN** system returns HTTP 401 `{ error: "重設連結已過期，請重新申請" }`

##### Example: Token expired after 15 minutes

- **GIVEN** JWT token with exp set to 15 minutes after iat, and current time is 16 minutes after iat
- **WHEN** POST /api/auth/reset-password with this token
- **THEN** HTTP 401 `{ error: "重設連結已過期，請重新申請" }`

#### Scenario: Invalid or tampered token

- **WHEN** POST /api/auth/reset-password with a token that has an invalid signature or malformed payload
- **THEN** system returns HTTP 401 `{ error: "重設連結無效" }`

#### Scenario: Missing required fields

- **WHEN** POST /api/auth/reset-password with missing token or missing password
- **THEN** system returns HTTP 400 `{ error: "缺少必要欄位" }`

### Requirement: Forgot password page

The system SHALL provide a page at /forgot-password that displays a form with a single email input field and a submit button. Upon submission, the page SHALL call POST /api/auth/forgot-password and display a success message regardless of the API response. The page SHALL include a link back to /login.

#### Scenario: User submits forgot password form

- **WHEN** user navigates to /forgot-password and enters email and clicks submit
- **THEN** page calls POST /api/auth/forgot-password with the entered email
- **THEN** page displays "如果帳號存在，重設連結已發送至您的信箱"
- **THEN** page shows a link to return to /login

#### Scenario: Empty email submission

- **WHEN** user clicks submit without entering an email
- **THEN** page displays client-side validation error "請輸入 Email"

### Requirement: Reset password page

The system SHALL provide a page at /reset-password that reads a token query parameter from the URL. The page SHALL display a form with a new password input field and a confirm password input field. Upon submission, the page SHALL call POST /api/auth/reset-password with the token and new password. On success, the page SHALL display a success message and redirect to /login after 3 seconds.

#### Scenario: Valid token shows reset form

- **WHEN** user navigates to /reset-password?token=valid-jwt
- **THEN** page displays a password reset form with "新密碼" and "確認密碼" fields

#### Scenario: Successful password reset redirects to login

- **WHEN** user submits matching passwords on the reset form and API returns 200
- **THEN** page displays "密碼已重設，3 秒後將導向登入頁"
- **THEN** page redirects to /login after 3 seconds

#### Scenario: Password mismatch

- **WHEN** user enters different values in "新密碼" and "確認密碼" fields
- **THEN** page displays client-side validation error "兩次密碼不一致"

#### Scenario: Expired or invalid token

- **WHEN** user submits the form and API returns 401
- **THEN** page displays the error message from the API response

### Requirement: Email sending via toSend API

The system SHALL provide an email helper module at src/lib/email.ts that exports a sendPasswordResetEmail function. The function SHALL accept an email address and a reset URL, and SHALL call the toSend API at https://tosend.io/api/send with the TOSEND_API_KEY from environment variables. The sender address SHALL be read from the TOSEND_FROM_EMAIL environment variable. If the toSend API call fails, the function SHALL log the error via console.error and SHALL NOT throw an exception.

#### Scenario: Successful email send

- **WHEN** sendPasswordResetEmail is called with a valid email and reset URL
- **THEN** the function calls toSend API with correct headers and body
- **THEN** the function resolves without error

##### Example: toSend API call for password reset

- **GIVEN** TOSEND_API_KEY is "tsend_abc123" and TOSEND_FROM_EMAIL is "fish@aiver.me"
- **WHEN** sendPasswordResetEmail("agent@realty.com", "https://localhost:3000/reset-password?token=jwt123") is called
- **THEN** fetch is called with POST https://tosend.io/api/send, headers `{ Authorization: "Bearer tsend_abc123" }`, body `{ from: "fish@aiver.me", to: "agent@realty.com", subject: "密碼重設 - AI 不動產系統", text: contains "https://localhost:3000/reset-password?token=jwt123" }`

#### Scenario: toSend API failure

- **WHEN** sendPasswordResetEmail is called and the toSend API returns a non-2xx status
- **THEN** the function logs the error via console.error
- **THEN** the function resolves without throwing (silent failure)
