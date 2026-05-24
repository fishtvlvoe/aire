## ADDED Requirements

### Requirement: Property classifier SHALL distinguish building subtypes

The system SHALL classify confirmed building candidates into `highrise-building`, `huaxia-building`, `apartment`, `townhouse`, `villa`, or `building-needs-confirmation` using floor count, floor label, elevator evidence, garage evidence, address form, and registry use. The classifier SHALL return suggested type, evidence, missing evidence, confidence label, and manual confirmation flag.

#### Scenario: High-rise building classification

- **WHEN** a confirmed building has total floors greater than or equal to 11 and elevator evidence exists
- **THEN** the classifier SHALL return `highrise-building`
- **AND** evidence SHALL include total floors and elevator

#### Scenario: Huaxia building classification

- **WHEN** a confirmed building has total floors from 8 through 11 and elevator evidence exists
- **THEN** the classifier SHALL return `huaxia-building`
- **AND** evidence SHALL include total floors and elevator

#### Scenario: Apartment classification

- **WHEN** a confirmed building has no elevator evidence and total floors are less than or equal to 6
- **THEN** the classifier SHALL return `apartment`
- **AND** evidence SHALL include total floors and missing elevator

#### Scenario: Missing elevator evidence requires confirmation

- **WHEN** a confirmed building has total floors greater than or equal to 8 and elevator evidence is missing
- **THEN** the classifier SHALL return `building-needs-confirmation`
- **AND** missing evidence SHALL include `elevator`

### Requirement: Property classifier SHALL distinguish townhouse and villa

The system SHALL classify low-rise independent building candidates into `townhouse`, `villa`, or `townhouse-villa-needs-confirmation`. Garage evidence SHALL be required for `villa`. Explicit user confirmation of villa SHALL set confirmed type to `villa`.

#### Scenario: Garage evidence suggests villa

- **WHEN** a low-rise independent building has garage evidence
- **THEN** the classifier SHALL return `townhouse-villa-needs-confirmation`
- **AND** evidence SHALL include garage
- **AND** manual confirmation SHALL be required before the confirmed type becomes `villa`

#### Scenario: No garage evidence suggests townhouse

- **WHEN** a low-rise independent building has no garage evidence
- **THEN** the classifier SHALL return `townhouse`
- **AND** missing evidence SHALL include garage when the user asks to evaluate villa

### Requirement: Property classifier SHALL distinguish land categories

The system SHALL classify confirmed land candidates into `residential-land`, `farmland`, `agricultural-building-land`, `industrial-land`, `type-d-building-land`, or `land-needs-confirmation` using urban planning zone, non-urban land use category, and COP land use records.

#### Scenario: Residential zone is building land

- **WHEN** COP land use data contains residential zone
- **THEN** the classifier SHALL return `residential-land`

#### Scenario: Agricultural pastoral land is farmland

- **WHEN** COP land use data contains agricultural and pastoral use and no Type A, Type B, or Type C building land marker
- **THEN** the classifier SHALL return `farmland`

#### Scenario: Non-urban Type A B C building land is agricultural building land

- **WHEN** COP land use data contains Type A, Type B, or Type C building land
- **THEN** the classifier SHALL return `agricultural-building-land`

#### Scenario: Industrial zone is industrial land

- **WHEN** COP land use data contains industrial zone
- **THEN** the classifier SHALL return `industrial-land`

#### Scenario: Type D building land is non-urban industrial land

- **WHEN** COP land use data contains Type D building land
- **THEN** the classifier SHALL return `type-d-building-land`
