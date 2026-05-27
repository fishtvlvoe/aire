## ADDED Requirements

### Requirement: Address lookup UX

Address lookup SHALL run as a background data-completion step from the new case flow. The UI SHALL present only the user decision fields: address, section, land number, building number, confidence/needs-confirmation state and next action. The implementation SHALL keep R02 and other discovery source names internal, and source names SHALL NOT be part of the customer-facing workflow.

#### Scenario: Successful lookup returns confirmable fields

- **WHEN** the user enters a complete building address in the new case flow
- **THEN** the system SHALL resolve candidate section, land number and building number without calling paid formal registry lookup
- **AND** the UI SHALL display those fields for confirmation
- **AND** the run SHALL be recorded as zero-cost candidate discovery

#### Scenario: Lookup failure asks for manual completion

- **WHEN** the system cannot resolve candidate registry fields
- **THEN** the UI SHALL ask the user to manually fill the missing section, land number or building number
- **AND** the message SHALL be customer-readable
- **AND** the query record SHALL preserve internal diagnostics for support

### Requirement: Confirmed registry match gates formal lookup

Formal registry lookup SHALL require a confirmed registry match. Building cases SHALL require address, section, land number and building number. Land-only cases SHALL require section and land number and SHALL allow building number to be empty.

#### Scenario: Confirmed building match unlocks formal lookup

- **WHEN** the user confirms address, section, land number and building number for a building case
- **THEN** formal registry lookup SHALL become available
- **AND** the formal lookup SHALL use the confirmed registry key rather than raw address text

#### Scenario: Unconfirmed match blocks paid lookup

- **WHEN** a case has only candidate registry data
- **THEN** formal registry lookup SHALL return `registry_match_required`
- **AND** no paid call SHALL be created
