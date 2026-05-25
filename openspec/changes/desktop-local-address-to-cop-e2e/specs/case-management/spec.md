## ADDED Requirements

### Requirement: Create-case flow SHALL persist registry confirmation state

The create-case flow SHALL save address discovery diagnostics, candidate data, and confirmed registry match state before allowing formal COP lookup. Building cases SHALL require section, land number, and building number confirmation before formal pull. Land-only cases SHALL require section and land number and SHALL allow building number to remain empty.

#### Scenario: Manual confirmation after discovery failure

- **GIVEN** address discovery fails or is denied
- **WHEN** the user manually enters section, land number, and building number and creates the case
- **THEN** the case SHALL store `confirmed_registry_match`
- **AND** the system SHALL be able to use that confirmed key for formal COP pull.

#### Scenario: Unconfirmed candidate cannot trigger paid lookup

- **GIVEN** a case has candidate discovery data but no confirmed registry match
- **WHEN** formal COP lookup is requested
- **THEN** the request SHALL fail with `registry_match_required`
- **AND** no paid API call SHALL be created.
