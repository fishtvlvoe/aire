## ADDED Requirements

### Requirement: Activation Page Mock Environment Behavior

The activation page SHALL display the serial key input form in development browser environment using mock backend instead of showing the desktop-only message. The activation page SHALL only show the desktop-only fallback message in production non-Tauri environment.

#### Scenario: Dev browser shows activation form

- **WHEN** user opens the activation page in development browser environment where isTauriEnv returns false
- **THEN** the page displays the serial key input form and submit button

##### Example: Dev activation form visibility

- **GIVEN** NODE_ENV is development and isTauriEnv returns false
- **WHEN** the activation page finishes loading
- **THEN** the serial key input field and the submit button labeled "啟動授權" are visible

#### Scenario: Dev browser activation completes via mock

- **WHEN** user enters a serial key and submits in development browser environment
- **THEN** activate_license is called via mockInvoke and on success the page redirects to dashboard

##### Example: Dev mock activation success

- **GIVEN** NODE_ENV is development and user is on activation page
- **WHEN** user types "TEST-KEY-123" and clicks submit
- **THEN** mockInvoke("activate_license") returns success and browser navigates to /cases

#### Scenario: Production browser shows fallback

- **WHEN** user opens the activation page in production non-Tauri environment
- **THEN** the page displays the message indicating AIRE desktop app is required

##### Example: Production fallback message

- **GIVEN** NODE_ENV is production and isTauriEnv returns false
- **WHEN** the activation page finishes loading
- **THEN** the text "請在 AIRE 桌面 App 中開啟" is displayed
