## ADDED Requirements

### Requirement: Mock Dispatch in Browser Development Environment

safeInvoke SHALL dispatch to mockInvoke when isTauriEnv returns false AND process.env.NODE_ENV equals development. safeInvoke SHALL throw NotInTauriError when isTauriEnv returns false AND process.env.NODE_ENV does NOT equal development. safeInvoke SHALL call the real Tauri invoke when isTauriEnv returns true regardless of NODE_ENV. mockInvoke SHALL throw Error with message containing the command name for unrecognized commands.

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

### Requirement: Mock Store Command Coverage

MockStore SHALL handle all 22 IPC commands: get_license_status, activate_license, deactivate_license, check_license, list_cases, get_case, create_case, update_case, delete_case, mark_completed, export_pdf, save_draft, load_draft, list_recent_logs, get_brand_settings, save_brand_settings, upload_logo, get_logo, list_themes, get_clause, list_clauses, sync_clauses. MockStore SHALL initialize with seed data containing 2 example cases, 5 log entries, 3 legal clauses, and default brand settings with company name set to a test value. MockStore SHALL provide a reset method that restores all state to initial seed data. create_case SHALL generate a UUID as the case id and set status to draft with timestamps. activate_license SHALL accept any non-empty serial_key and set license status to valid. export_pdf SHALL return a mock file path string without performing file IO.

#### Scenario: Seed data available on initialization

- **WHEN** MockStore is first created
- **THEN** list_cases returns 2 cases and list_recent_logs returns 5 entries and list_clauses returns 3 clauses

#### Scenario: Case CRUD round-trip

- **WHEN** create_case is called with address and property_type
- **THEN** list_cases returns one additional case with status draft and a valid UUID id

##### Example: Case CRUD with address

- **GIVEN** MockStore initialized with 2 seed cases
- **WHEN** create_case is called with address "台北市大安區" and property_type "residential"
- **THEN** list_cases returns 3 items and the third case has address "台北市大安區" and status "draft"

#### Scenario: License activation with any serial key

- **WHEN** activate_license is called with serial_key set to any non-empty string
- **THEN** get_license_status returns status valid

##### Example: Activate with arbitrary key

- **GIVEN** MockStore with license status none
- **WHEN** activate_license is called with serial_key "ANY-KEY-WORKS"
- **THEN** get_license_status returns object with status "valid"

#### Scenario: Reset restores initial state

- **WHEN** cases are created and then reset is called
- **THEN** list_cases returns exactly 2 cases matching the original seed data

##### Example: create_case round-trip

- **GIVEN** MockStore initialized with 2 seed cases
- **WHEN** create_case is called with address equal to test-address and property_type equal to residential
- **THEN** list_cases returns 3 cases and the new case has status draft and property_type residential
