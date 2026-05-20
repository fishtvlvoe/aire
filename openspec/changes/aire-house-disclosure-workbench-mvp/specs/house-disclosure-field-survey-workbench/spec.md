## ADDED Requirements

### Requirement: Field survey is separate from case setup
The field survey workbench SHALL be a separate UI surface from initial case setup.

#### Scenario: creating a case
- **WHEN** a user is creating the case and preparing to pull registry data
- **THEN** the UI SHALL ask only for the minimum case setup and registry query fields
- **THEN** the UI SHALL NOT render the full on-site field survey as part of setup

##### Example: setup shows query fields only
- **GIVEN** the user starts a new 大樓華廈 case
- **WHEN** the setup screen opens
- **THEN** the screen shows case name, land number, and building number fields
- **THEN** it does not show `是否有健身房` or `優點1`

#### Scenario: entering field survey answers
- **WHEN** a user opens the field survey workbench
- **THEN** the UI SHALL show shared house fields, property-type-specific fields, strengths/weaknesses, and photo upload areas
- **THEN** the field survey data SHALL feed the same Page Contract used by preview and PDF export

##### Example: highrise survey fields
- **GIVEN** the case property type is 大樓華廈
- **WHEN** the field survey workbench opens
- **THEN** it shows `公設比`, `管理費金額`, `是否有集中收包裹`, and `優點1`

### Requirement: House property types have distinct survey fields
The field survey workbench SHALL support property-type-specific fields for the first house MVP set.

#### Scenario: supported house types
- **WHEN** the case property type is 大樓華廈, 公寓, 透天別墅, 店面, 套房, 農舍, or 廠房
- **THEN** the workbench SHALL show that type's extracted source fields from `field-survey-supplement-source-extract.md`

##### Example: factory fields
- **GIVEN** the case property type is 廠房
- **WHEN** the field survey workbench opens
- **THEN** it shows `三相電`, `電壓`, `電力容量`, `排煙`, and `消防設備`

### Requirement: Image upload labels match page purpose
Image upload controls SHALL use labels that match the actual document section.

#### Scenario: image section rendered
- **WHEN** a user sees an image upload area
- **THEN** the label SHALL identify the actual asset kind such as 公司 Logo, 格局圖 / 土地規劃圖, 建物外觀照片, 位置圖 / 周邊圖, or 現場調查照片
- **THEN** the UI SHALL NOT label every image upload as 格局圖

##### Example: location map upload
- **GIVEN** the user is editing the location-map section
- **WHEN** automatic map generation fails
- **THEN** the manual upload label is `位置圖 / 周邊圖`
