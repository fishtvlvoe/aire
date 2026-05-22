# sidebar-navigation Specification

## Purpose

修正舊規格仍要求「案件管理 / 設定」兩項導覽的過時契約，改成符合 AIRE 產品模組的一級資料夾導覽。

## MODIFIED Requirements

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
