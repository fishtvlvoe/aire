# settings-page Specification

## ADDED Requirements

### Requirement: Acceptance verifies authorization status in settings

Release acceptance SHALL verify that system settings clearly show OO account, AIRE entitlement, trial or plan status, and customer COP credential status.

#### Scenario: Authorized customer opens settings

- **GIVEN** a user has an active AIRE entitlement
- **WHEN** the user opens system settings
- **THEN** the page SHALL show that AIRE is available
- **AND** it SHALL show the trial or plan status
- **AND** it SHALL show whether customer COP credentials are configured

#### Scenario: Customer COP credentials are missing

- **GIVEN** the user has AIRE access but no customer COP credential configured
- **WHEN** the user attempts a formal registry lookup
- **THEN** the lookup SHALL be blocked before a paid call
- **AND** settings SHALL guide the user to configure the customer COP credential
