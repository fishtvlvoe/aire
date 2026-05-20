## MODIFIED Requirements

### Requirement: Building survey data persistence

The system SHALL persist building survey answers via the `StorageAdapter` interface. In development (browser) environment, `MockStorageAdapter.saveCaseDisclosures(caseId, data)` SHALL write to `localStorage['aire-mock-store'].disclosures[caseId]`. In production (Tauri), `TauriStorageAdapter.saveCaseDisclosures` SHALL write to `disclosure_drafts.survey_data` JSON column in SQLite. Survey data SHALL be restored on page reload: `StorageAdapter.getCaseDisclosures(caseId)` is called on mount and the returned `DisclosureData` pre-populates all checkboxes.

#### Scenario: Distinguish from land survey by property type

- **WHEN** loading survey data for a building-type case
- **THEN** the system SHALL deserialize as BuildingSurveyData (not LandSurveyData)

#### Scenario: Survey answer persisted immediately on change

- **WHEN** user toggles a checkbox (e.g., conditionLeakage) in the 現況 tab
- **THEN** `StorageAdapter.saveCaseDisclosures(caseId, updatedData)` SHALL be called with the updated boolean value
- **THEN** `localStorage['aire-mock-store'].disclosures[caseId].conditionLeakage` SHALL equal true (in dev)

#### Scenario: Survey answers restored on reload

- **WHEN** user reloads the page after having toggled conditionLeakage to true
- **THEN** `StorageAdapter.getCaseDisclosures(caseId)` returns `{ conditionLeakage: true, ... }`
- **THEN** the conditionLeakage checkbox renders as checked

##### Example: Persistence roundtrip

- **GIVEN** case id "9b7db332-6b28-435c-9e50-70ac5696744e"
- **WHEN** user checks conditionLeakage, conditionRenovation
- **THEN** `aire-mock-store.disclosures["9b7db332-6b28-435c-9e50-70ac5696744e"]` equals `{ conditionLeakage: true, conditionRenovation: true, conditionIllegalStructure: false }`
- **WHEN** page reloads
- **THEN** both checkboxes render as checked
