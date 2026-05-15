## ADDED Requirements

### Requirement: case-list-display

The case list page SHALL display all cases in an ST Table component with columns: case name, case type (成屋/土地), status (Badge component), created date, and an actions column. The "新增案件" button SHALL be positioned at the top-right of the page using an ST Button component.

#### Scenario: case list renders with ST Table

- **WHEN** the user navigates to /cases
- **THEN** the system SHALL render cases in an ST Table component with sortable columns
- **THEN** each case status SHALL be displayed as an ST Badge with color coding (draft=gray, complete=green)

##### Example: two cases with different statuses

- **GIVEN** two cases exist: "信義路成屋案" (status: draft) and "大安土地案" (status: complete)
- **WHEN** the user navigates to /cases
- **THEN** the Table SHALL show two rows; "信義路成屋案" has a gray Badge "草稿", "大安土地案" has a green Badge "完成"

#### Scenario: new case button triggers navigation

- **WHEN** the user clicks the "新增案件" ST Button
- **THEN** the system SHALL navigate to /cases/new

#### Scenario: empty case list

- **WHEN** the user navigates to /cases and no cases exist
- **THEN** the system SHALL display an empty state Card with a message "尚無案件" and a "新增第一個案件" Button

### Requirement: case-form-ui

The case edit form SHALL use ST Form components (Input, Select, Label, Textarea) for all fields. The form SHALL support two case types via tab switching: residential (成屋) and land (土地).

#### Scenario: form renders with ST components

- **WHEN** the user navigates to /cases/[id]
- **THEN** all form fields SHALL render using ST Input, Select, Label, and Textarea components
- **THEN** the case type selector SHALL use ST Tabs to switch between residential and land forms

##### Example: residential form fields

- **GIVEN** a case with id "abc-123" and caseType "residential"
- **WHEN** the user navigates to /cases/abc-123
- **THEN** the "成屋" Tab SHALL be active, showing fields: 物件名稱 (Input), 地址 (Input), 建物坪數 (Input type=number), 屋齡 (Input type=number), 備註 (Textarea)

#### Scenario: form save triggers IPC

- **WHEN** the user modifies any field and clicks the save button
- **THEN** the system SHALL call the update_case Tauri IPC command with the form data
- **THEN** on success, the system SHALL display a success Toast "案件已儲存"

#### Scenario: form validation on required fields

- **WHEN** the user attempts to save with empty required fields (case name, case type)
- **THEN** the form SHALL display validation errors on each empty required field using ST Form error styling

##### Example: empty case name validation

- **GIVEN** the user is on /cases/abc-123 with the case name field empty
- **WHEN** the user clicks the save button
- **THEN** the case name Input SHALL show error styling with message "請輸入物件名稱"
- **THEN** the update_case IPC SHALL NOT be called
