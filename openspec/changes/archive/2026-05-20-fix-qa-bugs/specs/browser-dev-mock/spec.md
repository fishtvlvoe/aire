## MODIFIED Requirements

### Requirement: Mock Dispatch in Browser Development Environment

safeInvoke SHALL dispatch to mockInvoke when isTauriEnv returns false AND process.env.NODE_ENV equals development. safeInvoke SHALL throw NotInTauriError when isTauriEnv returns false AND process.env.NODE_ENV does NOT equal development. safeInvoke SHALL call the real Tauri invoke when isTauriEnv returns true regardless of NODE_ENV. mockInvoke SHALL throw Error with message containing the command name for unrecognized commands. mockInvoke SHALL NOT provide a handler for commands that proxy external HTTP connections (e.g., land API test connection); such operations SHALL bypass safeInvoke and call the relevant Next.js API route directly.

#### Scenario: Dev browser dispatches to mock

- **WHEN** isTauriEnv returns false and NODE_ENV is development
- **THEN** safeInvoke calls mockInvoke and returns mock data

##### Example: Dev browser get_license_status

- **GIVEN** isTauriEnv returns false and NODE_ENV is development
- **WHEN** safeInvoke is called with command get_license_status
- **THEN** mockInvoke returns an object with status field set to none

#### Scenario: Production browser throws NotInTauriError

- **WHEN** isTauriEnv returns false and NODE_ENV is production
- **THEN** safeInvoke throws NotInTauriError

##### Example: Production browser error

- **GIVEN** isTauriEnv returns false and NODE_ENV is production
- **WHEN** safeInvoke is called with command list_cases
- **THEN** NotInTauriError is thrown with message containing "AIRE 桌面 App"

#### Scenario: Tauri environment uses real invoke

- **WHEN** isTauriEnv returns true
- **THEN** safeInvoke calls the real Tauri invoke regardless of NODE_ENV

##### Example: Tauri invoke passthrough

- **GIVEN** isTauriEnv returns true and NODE_ENV is development
- **WHEN** safeInvoke is called with command get_license_status
- **THEN** the real Tauri invoke function is called with get_license_status

#### Scenario: Unknown command throws descriptive error

- **WHEN** mockInvoke receives a command name not in the handler registry
- **THEN** mockInvoke throws Error with message containing the unrecognized command name

##### Example: Unknown command error message

- **GIVEN** MockStore is initialized
- **WHEN** mockInvoke is called with command nonexistent_command
- **THEN** Error is thrown with message "Mock not implemented: nonexistent_command"

## ADDED Requirements

### Requirement: Mock store initializes all required data keys

`MockStorageAdapter` SHALL initialize `localStorage['aire-mock-store']` with all required top-level keys on first access: `license`, `sessionUser`, `appSettings`, `featureFlags`, `cases`, `branding`, `disclosures`, `keyin_data`. Missing keys SHALL be initialized to their zero values: `branding: null`, `disclosures: {}`, `keyin_data: {}`. The absence of these keys SHALL NOT cause unhandled errors in any component that reads from the mock store.

#### Scenario: Mock store has all required keys after initialization

- **WHEN** MockStorageAdapter is instantiated for the first time (empty localStorage)
- **THEN** `localStorage['aire-mock-store']` SHALL contain keys: `license`, `sessionUser`, `appSettings`, `featureFlags`, `cases`, `branding`, `disclosures`, `keyin_data`
- **THEN** `branding` SHALL be null
- **THEN** `disclosures` SHALL be an empty object `{}`
- **THEN** `keyin_data` SHALL be an empty object `{}`

#### Scenario: Existing mock store data preserved on re-initialization

- **WHEN** MockStorageAdapter is instantiated and `localStorage['aire-mock-store']` already exists with some keys
- **THEN** existing keys SHALL retain their values
- **THEN** only missing keys SHALL be initialized to zero values
