## ADDED Requirements

### Requirement: Address lookup UI trust guard

Address lookup SHALL run as a background data-completion step from the new case flow. The UI SHALL present only the user decision fields: address, section, land number, building number, confidence/needs-confirmation state and next action. The implementation SHALL keep discovery source names internal, and source names SHALL NOT be part of the customer-facing workflow.

#### Scenario: Desktop lookup returns confirmable fields

- **WHEN** the user enters a complete building address in the Desktop new case flow
- **AND** the Desktop backend returns trusted candidate section, land number and building number data
- **THEN** the UI SHALL display those fields for confirmation
- **AND** the lookup SHALL NOT call paid formal registry lookup
- **AND** the run SHALL be recorded as zero-cost candidate discovery

##### Example: Trusted Desktop candidate

- **GIVEN** the app is running in Tauri Desktop mode
- **WHEN** address lookup returns parcel `DC-1556-00165000` with source `cop_moi`, land number `00700000`, and building number `00165000`
- **THEN** `/cases/new` SHALL display `00700000` and `00165000` for confirmation

#### Scenario: Browser or mock lookup does not auto-complete

- **WHEN** the user enters an address in a non-Desktop browser environment
- **OR** address lookup returns mock or placeholder candidate data
- **THEN** the UI SHALL NOT display the lookup as automatically completed
- **AND** the section, land number and building number fields SHALL remain blank
- **AND** the UI SHALL ask the user to use the Desktop App or manually confirm the missing fields

##### Example: Mock placeholder is not trusted

- **GIVEN** address lookup returns parcel `0001-0001` with source `mock`, land number `0001`, and building number `0001`
- **WHEN** `/cases/new` renders the result for `台南市永康區勝利街58巷4號`
- **THEN** the UI SHALL show `需要人工補填資料`
- **AND** the section, land number, and building number inputs SHALL remain empty

#### Scenario: Lookup failure asks for manual completion

- **WHEN** the system cannot resolve trusted candidate registry fields
- **THEN** the UI SHALL ask the user to manually fill the missing section, land number or building number
- **AND** the message SHALL be customer-readable
- **AND** the query record SHALL preserve internal diagnostics for support

##### Example: Browser mode requires Desktop or manual confirmation

- **GIVEN** the app is running in a normal browser
- **WHEN** the user enters `台南市永康區勝利街58巷4號`
- **THEN** the UI SHALL show guidance to use the AIRE Desktop App or manually fill section, land number, and building number
