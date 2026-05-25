# land-registry-billing-log Specification

## ADDED Requirements

### Requirement: Registry acceptance evidence includes billing and cache records

Registry acceptance SHALL prove that paid calls, cache hits, failed calls, and PDF output are traceable.

#### Scenario: Same property is queried twice

- **GIVEN** a property has already completed formal registry lookup
- **WHEN** the same confirmed registry key is queried again
- **THEN** the second run SHALL be recorded as a cache hit
- **AND** the second run SHALL have zero additional registry API cost
- **AND** the second run SHALL point to the original source run

#### Scenario: PDF is generated after lookup

- **GIVEN** a saved formal lookup JSON exists for a case
- **WHEN** the user generates a PDF
- **THEN** the PDF SHALL use the saved JSON
- **AND** PDF generation SHALL NOT create a new paid registry lookup

#### Scenario: Registry call fails

- **GIVEN** a formal registry lookup fails because credentials or registry data are invalid
- **WHEN** the error is recorded
- **THEN** the query record SHALL include an error log entry
- **AND** the acceptance report SHALL reference the error evidence
