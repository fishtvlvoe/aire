# property-type-registry-coverage Specification

## Purpose

Defines how each AIRE property type declares registry coverage priorities, required fields, and manual-only fields.

## ADDED Requirements

### Requirement: Property types SHALL expose registry coverage profiles

Each property type SHALL expose a registry coverage profile that identifies required registry-backed fields, optional registry-backed fields, GIS/public-data fields, and manual-only fields.

The first required profiles SHALL cover `farmland`, `farmhouse`, and `townhouse`.

#### Scenario: Farmland profile includes land and control data

- **WHEN** the system reads the `farmland` registry coverage profile
- **THEN** the profile SHALL include land mark, land ownership, other rights, zoning or non-urban use controls, cadastral map evidence, announced current value, and announced land value as required or optional registry/public-data fields
- **AND** field-visit-only items such as irrigation or road condition SHALL be marked manual-only

#### Scenario: Farmhouse profile ties building and land requirements together

- **WHEN** the system reads the `farmhouse` registry coverage profile
- **THEN** the profile SHALL include building mark, building ownership, building other rights, land mark, land ownership, and legal farmhouse restriction indicators
- **AND** the profile SHALL identify which fields require cross-checking building and land data

#### Scenario: Townhouse profile separates registry-backed and field-visit fields

- **WHEN** the system reads the `townhouse` registry coverage profile
- **THEN** the profile SHALL include building mark, building ownership, building other rights, attached land, floor area, floor count, and use as registry-backed fields
- **AND** arcade, garage, mezzanine, top addition, and road-width observations SHALL be manual-only or field-visit fields

### Requirement: Coverage profile SHALL drive phased implementation priority

The system SHALL use property type coverage profiles to determine the order in which missing service integrations and field mappings are implemented.

Fields marked required for `farmland`, `farmhouse`, and `townhouse` SHALL be prioritized before optional fields for other property types.

#### Scenario: Required farmhouse integration is prioritized

- **GIVEN** the farmhouse coverage profile marks building ownership as required
- **AND** an optional apartment enrichment field is missing
- **WHEN** the implementation planner ranks missing registry work
- **THEN** the farmhouse building ownership work SHALL rank before the optional apartment enrichment field
