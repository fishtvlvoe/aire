## ADDED Requirements

### Requirement: AIRE maintains a MOI API coverage matrix

The system SHALL maintain a coverage matrix that maps scraped MOI services to AIRE workflow needs and implementation status. The matrix SHALL identify whether each service is wired, missing, fallback-only, free enrichment, restricted, or deferred.

#### Scenario: Existing AIRE endpoints are mapped to official service codes

- **WHEN** the coverage matrix is generated
- **THEN** current AIRE endpoints such as `land_registry`, `building_registry`, `building_ownership`, `building_other_rights`, and `address_to_parcel` SHALL be mapped to their official MOI service code when known
- **AND** any endpoint without a verified service code SHALL be marked `needs_verification`

#### Scenario: Required workflow gaps are visible

- **WHEN** a disclosure workflow requires a data field that no wired AIRE endpoint can provide
- **THEN** the matrix SHALL mark the corresponding MOI service or manual fallback as `missing_required`
- **AND** the report SHALL show why the field matters to the workflow

### Requirement: AIRE required disclosure workflows map to required and fallback MOI services

The system SHALL classify MOI services by workflow priority before implementation. Required services SHALL be separated from fallback, free enrichment, billing-only, restricted, and deferred services.

#### Scenario: Free enrichment service is visible but not forced

- **WHEN** a MOI service is free and improves dossier quality but is not legally required for the current disclosure workflow
- **THEN** the service SHALL be classified as `free_enrichment`
- **AND** implementation SHALL be optional unless Fish promotes it to required

### Requirement: AIRE classifies disclosure fields by source and auto-fill feasibility

The system SHALL maintain a document-field source matrix for AIRE disclosure outputs. Each field SHALL be classified as `registry_auto`, `registry_candidate`, `public_data_candidate`, `field_visit`, `contract_or_secretary`, or `manual_blank`.

#### Scenario: Registry-backed field must not be treated as plain blank

- **WHEN** a disclosure field such as 建號, 門牌, 建築完成日, 土地面積, 使用編定, 公告現值, or 他項權利 is blank
- **AND** the coverage matrix maps that field to an available MOI API or existing registry payload
- **THEN** the UI/report SHALL mark the field as `registry_candidate`
- **AND** SHALL show the recommended service code instead of silently leaving the field blank

#### Scenario: Field-visit-only data remains manual

- **WHEN** a disclosure field depends on physical observation such as 漏水, 壁癌, 車庫深度, 是否有果樹, or 現況使用
- **THEN** the source matrix SHALL classify the field as `field_visit`
- **AND** AIRE SHALL NOT auto-fill it from registry data without explicit supporting evidence

### Requirement: AIRE maps property-type-specific disclosure fields to registry, public-data, field-visit, and manual sources

The system SHALL support field-source mapping for property-type-specific disclosure needs, starting with 農地, 農舍, and 透天別墅. The mapping SHALL identify which fields require land registry, building registry, control/zoning services, public data, field visit, or secretary/contract review.

#### Scenario: Farm land requires land controls beyond basic land mark

- **WHEN** the property type is 農地
- **THEN** the matrix SHALL include agricultural area/category, land use category, farmhouse possibility, farm-use restrictions, cadastral map, zoning/national land planning reference, announced present value, announced land price, and land rights
- **AND** each field SHALL have a source class and candidate MOI service when available

##### Example: Farm land source mapping

- **GIVEN** `docs/0417-old/農地_秘書後補清單.docx` asks for 農牧用地或地目核對, 農舍可否, 農用限制, and 套繪/分割限制
- **WHEN** the coverage matrix is generated for 農地
- **THEN** 地目 and 使用編定 SHALL map to `MOI_API_001`
- **AND** 農舍可否 SHALL map to `MOI_API_019` as a candidate service
- **AND** 套繪/分割限制 SHALL be marked `registry_candidate` or `contract_or_secretary` until the official source is verified

#### Scenario: Farmhouse joins building and land evidence

- **WHEN** the property type is 農舍
- **THEN** the matrix SHALL include both building mark/ownership fields and land/farm-use fields
- **AND** SHALL identify which values come from building registry, land registry, control/zoning APIs, field visit, or secretary review

##### Example: Farmhouse joins mark and farm-use evidence

- **GIVEN** a 農舍 needs 建號, 權狀坪數, 主建物坪數, 法定用途, 建築完成日期, 合法農舍, and 農用限制
- **WHEN** the coverage matrix is generated
- **THEN** 建號 and area fields SHALL map to `MOI_API_004`
- **AND** ownership fields SHALL map to `MOI_API_005`
- **AND** 合法農舍 or 農用限制 SHALL map to `MOI_API_019` or be marked as `secretary_review` if API evidence is insufficient

#### Scenario: Townhouse splits registry data from physical inspection

- **WHEN** the property type is 透天別墅
- **THEN** the matrix SHALL classify building number, registered area, floor, legal use, completion date, ownership, and other rights as registry-backed candidates
- **AND** classify arcade, garage dimensions, floor-use allocation, leakage, wall cancer, and road-width observation as field-visit or secretary-review fields unless a verified public source exists

##### Example: Townhouse registry versus field visit

- **GIVEN** a 透天別墅 checklist asks for 建號, 主建物坪數, 法定用途, 建築完成日期, 騎樓面積, 車庫深度, 漏水, and 壁癌
- **WHEN** the coverage matrix is generated
- **THEN** 建號, 主建物坪數, 法定用途, and 建築完成日期 SHALL map to `MOI_API_004`
- **AND** 騎樓面積 and 車庫深度 SHALL be classified as `field_visit` unless a verified registry field is found
- **AND** 漏水 and 壁癌 SHALL remain `field_visit`
