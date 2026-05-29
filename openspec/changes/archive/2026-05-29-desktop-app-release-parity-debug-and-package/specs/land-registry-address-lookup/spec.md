## ADDED Requirements

### Requirement: Formal registry import SHALL reject mock and dev fixture sources

Formal registry import SHALL reject mock, dev fixture, public candidate, and raw probe sources as trusted formal registry data. Only real MOI API responses or explicit manual confirmation SHALL be eligible for trusted PDF data.

#### Scenario: Mock formal source is blocked

- **WHEN** formal registry import receives data with source `mock`
- **THEN** the import SHALL fail or remain untrusted
- **THEN** no trusted formal registry entry is written to the case

#### Scenario: Public candidate remains untrusted until formal pull

- **WHEN** address discovery provides a candidate parcel
- **THEN** the candidate SHALL remain available for candidate confirmation
- **THEN** the candidate SHALL NOT be treated as trusted formal registry data for PDF output

### Requirement: Formal registry import SHALL preserve confirmed target identity

Formal registry import SHALL use the confirmed registry key from the active case. The imported data SHALL be recorded against the confirmed section name, land number, and building number.

#### Scenario: Confirmed target is required before paid import

- **WHEN** a user attempts paid formal import without confirmed section name and land number
- **THEN** the system SHALL reject the import before charging or saving formal entries

#### Scenario: Imported data is associated with active case

- **WHEN** a formal import succeeds for a confirmed case
- **THEN** the registry query run and case provenance SHALL include the active case id and confirmed registry key
