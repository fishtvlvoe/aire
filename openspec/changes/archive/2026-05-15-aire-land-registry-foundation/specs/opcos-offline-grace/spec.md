## ADDED Requirements

### Requirement: Successful OPCOS verifications SHALL be persisted with timestamp
The crate SHALL persist `last_verified_at` and `last_verified_serial` in the `opcos_offline_state` table on every successful online serial verification.

#### Scenario: Successful verification updates state
- **WHEN** the App boots and OPCOS responds 200 to the serial verification call
- **THEN** the `opcos_offline_state` row SHALL be updated with `last_verified_at = synced_now()` and `last_verified_serial = <serial>`

### Requirement: Offline boots SHALL be permitted within a 7-day grace window
If the OPCOS verification call fails due to network or 5xx errors, the App SHALL allow boot when `synced_now() - last_verified_at <= 7 days`, surfacing the offline state via a boolean flag the UI can read. After 7 days, the App SHALL NOT proceed past the activation screen.

#### Scenario: Offline boot inside grace window
- **GIVEN** `last_verified_at` is 3 days before `synced_now()` and OPCOS is unreachable
- **WHEN** the App starts up
- **THEN** the App SHALL boot successfully
- **AND** `offline_grace::status()` SHALL return `Active { days_remaining: 4 }`

#### Scenario: Offline boot past grace window
- **GIVEN** `last_verified_at` is 8 days before `synced_now()` and OPCOS is unreachable
- **WHEN** the App starts up
- **THEN** the App SHALL halt at the activation screen and SHALL return `LandRegistryError::GracePeriodExpired`

### Requirement: Grace period SHALL use time-synced now, never raw system clock
Day arithmetic for the grace window SHALL use `time_sync::synced_now()` so that a client who manually advances their system clock cannot extend their offline window.

#### Scenario: System clock advanced does not extend grace
- **GIVEN** `last_verified_at` is 6 days before `synced_now()` and the local wall clock has been moved forward by 30 days
- **WHEN** the App starts up
- **THEN** grace status SHALL still be computed from `synced_now() - last_verified_at = 6 days`
- **AND** the App SHALL boot in grace mode, not flag the clock advance as expiry
