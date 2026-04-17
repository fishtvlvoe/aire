## ADDED Requirements

### Requirement: Registry supports all 13 property types as available

The property type registry SHALL enable all 13 types for v3 (up from 6 in v2).

#### Scenario: All 13 types available
- **WHEN** code calls `getAvailablePropertyTypes()`
- **THEN** return value SHALL contain all 13 types:
  - Building: `apartment` / `highrise` / `townhouse` / `studio` / `storefront` / `factory` / `farmhouse`
  - Land: `farmland` / `residential-land` / `commercial-land` / `industrial-land` / `rural-land` / `other-land`
- **AND** every type SHALL have `available: true`

#### Scenario: Each type has a complete field schema
- **WHEN** code calls `getFieldSchema(type, layer)` for any of 13 types and any layer (`common` / `building-common` / `land-common` / `type-specific` / `supplementary`)
- **THEN** schema SHALL return a non-empty array of field definitions
- **AND** every field SHALL include `key`, `label`, `type`, `sourceType`, `displayMode`

### Requirement: Each field has sourceType and displayMode metadata

Every field definition SHALL include provenance and display metadata to support the Jianan field catalog model.

#### Scenario: sourceType categorization
- **WHEN** inspecting any field schema
- **THEN** `sourceType` SHALL be one of: `'deed'` (謄本) / `'onsite'` (現場) / `'secretary'` (秘書後補) / `'public-data'` (公開資料)

#### Scenario: displayMode governs UI rendering
- **WHEN** inspecting any field schema
- **THEN** `displayMode` SHALL be one of: `'fixed'` (固定顯示) / `'estimate'` (需估算) / `'blank'` (留空回填)
- **AND** UI SHALL render different visual styles per mode (fixed=normal, estimate=yellow border, blank=gray border)
