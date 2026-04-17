## MODIFIED Requirements

### Requirement: Listing status machine supports 13 property types

The listing status machine SHALL support the property_type field accepting any of the 13 registered type identifiers.

The DB column `property_type` SHALL use TEXT type (not a restricted enum) to allow future type additions without migration. The application layer SHALL validate against the registered type list.

Status flow remains unchanged:
`draft` → `field-visit-complete` → `ready-for-generation` → `documents-ready`

#### Scenario: Create listing with farmland type

- **WHEN** a POST request is made to `/api/listings` with `property_type: "farmland"`
- **THEN** the system SHALL create a listing with status `draft`

#### Scenario: Reject unavailable type

- **WHEN** a POST request is made with `property_type: "storefront"` (not yet implemented)
- **THEN** the system SHALL return 422 with error `type-not-available`

#### Scenario: Reject unknown type

- **WHEN** a POST request is made with `property_type: "unknown-type"`
- **THEN** the system SHALL return 422 with error `invalid-property-type`
