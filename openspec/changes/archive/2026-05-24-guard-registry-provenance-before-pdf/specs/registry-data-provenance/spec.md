## ADDED Requirements

### Requirement: Registry payloads SHALL carry source provenance before PDF use

The system SHALL store registry data with source provenance before the data can be used for PDF generation.

#### Scenario: MOI API success is trusted

- **GIVEN** a land registry API result has `success = true`
- **WHEN** the user confirms saving the registry payload
- **THEN** the stored entry SHALL include `source = "moi_api"`
- **AND** `status = "success"`
- **AND** `trustedForPdf = true`

#### Scenario: Manual confirmed data is trusted

- **GIVEN** the user manually fills a missing registry-derived field
- **WHEN** the user confirms the manual entry
- **THEN** the stored entry SHALL include `source = "manual"`
- **AND** `status = "manual_confirmed"`
- **AND** `trustedForPdf = true`

### Requirement: Candidate and probe data SHALL NOT be trusted for PDF

The system SHALL treat public candidate identifiers, raw endpoint probes, mock payloads, and unknown-source payloads as not trusted for PDF generation.

#### Scenario: Public candidate is blocked

- **GIVEN** a registry entry has `source = "public_candidate"`
- **WHEN** the PDF assembler reads registry data
- **THEN** that entry SHALL NOT populate formal PDF fields

#### Scenario: Raw endpoint probe is blocked

- **GIVEN** a registry entry has `source = "raw_probe"`
- **WHEN** the PDF assembler reads registry data
- **THEN** that entry SHALL NOT populate formal PDF fields

#### Scenario: Unknown legacy payload is blocked

- **GIVEN** `land_registry_data` has no provenance schema
- **WHEN** the PDF assembler reads registry data
- **THEN** registry-derived formal PDF fields SHALL remain empty unless the data is a permitted legacy asset fallback

### Requirement: Live API evidence SHALL classify blocked states

The live MOI validation output SHALL classify successful trusted API results separately from unauthorized, failed, candidate, and probe data.

#### Scenario: Address lookup is unauthorized

- **GIVEN** `MOI_API_037` returns `COP317`
- **WHEN** the live validation writes its JSON summary
- **THEN** the summary SHALL count the address lookup as unauthorized
- **AND** SHALL NOT report it as a successful address-to-building lookup
