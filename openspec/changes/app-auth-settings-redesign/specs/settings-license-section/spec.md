## ADDED Requirements

### Requirement: License status display

The Settings page SHALL display a LicenseSection card as the first section.

- **WHEN** the user navigates to the Settings page
- **THEN** the system SHALL display the current license status as a Badge:
  - `"none"` → grey Badge with text "尚未啟用授權"
  - `"valid"` → green Badge with text "已啟用" and the serial key masked
  - `"expired"` → red Badge with text "授權已過期"

#### Scenario: License not activated

- **WHEN** the license status is `"none"`
- **THEN** the system SHALL display a text input for the serial key and an "啟用授權" button
- **THEN** the "停用授權" button SHALL NOT be visible

##### Example: No license state

- **GIVEN** mock `get_license_status` returns `{ status: "none" }`
- **WHEN** Settings page renders the LicenseSection
- **THEN** Badge text is "尚未啟用授權" with grey color
- **THEN** serial key input is empty and enabled
- **THEN** "啟用授權" button is visible and enabled

#### Scenario: License activated successfully

- **GIVEN** the license status is `"none"`
- **WHEN** the user enters serial key `"AIRE-TEST-VALID-001"` and clicks "啟用授權"
- **THEN** the system SHALL call `activate_license({ serial_key: "AIRE-TEST-VALID-001" })`
- **THEN** the system SHALL display a success toast "授權已啟用"
- **THEN** the Badge SHALL update to green "已啟用"

##### Example: Successful activation

- **GIVEN** serial key input contains `"AIRE-TEST-VALID-001"`
- **WHEN** user clicks "啟用授權"
- **THEN** `activate_license` returns `{ success: true }`
- **THEN** `check_license` returns `{ status: "valid" }`

#### Scenario: License activation fails with invalid key

- **GIVEN** the license status is `"none"`
- **WHEN** the user enters an invalid serial key `"INVALID-KEY"` and clicks "啟用授權"
- **THEN** the system SHALL display an error message "序號無效，請確認後重試"

##### Example: Invalid key rejection

- **GIVEN** serial key input contains `"INVALID-KEY"`
- **WHEN** user clicks "啟用授權"
- **THEN** `activate_license` throws error
- **THEN** error message "序號無效，請確認後重試" is displayed below the input

### Requirement: License deactivation with confirmation

- **WHEN** the user clicks "停用授權"
- **THEN** the system SHALL display a confirmation AlertDialog

#### Scenario: User confirms deactivation

- **GIVEN** the license status is `"valid"`
- **WHEN** the user clicks "停用授權" and confirms in the AlertDialog
- **THEN** the system SHALL call `deactivate_license()`
- **THEN** the Badge SHALL update to grey "尚未啟用授權"
- **THEN** a toast "授權已停用" SHALL be displayed

##### Example: Deactivation confirmed

- **GIVEN** `check_license` returns `{ status: "valid" }`
- **WHEN** user clicks "停用授權" then clicks "確定" in dialog
- **THEN** `deactivate_license` returns `{ success: true }`
- **THEN** `get_license_status` returns `{ status: "none" }`

#### Scenario: User cancels deactivation

- **GIVEN** the license status is `"valid"`
- **WHEN** the user clicks "停用授權" and cancels in the AlertDialog
- **THEN** the license status SHALL remain `"valid"` unchanged
