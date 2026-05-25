## ADDED Requirements

### Requirement: 補件入口統一到補件現場工作台

Case-level supplement actions SHALL open the current workbench supplement flow instead of the legacy key-in flow.

#### Scenario: case-row supplement shortcut

- **GIVEN** a case row is visible on `/cases`
- **WHEN** the user clicks the `補件` action
- **THEN** the app SHALL navigate to `/cases/:id?tab=supplements`
- **THEN** the `補件/現場` tab SHALL be selected for that case

### Requirement: 補件現場資料可持久化

The workbench supplement/field-visit form SHALL persist user-entered draft data in mock/browser mode.

#### Scenario: field-visit answers persist

- **GIVEN** the user opens a case workbench
- **WHEN** the user enters a field-visit answer and changes its status
- **THEN** the workbench SHALL save those values to the case supplement draft
- **WHEN** the workbench remounts for the same case
- **THEN** the saved answer and status SHALL still be visible

#### Scenario: upload names and supplement-list state persist

- **GIVEN** the user opens the `補件/現場` tab
- **WHEN** the user selects a file for an upload slot
- **THEN** the selected file name SHALL be saved for that case
- **WHEN** the user clicks `加入補件清單`
- **THEN** the supplement-list state SHALL be saved for that case
- **WHEN** the workbench remounts
- **THEN** the selected file name and supplement-list state SHALL still be visible

#### Scenario: PDF check uses persisted upload count

- **GIVEN** a case has persisted supplement upload file names
- **WHEN** the user opens the `PDF 檢查` tab
- **THEN** the uploaded-asset count SHALL reflect the persisted upload file names
