## ADDED Requirements

### Requirement: Case row destinations SHALL preserve selected workflow scope

The cases list SHALL route a clicked case row according to the currently selected second-level workflow instead of always opening the default workbench.

#### Scenario: Supplement list opens the supplement tab

- **GIVEN** the user is on `/cases?view=supplements`
- **WHEN** the user clicks a case row
- **THEN** the app navigates to `/cases/:id?tab=supplements`

#### Scenario: PDF preview list opens preview route

- **GIVEN** the user is on `/cases?view=pdf`
- **WHEN** the user clicks a case row
- **THEN** the app navigates to `/cases/:id/preview`

#### Scenario: Export list opens preview export mode

- **GIVEN** the user is on `/cases?view=export`
- **WHEN** the user clicks a case row
- **THEN** the app navigates to `/cases/:id/preview?mode=export`

### Requirement: Case workbench controls SHALL be executable or clearly read-only

The case workbench SHALL not show active-looking controls that do not change state, route, or execute a tested local action.

#### Scenario: Workbench tabs switch scoped content

- **WHEN** the user clicks 資料來源, 補件, 費用, or PDF 檢查
- **THEN** the workbench shows only that tab's content
- **AND** the active tab is visually and semantically selected

##### Example: supplement tab

- **GIVEN** the workbench initially shows 欄位
- **WHEN** the user clicks 補件
- **THEN** 補件與現場確認 is visible
- **AND** 費用成功與失敗紀錄 is not visible

#### Scenario: Local supplement action gives feedback

- **WHEN** the user clicks 加入補件清單
- **THEN** the workbench displays 已加入補件清單

##### Example: visible feedback

- **GIVEN** the user is on the 補件 tab
- **WHEN** the user clicks 加入補件清單
- **THEN** 已加入補件清單 appears in the same region

#### Scenario: Backend-pending actions are read-only status

- **WHEN** backend re-query or automatic supplement generation is not implemented
- **THEN** the workbench shows them as read-only status text
- **AND** they are not rendered as primary action buttons

##### Example: pending re-query

- **GIVEN** backend re-query is not wired
- **WHEN** the user opens the workbench
- **THEN** 地政重查：後端串接中 is visible
- **AND** no button named 重新查詢 is visible
