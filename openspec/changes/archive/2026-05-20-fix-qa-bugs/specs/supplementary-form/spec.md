## ADDED Requirements

### Requirement: Key-in autosave writes to persistent storage

The Key-in page autosave feature SHALL write field values to `StorageAdapter.saveKeyinData(caseId, data)` whenever the debounced autosave triggers. The autosave indicator SHALL update to show "已於 HH:mm 儲存" only AFTER `saveKeyinData` resolves successfully. The indicator SHALL NOT show a saved timestamp when no actual write has occurred. If `saveKeyinData` rejects, the indicator SHALL show "自動儲存失敗".

In development (browser), `MockStorageAdapter.saveKeyinData` SHALL write to `localStorage['aire-mock-store'].keyin_data[caseId]`. In production (Tauri), `TauriStorageAdapter.saveKeyinData` SHALL write to the SQLite case row.

#### Scenario: Autosave writes to mock store

- **WHEN** user types in a Key-in page field and the debounce timer elapses
- **THEN** `StorageAdapter.saveKeyinData(caseId, { [fieldName]: value, savedAt: <ISO timestamp> })` SHALL be called
- **THEN** `localStorage['aire-mock-store'].keyin_data[caseId]` SHALL contain the saved field value (in dev)

#### Scenario: Autosave indicator reflects actual write

- **WHEN** `StorageAdapter.saveKeyinData` resolves
- **THEN** the indicator shows "已於 HH:mm 儲存" with the current time
- **WHEN** `StorageAdapter.saveKeyinData` is never called (no user input)
- **THEN** the indicator SHALL NOT show any saved timestamp

#### Scenario: Fields restored on page reload

- **WHEN** user has autosaved data in a Key-in field and reloads the page
- **THEN** `StorageAdapter.getKeyinData(caseId)` is called on mount
- **THEN** each field that has a saved value SHALL be pre-populated with that value

### Requirement: Draft restore toast only when draft exists

The system SHALL display the "已還原上次未儲存的草稿" toast on page load ONLY when `StorageAdapter.getKeyinData(caseId)` returns a non-null object with at least one field value. The system SHALL NOT display the toast when `getKeyinData` returns null or an empty object.

#### Scenario: No draft — no restore toast

- **WHEN** user opens a Key-in page for a case with no previously saved keyin data
- **THEN** `StorageAdapter.getKeyinData(caseId)` returns null
- **THEN** the "已還原上次未儲存的草稿" toast SHALL NOT appear

#### Scenario: Draft exists — restore toast appears

- **WHEN** user opens a Key-in page for a case with previously autosaved data
- **THEN** `StorageAdapter.getKeyinData(caseId)` returns a non-null KeyinData object
- **THEN** the "已還原上次未儲存的草稿" toast SHALL appear once on mount

##### Example: Toast suppression when no data

- **GIVEN** `aire-mock-store` has no `keyin_data` key or `keyin_data[caseId]` is null
- **WHEN** Key-in page loads
- **THEN** no "已還原上次未儲存的草稿" toast appears
- **THEN** no autosave indicator shows a saved timestamp
