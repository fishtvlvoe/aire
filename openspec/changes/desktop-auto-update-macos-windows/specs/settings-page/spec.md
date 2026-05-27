# settings-page Specification

## ADDED Requirements

### Requirement: System settings owns entitlement and authorization

System settings SHALL own product status, authorization status, customer COP credential status, and desktop update status.

#### Scenario: User opens settings after desktop update support is enabled

- **GIVEN** the user has access to AIRE Desktop
- **WHEN** the user opens system settings
- **THEN** the settings page SHALL show the current app version
- **AND** it SHALL show the last update check time when available
- **AND** it SHALL provide a manual update check action
- **AND** it SHALL keep trial, plan, authorization, and credential status in settings instead of query records

### Requirement: Customer UI hides update internals

Customer-facing settings UI SHALL use task language for update states and SHALL hide engineering implementation terms.

#### Scenario: Update check fails

- **GIVEN** the update check fails
- **WHEN** the user views the update section
- **THEN** the visible message SHALL say that the update check failed and can be retried
- **AND** it SHALL NOT display the words Tauri, manifest, signature, GitHub Releases, endpoint, payload, or JSON in the default customer view
