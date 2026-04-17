## ADDED Requirements

### Requirement: Property type registry defines 13 types

The system SHALL define a registry of 13 property types, each with a unique kebab-case identifier, a display name in Traditional Chinese, a category (building or land), and a field schema reference.

The 13 types SHALL be:
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

### Requirement: First version implements 6 priority types

The system SHALL fully implement field schemas for 6 priority types: `farmland`, `townhouse`, `apartment`, `highrise`, `residential-land`, `farmhouse`.

The remaining 7 types SHALL be registered in the registry but their field schemas SHALL return empty `type_specific` objects, and they SHALL be marked as `available: false`.

#### Scenario: Access an unimplemented type

- **WHEN** a user attempts to create a listing with type `storefront`
- **THEN** the system SHALL reject the request with error `type-not-available`

#### Scenario: List available types

- **WHEN** the system returns the type list for the new listing page
- **THEN** it SHALL include all 13 types, with 7 marked as `available: false`

### Requirement: Each type defines three-layer field schema

The system SHALL define three field layers per type:
1. `common` — shared by all types (委託總價、物件地址、優缺點、照片)
2. `category_common` — shared within building or land category
3. `type_specific` — unique to this type only

#### Scenario: Retrieve field schema for farmland

- **WHEN** the system requests field schema for `farmland`
- **THEN** it SHALL return `common` fields + `land_common` fields + `type_specific` fields including: 特定農業區、農牧用地、灌溉、排水、供水、供電、農路寬度、是否可農舍

#### Scenario: Retrieve field schema for townhouse

- **WHEN** the system requests field schema for `townhouse`
- **THEN** it SHALL return `common` fields + `building_common` fields + `type_specific` fields including: 騎樓、前後側院、樓層用途分配、夾層/頂夾、漏水/壁癌
