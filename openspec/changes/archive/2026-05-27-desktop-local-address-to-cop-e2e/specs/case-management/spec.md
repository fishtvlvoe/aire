## ADDED Requirements

### Requirement: Create-case flow SHALL persist registry confirmation state

The create-case flow SHALL save discovery diagnostics, candidate data, normalized address, and confirmed registry match state before allowing formal COP lookup. Building cases SHALL require section, land number, and building number confirmation before formal pull. Land-only cases SHALL require section and land number and SHALL allow building number to remain empty.

#### Scenario: Manual confirmation after discovery failure

- **GIVEN** address discovery fails or is denied
- **WHEN** the user manually enters section, land number, and building number and creates the case
- **THEN** the case SHALL store `confirmed_registry_match`
- **AND** the system SHALL be able to use that confirmed key for formal COP pull.

#### Scenario: Unconfirmed candidate cannot trigger paid lookup

- **GIVEN** a case has candidate discovery data but no confirmed registry match
- **WHEN** formal COP lookup is requested
- **THEN** the request SHALL fail with `registry_match_required`
- **AND** no paid API call SHALL be created.

#### Scenario: Multiple candidates require one confirmation

- **GIVEN** discovery returns multiple land or building candidates
- **WHEN** the user creates or updates the case without selecting exactly one candidate
- **THEN** the case SHALL remain `registry_pending` or unconfirmed
- **AND** formal COP lookup SHALL remain blocked
- **AND** the UI SHALL show that one target must be selected or manually corrected.

#### Scenario: Paid resolver candidate still requires confirmation

- **GIVEN** a paid address-to-parcel resolver has returned candidate registry targets
- **WHEN** the user creates or updates the case without confirming exactly one candidate
- **THEN** the case SHALL remain `registry_pending` or unconfirmed
- **AND** formal COP lookup SHALL remain blocked
- **AND** the paid resolver run SHALL remain evidence only.

### Requirement: Duplicate property entry SHALL autofill and warn

When the user enters an address or registry key already known to the local AIRE DB, the system SHALL warn the user and autofill reusable data instead of silently creating duplicate work or repeating paid queries.

#### Scenario: Same normalized address exists

- **GIVEN** local DB contains discovery data for the same normalized address
- **WHEN** a user enters that address again
- **THEN** the UI SHALL show that existing information was found
- **AND** section, land number, building number, and candidate details SHALL be auto-filled from local DB.

#### Scenario: Same confirmed registry key exists on another case

- **GIVEN** local DB contains an existing case with the same confirmed registry key
- **WHEN** the user confirms that registry key on a new case
- **THEN** the UI SHALL show `系統中已有同樣資訊` or equivalent customer-readable warning
- **AND** the user SHALL be able to open the existing case or explicitly continue creating a new case.

### Requirement: Property type SHALL be auto-filled and editable

The system SHALL auto-fill property type from discovery and formal data while allowing the user to correct it. R02 SHALL provide coarse building-or-land classification from input intent and candidate data, and COP formal data SHALL refine the property type. Doorplate, floor, lane, alley, and unit-number inputs SHALL preserve building intent even when discovery only resolves the underlying land number.

#### Scenario: Formal data refines property type

- **GIVEN** a case has confirmed registry key and COP formal data
- **WHEN** the system parses building use, floor, total floor, zoning, or land-use fields
- **THEN** the case SHALL be classified into an available property type such as farmland, townhouse, apartment, highrise, residential-land, farmhouse, studio, storefront, factory, industrial-land, commercial-land, village-land, or other-land
- **AND** the user SHALL be able to edit the classification before finalizing the case.

#### Scenario: Land descriptor creates land-classification path

- **GIVEN** the user enters a section and land number without building number
- **WHEN** discovery resolves a land candidate
- **THEN** the case SHALL use the land classification path
- **AND** the user SHALL be able to choose farmland, commercial land, residential land, industrial land, or other land before formal data refines the type.

#### Scenario: Doorplate with only land result stays building-intent pending

- **GIVEN** the user enters a doorplate or floor address
- **AND** discovery resolves section and land number but cannot resolve building number
- **WHEN** the case classification is shown
- **THEN** the case SHALL remain building-intent
- **AND** the UI SHALL ask the user to confirm or fill the building number
- **AND** the case SHALL NOT be silently converted into a land-classification path.

#### Scenario: Land descriptor may expose building candidates without changing land intent

- **GIVEN** the user enters a section and land number as a land descriptor
- **AND** zero-cost land detail returns related building candidates
- **WHEN** the case classification is shown
- **THEN** the primary case SHALL remain a land-intent path unless the user selects a building candidate
- **AND** selecting a building candidate SHALL create a building confirmation path that still requires user confirmation before formal COP.

### Requirement: Registry pending cases SHALL be creatable after discovery failure

The create-case flow SHALL allow a `registry_pending` case when address discovery cannot produce section, land number, or building number. A `registry_pending` case SHALL preserve the user-entered address and discovery diagnostics, SHALL route the missing registry data to supplements or manual confirmation, and SHALL NOT permit formal COP lookup or trusted PDF output until registry confirmation is completed.

#### Scenario: Discovery failure creates a pending case

- **GIVEN** address discovery returns no trustworthy section, land number, or building number
- **WHEN** the user creates a case from the address form
- **THEN** the case SHALL be created with `registry_pending`
- **AND** the case SHALL preserve the address, discovery status, readable failure reason, and missing registry fields
- **AND** formal COP lookup SHALL remain blocked with `registry_match_required`.

#### Scenario: Pending case becomes confirmed after manual registry input

- **GIVEN** a case is in `registry_pending`
- **WHEN** the user later enters and confirms section, land number, and building number when applicable
- **THEN** the case SHALL store `confirmed_registry_match`
- **AND** formal COP lookup SHALL become available for that confirmed registry key.

### Requirement: Property type SHALL expose customer-facing categories

Case creation and case editing SHALL expose customer-facing property type options, not only internal `residential` and `land` categories. The available options SHALL include highrise building, apartment, townhouse, existing house, farmhouse, land, farmland, storefront, factory, and other.

#### Scenario: User opens the property type dropdown

- **WHEN** the user opens the property type dropdown on case creation or case editing
- **THEN** the UI SHALL show customer-readable options for highrise building, apartment, townhouse, existing house, farmhouse, land, farmland, storefront, factory, and other
- **AND** existing records stored as `residential` or `land` SHALL still load through a backward-compatible mapping.

### Requirement: Survey fields SHALL differ for building and land cases

The object survey form SHALL show fields appropriate to the selected registry object type. Building cases SHALL collect building-specific facts. Land cases SHALL collect land-specific facts. Shared supplement assets SHALL still be owned by the current case object.

#### Scenario: Building survey is shown

- **GIVEN** the case is classified as a building object
- **WHEN** the user opens the object survey
- **THEN** the form SHALL include building-oriented fields such as floor, total floors, layout, condition, main use, management state, floor plan, and interior photos.

#### Scenario: Land survey is shown

- **GIVEN** the case is classified as a land object
- **WHEN** the user opens the object survey
- **THEN** the form SHALL include land-oriented fields such as zoning or use category, current use, road access, frontage, depth, cadastral map, aerial map, and landmark map.
