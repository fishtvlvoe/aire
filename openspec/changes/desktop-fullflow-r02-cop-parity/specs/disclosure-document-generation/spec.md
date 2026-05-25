## ADDED Requirements

### Requirement: Disclosure generation uses confirmed registry data

Formal disclosure document generation SHALL use confirmed registry data and stored formal lookup results. Candidate-only data SHALL be used for pre-survey/reference preview only and SHALL NOT enable formal PDF output.

#### Scenario: Confirmed lookup data generates formal PDF

- **WHEN** a case has confirmed registry fields and stored formal lookup results
- **THEN** the system SHALL allow formal PDF export
- **AND** PDF generation SHALL NOT create a new paid registry lookup

#### Scenario: Candidate-only data remains reference only

- **WHEN** a case only has candidate registry data
- **THEN** the system SHALL allow reference preview
- **AND** the system SHALL block formal PDF export
- **AND** the UI SHALL use customer-readable copy explaining that required property data still needs confirmation
