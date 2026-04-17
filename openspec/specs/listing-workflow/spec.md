# listing-workflow

## Purpose

Defines the state machine and lifecycle for real estate listings in the three-stage workflow system.

## Requirements

### Requirement: Listing status machine supports 13 property types

The system SHALL manage listing status through the following states:
- `draft` — listing created, no field visit data
- `field-visit-complete` — business agent has submitted field visit data
- `ready-for-generation` — secretary has submitted supplementary data
- `documents-ready` — AI has generated all documents

The system SHALL support property_type as a string identifier corresponding to registered types in the property-type-registry.

#### Scenario: Status advances on field visit submission

- **WHEN** field visit data is saved for a listing
- **THEN** listing status SHALL change from `draft` to `field-visit-complete`

#### Scenario: Status advances on supplementary submission

- **WHEN** supplementary data is saved for a listing
- **THEN** listing status SHALL change from `field-visit-complete` to `ready-for-generation`

#### Scenario: Status advances on document generation

- **WHEN** all documents are successfully generated
- **THEN** listing status SHALL change from `ready-for-generation` to `documents-ready`
