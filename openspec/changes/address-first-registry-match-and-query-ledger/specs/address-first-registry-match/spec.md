## ADDED Requirements

### Requirement: Address input SHALL resolve registry candidates before paid COP calls

The system SHALL accept a building address and resolve candidate office, section, land number, building number, normalized address, source diagnostics, and confidence label before any paid COP call is executed. The internal endpoint `POST /api/registry/resolve-address` SHALL return HTTP 200 with candidates when discovery succeeds, HTTP 422 when the address is empty or incomplete, and HTTP 502 when the discovery source is unavailable.

#### Scenario: Building address returns candidate land and building keys

- **WHEN** the user submits `台南市東區裕農路288巷17號8樓之1` to `POST /api/registry/resolve-address`
- **THEN** the system SHALL return HTTP 200
- **AND** the response SHALL include at least one candidate with office, section, land number, building number, normalized address, source, confidence label, and `confirmation_status = candidate_unconfirmed`
- **AND** the system SHALL NOT call any paid COP endpoint during this step

##### Example: candidate response shape

| Field | Expected |
| ----- | -------- |
| inputAddress | 台南市東區裕農路288巷17號8樓之1 |
| officeName | 東南地政事務所 |
| sectionName | 富強段 |
| landNo | non-empty string |
| buildingNo | non-empty string |
| confirmation_status | candidate_unconfirmed |

#### Scenario: Empty address is rejected

- **WHEN** the user submits an empty address to `POST /api/registry/resolve-address`
- **THEN** the system SHALL return HTTP 422
- **AND** the response SHALL include error code `address_required`
- **AND** the system SHALL create a zero-cost query run with `status = invalid_input`

### Requirement: Land input SHALL resolve registry candidates without requiring address

The system SHALL accept land-only input containing city, district, section and one or more land numbers. The internal endpoint `POST /api/registry/resolve-land` SHALL return HTTP 200 with land registry candidates and SHALL leave building number empty when no building is requested.

#### Scenario: Land section and two land numbers return two candidates

- **WHEN** the user submits `台南市新市區港子前段 1090、1090-26 地號，共 2 筆` to `POST /api/registry/resolve-land`
- **THEN** the system SHALL return HTTP 200
- **AND** the response SHALL include two land candidates
- **AND** each candidate SHALL include office, section, land number and `registry_key`
- **AND** each candidate SHALL have `buildingNo = null`

#### Scenario: Farmland section input returns one land candidate

- **WHEN** the user submits `台南市南化區南化段 850-1` to `POST /api/registry/resolve-land`
- **THEN** the system SHALL return HTTP 200
- **AND** the response SHALL include one land candidate for section `南化段` and land number `850-1`

### Requirement: Confirmed registry match SHALL gate formal COP queries

The system SHALL require a confirmed registry match before formal COP data is pulled for disclosure generation. The internal endpoint `POST /api/registry/confirm-match` SHALL return HTTP 200 after confirmation and SHALL persist the confirmed address, office, section, land number, building number, user id, and confirmation timestamp.

#### Scenario: User confirms one candidate

- **WHEN** the user confirms a candidate through `POST /api/registry/confirm-match`
- **THEN** the system SHALL return HTTP 200
- **AND** the run SHALL change to `confirmation_status = confirmed`
- **AND** formal COP query actions SHALL become enabled for that run

#### Scenario: Multiple candidates block formal query

- **WHEN** a resolved address has multiple candidates and no user selection
- **THEN** the system SHALL keep `confirmation_status = needs_selection`
- **AND** the system SHALL block formal COP query actions
- **AND** the system SHALL allow pre-survey reference generation only

### Requirement: Test fixtures SHALL produce persistent run data

The system SHALL include automated fixture coverage for high-rise, villa, huaxia, townhouse, farmland, building land, and apartment inputs. Each fixture execution SHALL create a query run with input JSON, resolved JSON, cost summary, status, and classification fields.

#### Scenario: Seven CR fixtures are executed

- **WHEN** the registry fixture test suite runs
- **THEN** the system SHALL execute fixtures for `台南市東區裕農路288巷17號8樓之1`, `台南市永康區勝利街 2 巷 92 弄 13 號`, `臺南市東區東智街 88 號 5 樓`, `台南市麻豆區中山二路`, `台南市南化區南化段 850-1`, `台南市新市區港子前段 1090、1090-26 地號，共 2 筆`, and `台南市東區中華東路三段 24 巷 8 號 5 樓`
- **AND** each fixture SHALL persist a query run row
- **AND** each fixture SHALL expose its stored JSON through the query-record detail endpoint
