## ADDED Requirements

### Requirement: Brand settings SHALL show persisted upload state

Brand settings SHALL let the user upload a logo and SHALL show the selected filename, preview or readable upload state, and persisted state after saving. Refreshing the page SHALL NOT make a successfully saved logo appear as if nothing was selected.

#### Scenario: User uploads a logo

- **GIVEN** the user opens brand settings
- **WHEN** the user selects and saves a logo file
- **THEN** the page SHALL show the selected filename
- **AND** it SHALL show a preview or readable saved state
- **AND** the saved state SHALL remain visible after page refresh.

### Requirement: Settings navigation SHALL expose brand settings and audit log only

The system settings navigation SHALL expose brand settings and audit log as the primary settings destinations. General settings and personal settings SHALL NOT be mixed into the same system settings tab group.

#### Scenario: User opens system settings

- **WHEN** the user opens system settings
- **THEN** the navigation SHALL show brand settings and audit log as customer-readable destinations
- **AND** it SHALL NOT require the user to choose between overlapping general settings, personal settings, and brand delivery labels.

##### Example: settings destinations

- **GIVEN** the settings navigation contains system-level destinations
- **WHEN** the user opens the settings area
- **THEN** the visible destinations SHALL be `品牌設定` and `操作日誌`
- **AND** labels such as `一般設定`, `個人設定`, and `品牌與交付資訊` SHALL NOT appear in the system-level destination list.

### Requirement: Plan settings SHALL show account role and license state

Plan settings SHALL show the current account identity, account role, plan name, and authorization state. Trial accounts SHALL show the trial expiration date. Perpetual or buyout accounts SHALL show lifetime authorization or equivalent perpetual license language.

#### Scenario: Trial account opens plan settings

- **GIVEN** the current account is a trial account
- **WHEN** the user opens plan settings
- **THEN** the page SHALL show account identity, role, plan name, authorization state, and trial expiration date.

#### Scenario: Perpetual account opens plan settings

- **GIVEN** the current account has a perpetual or buyout license
- **WHEN** the user opens plan settings
- **THEN** the page SHALL show account identity, role, plan name, authorization state, and lifetime authorization or equivalent perpetual license language.
