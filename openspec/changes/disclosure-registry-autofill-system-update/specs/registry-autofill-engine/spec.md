# registry-autofill-engine Specification

## Purpose

Defines how registry, GIS, and public data populate disclosure drafts while preserving user-entered values and exposing gap reasons.

## ADDED Requirements

### Requirement: Autofill engine SHALL merge registry data into disclosure drafts without overwriting manual input

The autofill engine SHALL accept a disclosure draft, field-source matrix, service catalog, registry lookup results, and existing field metadata.

For each field, the engine SHALL output the final value, source metadata, confidence level, and one of the allowed automation states.

If a user has manually edited a field, the engine SHALL NOT overwrite that value automatically.

#### Scenario: Registry value fills an empty draft field

- **GIVEN** a land area field is empty in the disclosure draft
- **AND** registry lookup results contain a valid land area mapped by the field-source matrix
- **WHEN** the autofill engine runs
- **THEN** the output field value SHALL be the registry land area
- **AND** the field state SHALL be `filled_from_registry`
- **AND** source metadata SHALL include the service code that produced the value

#### Scenario: Manual value is preserved

- **GIVEN** a user has manually entered a building floor count
- **AND** registry lookup results contain a different floor count
- **WHEN** the autofill engine runs
- **THEN** the output field value SHALL remain the user-entered value
- **AND** source metadata SHALL expose the registry candidate as a non-applied suggestion

### Requirement: Autofill engine SHALL expose gap reasons for unfilled fields

For each unfilled field, the autofill engine SHALL return a machine-readable gap reason derived from the field-source matrix, service catalog, lookup outcome, and mapping status.

#### Scenario: Existing registry payload is not mapped

- **GIVEN** registry lookup results include an official field from a service response
- **AND** no field-source matrix mapping targets the disclosure field
- **WHEN** the autofill engine evaluates the field
- **THEN** the field state SHALL be `mapping_gap`
- **AND** the gap reason SHALL identify the service code and unmapped source field

#### Scenario: Required API is not integrated

- **GIVEN** the field-source matrix references a required service code
- **AND** the MOI service catalog marks that service as available
- **AND** no AIRE API client exists for that service
- **WHEN** the autofill engine evaluates the field
- **THEN** the field state SHALL be `integration_gap`
- **AND** the gap reason SHALL identify the missing client
