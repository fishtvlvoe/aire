## ADDED Requirements

### Requirement: Async Tauri Environment Detection

The activation page SHALL use asynchronous detection to determine if it is running inside a Tauri WebView, by attempting to dynamically import @tauri-apps/api/core and checking if the invoke function is available.

#### Scenario: Tauri App Environment

- **WHEN** the activation page loads inside the Tauri desktop application
- **THEN** the serial key input form SHALL be displayed within 3 seconds

#### Scenario: Browser Environment

- **WHEN** the activation page loads in a standard web browser (no Tauri runtime)
- **THEN** the message "請在 AIRE 桌面 App 中開啟" SHALL be displayed after detection completes

#### Scenario: Detection Loading State

- **WHEN** the activation page is performing environment detection
- **THEN** a loading spinner SHALL be displayed (not the browser fallback message)

##### Example: Tauri Detection Timing

- **GIVEN** the Tauri 2.x IPC bridge is injected after page hydration
- **WHEN** the activation page calls isTauriEnv()
- **THEN** the function resolves to true within 3 seconds and the serial key form is rendered

### Requirement: Graceful IPC Fallback in Browser

All pages that call Tauri IPC commands SHALL use the safeInvoke wrapper from tauri-bridge.ts. When running outside Tauri, safeInvoke SHALL throw a NotInTauriError instead of a raw TypeError.

#### Scenario: Cases Page in Browser

- **WHEN** the /cases page loads in a browser without Tauri runtime
- **THEN** a friendly message "此功能需在 AIRE 桌面 App 中使用" SHALL be displayed instead of "Cannot read properties of undefined (reading 'invoke')"

#### Scenario: Branding Page in Browser

- **WHEN** the /settings/branding page loads in a browser without Tauri runtime
- **THEN** the same friendly fallback message SHALL be displayed

##### Example: Branding Page Fallback

- **GIVEN** a user opens http://localhost:3000/settings/branding in Chrome
- **WHEN** LogoUploader attempts to call safeInvoke("get_brand_settings")
- **THEN** NotInTauriError is caught and the TauriRequired component is rendered with the text "此功能需在 AIRE 桌面 App 中使用"

#### Scenario: Logs Page in Browser

- **WHEN** the /settings/logs page loads in a browser without Tauri runtime
- **THEN** the same friendly fallback message SHALL be displayed

##### Example: Error Type Check

- **GIVEN** a page component catches an error from safeInvoke
- **WHEN** the error is an instance of NotInTauriError
- **THEN** the component renders the TauriRequired component instead of the raw error message
