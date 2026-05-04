## ADDED Requirements

### Requirement: Admin creates agent accounts

The admin user SHALL be able to create new agent accounts with email, display name, and initial password.

#### Scenario: Create agent account

- **WHEN** admin submits the new user form with email "agent01@store.com", name "王小明", and password
- **THEN** system SHALL create a new user with role "agent" and is_active = true

##### Example: Successful creation

- **GIVEN** admin is logged in and on /admin/users
- **WHEN** admin fills email "wang@store.com", name "王小明", password "initial123" and clicks "建立"
- **THEN** users table SHALL contain a new row with email="wang@store.com", role="agent", is_active=1

### Requirement: Admin disables agent accounts

The admin user SHALL be able to deactivate an agent account, immediately blocking their access.

#### Scenario: Disable agent

- **WHEN** admin clicks "停用" on an active agent account
- **THEN** the agent's is_active SHALL be set to 0
- **THEN** any active session for that agent SHALL be invalidated immediately

##### Example: Immediate lockout

- **GIVEN** agent "王小明" is currently logged in with an active session
- **WHEN** admin disables "王小明"'s account
- **THEN** 王小明's next request SHALL be redirected to /login with message "帳號已停用，請聯繫管理員"

### Requirement: Admin resets agent password

The admin user SHALL be able to reset any agent's password without knowing the current password.

#### Scenario: Reset password

- **WHEN** admin clicks "重設密碼" for an agent and enters new password
- **THEN** the agent's password_hash SHALL be updated
- **THEN** all active sessions for that agent SHALL be invalidated

##### Example: Password reset

- **GIVEN** admin is on /admin/users and agent "王小明" exists
- **WHEN** admin clicks "重設密碼", enters "newpass456", and confirms
- **THEN** 王小明 must use "newpass456" to login next time
