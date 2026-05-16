## ADDED Requirements

### Requirement: Land registry data persistence
The land registry query result SHALL be persisted to the case record's `land_registry_data` field after user confirmation. The `PullParcelDataButton` component SHALL display query results and a "確認儲存" button. Clicking "確認儲存" SHALL call `update_case` with the `land_registry_data` payload.

#### Scenario: Query and save
- **WHEN** user clicks "拉謄本" and the API returns results, then user clicks "確認儲存"
- **THEN** the case record's `land_registry_data` is updated with the API response and the UI shows "已儲存" confirmation

#### Scenario: Page reload after save
- **WHEN** user reloads the page after saving land registry data
- **THEN** the land registry section displays the previously saved data instead of "尚未查詢地政資料"

### Requirement: PDF export reads persisted data
The PDF assembly function (`assemble-dossier-data`) SHALL read `land_registry_data` from the case record as the primary data source. The function SHALL only call the land registry API as a fallback when `land_registry_data` is null.

#### Scenario: Export with saved data
- **WHEN** user exports PDF for a case that has `land_registry_data` saved
- **THEN** the PDF contains the saved land registry data without making an API call

#### Scenario: Export without saved data (fallback)
- **WHEN** user exports PDF for a case where `land_registry_data` is null
- **THEN** the system calls the land registry API to fetch data, then generates the PDF
