## ADDED Requirements

### Requirement: Address discovery SHALL be R02-first and zero-cost

The system SHALL use EasyMap R02 as the primary address discovery source for finding section, land number, and building number candidates. Discovery SHALL be represented as a zero-cost run and SHALL NOT be treated as formal COP transcript data.

#### Scenario: R02 returns candidates

- **GIVEN** a user enters an address on `/cases/new`
- **WHEN** R02 discovery returns one or more candidate registry keys
- **THEN** the UI SHALL show customer-readable candidate information for confirmation
- **AND** the run SHALL save R02 raw JSON, parsed JSON, candidates, `totalCostCents = 0`, and source metadata in local DB
- **AND** formal COP pull SHALL remain disabled until the user confirms the registry key.

#### Scenario: R02 cannot find candidates

- **WHEN** R02 discovery returns no usable candidate or the upstream source is unavailable
- **THEN** the UI SHALL ask the user to manually confirm section, land number, and building number when applicable
- **AND** the discovery run SHALL save a readable error and technical diagnostic in local DB
- **AND** no paid COP query SHALL be triggered automatically.
- **AND** an explicit paid resolver SHALL be offered only under the paid resolver requirement when the input is building intent and the product has a configured resolver.

### Requirement: Discovery input SHALL be classified before lookup

The system SHALL classify user input as `doorplate`, `land_descriptor`, or `incomplete` before requesting discovery and SHALL preserve the intended object type. Doorplate inputs SHALL use the R02 doorplate route and SHALL be treated as building intent. Land descriptor inputs SHALL use the R02 section and land-number route and SHALL be treated as land intent. Incomplete inputs SHALL request manual completion and SHALL NOT trigger formal COP.

#### Scenario: Doorplate input uses doorplate discovery

- **GIVEN** the user enters an address with city, district, road or street, and door number
- **WHEN** discovery starts
- **THEN** the discovery request SHALL use the doorplate route
- **AND** the intended object type SHALL be building
- **AND** returned candidates SHALL include section, land number, and building number when available
- **AND** if only section and land number are found, the result SHALL remain a building-intent manual-confirmation state rather than a land-only case.

#### Scenario: Land descriptor input uses land discovery

- **GIVEN** the user enters city, district, section name, and land number
- **WHEN** discovery starts
- **THEN** the discovery request SHALL use the land descriptor route
- **AND** the result SHALL include land candidates
- **AND** building candidates SHALL be listed only when the land detail contains building numbers.

#### Scenario: Incomplete input requires manual data

- **GIVEN** the user input does not contain enough fields for either doorplate or land descriptor discovery
- **WHEN** discovery starts
- **THEN** the result SHALL be `manual_required`
- **AND** the UI SHALL show which fields are missing
- **AND** no paid COP query SHALL be triggered.

### Requirement: Address correction suggestions SHALL NOT become confirmation

When doorplate discovery fails but the system can identify a likely road-name typo, alternate spelling, or same-district candidate, the system SHALL show correction suggestions only. Suggestions SHALL NOT create `confirmed_registry_match` until the user chooses a suggestion and reruns or confirms discovery.

#### Scenario: Suspected road-name typo

- **GIVEN** the user enters `高雄市苓雅區苓雅路二段18巷8弄2號`
- **AND** R02 doorplate discovery cannot produce a usable match
- **WHEN** the system finds a likely same-district correction such as `苓雅二路`
- **THEN** the UI SHALL show the suggestion as a correction candidate
- **AND** the case SHALL remain unconfirmed
- **AND** no paid COP query SHALL be triggered.

### Requirement: Multiple candidates SHALL require one selected target

When discovery returns multiple land candidates or building candidates, the system SHALL require the user to select exactly one target or enter manual correction before formal COP can run.

#### Scenario: Multiple building candidates are returned

- **GIVEN** discovery returns one land candidate and multiple building-number candidates
- **WHEN** the user has not selected a building candidate
- **THEN** formal COP SHALL remain disabled
- **AND** the saved discovery run SHALL preserve all candidates
- **AND** no paid COP query SHALL be triggered.

#### Scenario: User selects one candidate

- **GIVEN** discovery returns multiple candidates
- **WHEN** the user selects one candidate and confirms it
- **THEN** the selected candidate SHALL become the only `confirmed_registry_match`
- **AND** unselected candidates SHALL remain discovery evidence only.

### Requirement: Paid address-to-parcel resolver SHALL be explicit and candidate-only

When zero-cost discovery cannot resolve a building number for a building-intent doorplate input and the product has a configured resolver, the system SHALL offer a paid address-to-parcel resolver. The resolver SHALL require an explicit user action, SHALL call only the exact normalized address or a user-selected correction, SHALL produce candidates only, and SHALL NOT create `confirmed_registry_match` or formal COP data by itself.

#### Scenario: User opts into paid resolver after missing building number

- **GIVEN** the user enters a doorplate or floor address
- **AND** zero-cost discovery resolves no building number
- **WHEN** the user explicitly confirms the paid resolver action
- **THEN** the system SHALL call the configured address-to-parcel resolver at most once for that confirmed address
- **AND** the resolver result SHALL be saved as candidate evidence
- **AND** formal COP SHALL remain disabled until the user confirms one candidate.

#### Scenario: Paid resolver returns multiple candidates

- **GIVEN** the paid resolver returns multiple land or building candidates
- **WHEN** the result is displayed
- **THEN** the UI SHALL require exactly one selected target before formal COP can run
- **AND** unselected candidates SHALL remain evidence only.

#### Scenario: Paid resolver fails or returns no result

- **GIVEN** the user opted into the paid resolver
- **WHEN** the resolver fails, is denied, or returns no usable candidate
- **THEN** the case SHALL remain `registry_pending` or manual-confirmation required
- **AND** the error and paid run diagnostics SHALL be saved
- **AND** no formal COP query SHALL be triggered.

#### Scenario: System has only a land number for building intent

- **GIVEN** the original input contains road, lane, alley, door number, floor, or unit semantics
- **AND** discovery or resolver has only section and land number
- **WHEN** the system classifies the object
- **THEN** the case SHALL remain building intent with missing building number
- **AND** the UI SHALL ask for building-number confirmation or paid/manual resolution
- **AND** the case SHALL NOT be silently converted into a land-only case.

### Requirement: Land number SHALL have bounded meaning

A land number SHALL be usable for land formal data after confirmation and for candidate discovery of related building numbers when supported by zero-cost sources. A land number alone SHALL NOT be treated as a confirmed building registry key.

#### Scenario: Confirmed land number without building number

- **GIVEN** the user confirms section and land number
- **AND** no building number is confirmed
- **WHEN** formal query is prepared
- **THEN** the system SHALL prepare only the land formal API set
- **AND** building formal APIs SHALL remain unavailable until a building number is confirmed.

#### Scenario: Land detail exposes building candidates

- **GIVEN** a land descriptor lookup returns related building numbers from R02 detail, NLSC cadastral data, or equivalent zero-cost source
- **WHEN** candidates are shown
- **THEN** the system SHALL label them as building candidates
- **AND** the user SHALL select exactly one building candidate before building formal COP can run.

### Requirement: Mock and fixture data SHALL NOT become trusted registry data

Mock placeholders, development fixtures, browser partial success, and empty lookup results SHALL NOT be trusted registry data. They SHALL keep confirmation fields blank or explicitly untrusted until confirmed by the user and followed by successful formal COP pull.

#### Scenario: Generic mock placeholder appears

- **GIVEN** address lookup returns parcel `0001-0001` with land number `0001`, building number `0001`, or equivalent generic mock data
- **WHEN** `/cases/new` renders the discovery result
- **THEN** section, land number, and building number confirmation fields SHALL remain blank
- **AND** the case SHALL NOT be marked auto-completed.

#### Scenario: Development fixture appears

- **GIVEN** local development mode returns an explicit fixture candidate
- **WHEN** the user views the candidate
- **THEN** the candidate SHALL be marked untrusted for PDF
- **AND** formal COP pull SHALL still require a confirmed registry key.
