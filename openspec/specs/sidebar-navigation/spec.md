# sidebar-navigation Specification

## Purpose

TBD - created by archiving change 'ui-fixes-and-admin'. Update Purpose after archive.

## Requirements

### Requirement: Two-item sidebar navigation

The sidebar SHALL no longer render exactly two top-level navigation items. The sidebar SHALL render top-level product modules as folder-style groups:

- `案件管理`
- `地政資料`
- `產出文件`
- `系統設定`

Each group SHALL expose second-level destinations, but the currently rendered page SHALL NOT duplicate those same destinations as page-level tabs unless the page is a settings-style category panel whose primary purpose is category switching.

Clicking a second-level destination SHALL change the main content scope to that destination. The page SHALL NOT render unrelated sibling destinations as if they are part of the same work surface.

The sidebar SHALL support collapse and a profile settings entry.

#### Scenario: Sidebar renders product modules

- **WHEN** the user is logged in and views any dashboard page
- **THEN** the sidebar displays the product modules `案件管理`, `地政資料`, `產出文件`, `系統設定`
- **AND** the sidebar does NOT degrade to only `案件管理` and `設定`

#### Scenario: Sidebar and page content do not duplicate navigation

- **GIVEN** the sidebar already shows `案件總覽`, `說明書工作台`, `補件清單` under `案件管理`
- **WHEN** the user opens `/cases`
- **THEN** the page content SHALL NOT render another same-level navigation set with those same labels
- **AND** the page content SHALL focus on cases and their status

#### Scenario: Sidebar destination changes the visible task

- **GIVEN** the user is in the `案件管理` sidebar branch
- **WHEN** the user clicks `補件清單`
- **THEN** the main content SHALL show supplement-related tasks
- **AND** the main content SHALL NOT show a full case overview, field visit workbench, and PDF tools all at once

#### Scenario: Direct links that require a case ask for case selection

- **GIVEN** the user clicks a sidebar item that represents a case-scoped tool
- **WHEN** no case is selected
- **THEN** the system SHALL ask the user to select a case first or route to a case selection view
- **AND** the system SHALL NOT show a detached case workbench with placeholder data

---
### Requirement: Settings sidebar SHALL avoid duplicate entitlement entries

The 系統設定 sidebar group SHALL expose 個人設定、地政授權、方案與升級. It SHALL NOT show 功能開關 and 授權與升級 as separate customer entries.

#### Scenario: Settings sidebar entries are consolidated

- **WHEN** the user expands 系統設定
- **THEN** 個人設定、地政授權、方案與升級 are visible
- **AND** 功能開關 is not visible
- **AND** 授權與升級 is not visible as a separate sidebar link

##### Example: no duplicate entitlement links

- **GIVEN** the user expands 系統設定
- **WHEN** visible sidebar links are inspected
- **THEN** exactly one plan-related link exists and its label is 方案與升級

---
### Requirement: 側邊欄移除產出文件資料夾

The dashboard sidebar SHALL group PDF output actions under case management behavior instead of a standalone output folder.

- **WHEN** the sidebar renders in expanded mode
- **THEN** it SHALL show primary folders `案件管理`, `地政資料`, and `系統設定`
- **THEN** it SHALL NOT show a primary folder labelled `產出文件`
- **THEN** it SHALL NOT show sidebar links labelled `PDF 預覽` or `列印與匯出`

#### Scenario: settings query active state is unique

- **GIVEN** current URL is `/settings?section=plans`
- **WHEN** the sidebar renders
- **THEN** the `方案與升級` link SHALL be visually active
- **THEN** the `個人設定` link SHALL NOT be visually active

---
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
