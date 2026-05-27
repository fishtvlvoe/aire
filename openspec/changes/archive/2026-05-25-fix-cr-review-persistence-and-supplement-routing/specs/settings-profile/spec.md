## ADDED Requirements

### Requirement: 個人設定儲存到資料層

The profile settings page SHALL persist editable account presentation settings in mock/browser mode.

#### Scenario: personal profile persists

- **GIVEN** the user opens `/settings`
- **WHEN** the user changes personal name or Email and saves
- **THEN** the app SHALL call the profile settings backend command
- **WHEN** the settings page remounts
- **THEN** the saved personal name and Email SHALL still be visible

#### Scenario: brand settings persist

- **GIVEN** the user opens `/settings`
- **WHEN** the user changes brand color or selects a Logo file and saves
- **THEN** the app SHALL call the profile settings backend command
- **WHEN** the settings page remounts
- **THEN** the saved brand color and Logo file name SHALL still be visible

#### Scenario: password update uses backend command

- **GIVEN** the user opens `/settings`
- **WHEN** the user submits a current password and a new password
- **THEN** the app SHALL call the password update backend command
- **THEN** the page SHALL show a saved status only after the command succeeds
