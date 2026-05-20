## ADDED Requirements

### Requirement: Registry pull preview shows imported disclosure fields
After a land registry pull succeeds, the system SHALL show a preview of every registry-derived field that can be imported into the house disclosure document.

#### Scenario: successful registry pull
- **WHEN** a user pulls registry data for a house case
- **THEN** the system SHALL show grouped preview sections for land mark, land ownership, building mark, building ownership, rights/encumbrances, and missing fields
- **THEN** the preview SHALL include source labels showing whether each field came from registry/API, manual input, contract, or supplement
- **THEN** the preview SHALL NOT only show land number and building number

##### Example: imported building owner appears in preview
- **GIVEN** the registry response includes owner `王小明`, building number `778-2`, and completion date `2015-06-15`
- **WHEN** the registry pull succeeds
- **THEN** the preview shows those fields under building ownership and building mark
- **THEN** the missing-fields group does not include those three fields

#### Scenario: missing registry fields
- **WHEN** a registry response does not include a field required by the fixed template
- **THEN** the system SHALL show the field in a missing/blank group inside the app UI
- **THEN** the generated PDF SHALL render the field as blank, not as `待補`

##### Example: missing main building area remains blank
- **GIVEN** the registry response does not include `mainBuildingArea`
- **WHEN** the preview is rendered
- **THEN** `主建坪數` appears in the missing-fields group
- **THEN** the PDF field is blank

### Requirement: Registry payload is durable in local storage
Registry payloads SHALL be stored only in the enrolled device's local data store and SHALL remain available after reopening the case.

#### Scenario: reopen case after registry pull
- **WHEN** a user pulls registry data and closes/reopens the case
- **THEN** the system SHALL load the saved registry preview from local storage
- **THEN** the system SHALL NOT require a second paid registry pull to inspect already saved data

##### Example: saved owner remains visible after reopen
- **GIVEN** case `AIRE-2026-001` has saved registry owner `王小明`
- **WHEN** the user reopens the case
- **THEN** the registry preview still shows `王小明`

### Requirement: Registry payload can be saved locally as a file
The user SHALL be able to save the pulled registry payload or source document to a local file for later reuse.

#### Scenario: save registry source locally
- **WHEN** registry data has been pulled for a case
- **THEN** the user SHALL be able to save a local copy
- **THEN** the system SHALL NOT upload that local copy to AIRE Cloud or OPCOS

##### Example: local source export
- **GIVEN** case `AIRE-2026-001` has a saved registry payload
- **WHEN** the user chooses `另存謄本資料`
- **THEN** the app writes a local file chosen by the user
- **THEN** no cloud telemetry contains address, parcel number, owner, or payload content
