## ADDED Requirements

### Requirement: Customer workflow sidebar navigation

The sidebar SHALL render workflow groups for 案件管理、地政資料、產出文件、系統設定. Each secondary item SHALL represent one distinct customer workflow and SHALL NOT duplicate another secondary item that routes to the same workflow with a different label.

#### Scenario: Sidebar renders workflow groups

- **WHEN** the user is logged in and views any dashboard page
- **THEN** the sidebar displays 案件管理、地政資料、產出文件、系統設定 as top-level workflow groups

##### Example: customer sidebar groups

- **GIVEN** the user is on `/cases`
- **WHEN** the sidebar is visible
- **THEN** the top-level labels are 案件管理、地政資料、產出文件、系統設定

#### Scenario: Create-case workflow is not duplicated as land query

- **WHEN** the user expands 案件管理 and 地政資料
- **THEN** 新增案件 appears under 案件管理
- **AND** 地政查詢 is not shown as a separate customer workflow

##### Example: create workflow location

- **GIVEN** the user expands all sidebar groups
- **WHEN** the visible links are inspected
- **THEN** 新增案件 links to `/cases/new`
- **AND** no link named 地政查詢 is present
