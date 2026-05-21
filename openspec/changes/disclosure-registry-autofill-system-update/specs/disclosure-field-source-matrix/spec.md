# disclosure-field-source-matrix Specification

## Purpose

Defines the authoritative matrix that maps every AIRE disclosure field to its source, automation state, service dependencies, and manual review reason.

## ADDED Requirements

### Requirement: Matrix SHALL classify every disclosure field by source and automation state

The system SHALL maintain a disclosure field-source matrix that includes every field used by residential, land, farmland, farmhouse, and townhouse disclosure workflows.

Each matrix row SHALL include `field_key`, `document_area`, `property_types`, `source_kind`, `automation_state`, `service_codes`, `required_for_completion`, and `review_note`.

Allowed `source_kind` values SHALL be `registry_api`, `gis_layer`, `public_data`, `field_visit`, `manual_document`, `derived`, and `unsupported`.

Allowed `automation_state` values SHALL be `filled_from_registry`, `mapping_gap`, `integration_gap`, `manual_required`, and `not_supported`.

#### Scenario: Registry-backed field is represented in the matrix

- **GIVEN** the building ownership field is required by the townhouse disclosure workflow
- **WHEN** the matrix is generated
- **THEN** the row for building ownership SHALL include `source_kind = registry_api`
- **AND** `service_codes` SHALL include the building ownership MOI service code
- **AND** `automation_state` SHALL be one of `filled_from_registry`, `mapping_gap`, or `integration_gap`

#### Scenario: Physical inspection field is represented as manual

- **GIVEN** a townhouse road width field requires on-site confirmation
- **WHEN** the matrix is generated
- **THEN** the row for road width SHALL include `source_kind = field_visit`
- **AND** `automation_state = manual_required`
- **AND** `review_note` SHALL explain that registry data cannot confirm the physical condition

### Requirement: Matrix SHALL identify blank-field gap reasons

For any disclosure draft field with no value, the system SHALL derive a gap reason from the matrix instead of treating the field as an undifferentiated blank.

Gap reasons SHALL distinguish at least: data already available but unmapped, required API not integrated, manual confirmation required, unsupported source, and successful lookup with no returned data.

#### Scenario: Blank field has an integration gap

- **GIVEN** a land legal restriction field has `source_kind = registry_api`
- **AND** its service code is present in the service catalog but no local API client exists
- **WHEN** the disclosure draft renders with no value for that field
- **THEN** the field status SHALL be `integration_gap`
- **AND** the UI-facing reason SHALL name the missing service code

#### Scenario: Blank field has a manual-required reason

- **GIVEN** a farmhouse farm-road condition field has `source_kind = field_visit`
- **WHEN** the disclosure draft renders with no value for that field
- **THEN** the field status SHALL be `manual_required`
- **AND** the UI-facing reason SHALL instruct that the value must come from field confirmation

### Requirement: Private owner identity SHALL be owner-provided and not reverse-looked-up

The system SHALL NOT classify private owner name, private owner national id, private owner birth date, or private owner address as reverse-look-up fields.

Private owner identity fields SHALL use `source_kind = manual_document` and `automation_state = manual_required` unless the value is extracted from a user-provided formal transcript, owner-provided document, OCR payload, or manual entry.

MOI ownership APIs SHALL be used for non-personal ownership status fields such as registration order, right scope, registration date, registration reason, ownership category, and public-owner information when legally returned.

MOI owner comparison APIs SHALL only verify a known owner name or id; they SHALL NOT be represented as a source for discovering an unknown private owner identity.

#### Scenario: Private owner name is manual document source

- **GIVEN** the residential disclosure workflow contains a private owner name field
- **WHEN** the field-source matrix is generated
- **THEN** the private owner name row SHALL use `source_kind = manual_document`
- **AND** `automation_state = manual_required`
- **AND** `review_note` SHALL state that the value must come from owner-provided data, a formal transcript/OCR, or manual entry

#### Scenario: Owner comparison service is not a reverse lookup source

- **GIVEN** a matrix row references owner verification by known name
- **WHEN** the matrix is generated
- **THEN** the row SHALL reference the owner comparison service only as a validation service when a known owner name or id is already available
- **AND** the row SHALL NOT mark that service as a source for discovering unknown private owner name
