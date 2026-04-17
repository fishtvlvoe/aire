## ADDED Requirements

### Requirement: Field visit form supports all 13 property types

The field visit form SHALL render dynamically for any of the 13 property types (not limited to 2 as in v2).

#### Scenario: Form renders for all 13 types
- **WHEN** user opens `/listings/[id]/fill` for a listing with any of 13 property types
- **THEN** form SHALL render three layers:
  1. Common fields (shared by all types)
  2. Category common fields (building-common OR land-common)
  3. Type-specific fields (per property type)
- **AND** no placeholder "尚未支援此類型" message SHALL appear

### Requirement: Form groups fields by chapter, not by layer

UI SHALL group fields into the 8 chapters matching the Jianan field catalog (not the internal 3-layer structure).

#### Scenario: Chapter-based tabs
- **WHEN** form renders
- **THEN** top-level tabs SHALL be: 封面與識別 / 基本資料 / 權利與登記 / 使用與管理 / 停車與設備 / 瑕疵與風險 / 交易條件 / 周遭環境 / 行情與附錄
- **AND** fields from all 3 layers SHALL be merged and sorted into their respective chapter tab

#### Scenario: Progress indicator per chapter
- **WHEN** form renders
- **THEN** each chapter tab SHALL show completion state: ✅ (all required filled) / 🟡 (partial) / ⬜ (empty)

### Requirement: Field visual style reflects displayMode

Fields SHALL visually indicate their displayMode.

#### Scenario: Estimate fields are visually distinct
- **WHEN** a field has `displayMode: 'estimate'`
- **THEN** input border SHALL be yellow
- **AND** helper text SHALL show "需估算（可留空）"

#### Scenario: Blank fields show clearly
- **WHEN** a field has `displayMode: 'blank'`
- **THEN** input border SHALL be gray with dashed style
- **AND** helper text SHALL show "留空回填"
