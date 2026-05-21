# property-type-registry Specification

## MODIFIED Requirements

### Requirement: Property type registry defines 13 types

The system SHALL define a registry of 13 property types, each with a unique kebab-case identifier, a display name in Traditional Chinese, a category, a field schema reference, and a registry coverage profile reference.

The 13 types SHALL remain:

- `farmland` (農地) — land
- `townhouse` (透天別墅) — building
- `apartment` (公寓) — building
- `highrise` (大樓華廈) — building
- `residential-land` (建地/住宅地) — land
- `farmhouse` (農舍) — building
- `studio` (套房) — building
- `storefront` (店面) — building
- `factory` (廠房) — building
- `industrial-land` (工業地) — land
- `commercial-land` (商業地) — land
- `village-land` (鄉村區建地) — land
- `other-land` (其他土地) — land

#### Scenario: Retrieve display name for a type

- **WHEN** the system looks up display name for `farmland`
- **THEN** it SHALL return `農地`

#### Scenario: Determine category for a type

- **WHEN** the system looks up category for `townhouse`
- **THEN** it SHALL return `building`

#### Scenario: Retrieve registry coverage profile for a priority type

- **WHEN** the system looks up registry coverage profile for `farmhouse`
- **THEN** it SHALL return a profile reference
- **AND** the referenced profile SHALL define required registry-backed fields and manual-only fields
