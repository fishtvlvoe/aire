## ADDED Requirements

### Requirement: Disclosure fields have source coverage classifications

The system SHALL maintain a source coverage classification for fields printed or collected for the AIRE disclosure document. Each field SHALL identify whether it can be filled from registry data, candidate registry/public APIs, field visit, contract/secretary review, or intentional manual blank.

#### Scenario: Document-side evidence becomes a field-source matrix

- **GIVEN** `docs/dossier-implementation-spec.md` defines 16 disclosure chapters
- **AND** `docs/0417-new/建安不動產欄位總表.md` defines building and land field sources
- **AND** `docs/0417-old` contains property-type checklists for 農地, 農舍, and 透天別墅
- **WHEN** AIRE generates the field-source matrix
- **THEN** each field SHALL include `fieldKey`, `label`, `propertyType`, `documentSection`, `sourceClass`, and `candidateServiceCodes`

#### Scenario: Auto-fillable blank is reported as a gap

- **WHEN** a generated disclosure field is blank
- **AND** the field source matrix classifies it as `registry_auto` or `registry_candidate`
- **THEN** AIRE SHALL report the blank as an auto-fill gap
- **AND** the report SHALL identify the candidate MOI service code or existing registry payload key

#### Scenario: Manual blank remains intentional

- **WHEN** a field is classified as `field_visit`, `contract_or_secretary`, or `manual_blank`
- **THEN** AIRE SHALL preserve the blank or writable space in the disclosure output
- **AND** SHALL NOT imply that the blank is an API failure

### Requirement: Auto-fill audit separates already fetched data from not-yet-wired services

The system SHALL distinguish fields that are blank despite existing `land_registry_data` from fields that require a not-yet-wired MOI service.

#### Scenario: Existing payload has usable field but document stays blank

- **GIVEN** `land_registry_data.building_registry.data.construction_date` exists
- **WHEN** the disclosure document leaves 建築完成日 blank
- **THEN** AIRE SHALL classify the issue as `mapping_gap`
- **AND** SHALL recommend mapping the existing payload field before adding a new API

#### Scenario: Service exists but is not wired

- **GIVEN** `MOI_API_018` is available in `docs/cop-scrape`
- **AND** the disclosure field 非都市土地使用管制 is blank
- **WHEN** no AIRE endpoint currently fetches `MOI_API_018`
- **THEN** AIRE SHALL classify the issue as `integration_gap`
- **AND** SHALL recommend a new endpoint or manual fallback decision
