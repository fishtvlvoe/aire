# ux-interaction-patterns Specification

## Purpose

補上 AIRE 工作流中的導覽去重、主動作唯一與客戶文案降噪規則，讓 UI 測試可以驗證「人類點擊後的行為」。

## ADDED Requirements

### Requirement: Page-level navigation SHALL not duplicate parent navigation

If a label already exists as a sidebar second-level destination for the current route, the page body SHALL NOT render the same labels as another set of tabs or segmented controls at the same hierarchy.

Page-level tabs SHALL be used only for content inside the current entity or settings category, not for repeating the current sidebar branch.

#### Scenario: Cases page does not repeat sidebar branch

- **GIVEN** the sidebar contains `案件總覽`, `說明書工作台`, `補件清單`
- **WHEN** the user opens `/cases`
- **THEN** the main content SHALL NOT render the same three labels as page-level tabs

### Requirement: Primary actions SHALL be visually and behaviorally unique

Each repeated item, such as a case row, SHALL have one primary action. Secondary actions SHALL be visually secondary and SHALL not duplicate the primary action with different styling.

#### Scenario: Case row primary action is unique

- **GIVEN** a case row is visible
- **WHEN** the row can open the case workbench
- **THEN** another visually dominant `開啟工作台` button SHALL NOT appear unless it is the only visible primary action
- **AND** secondary icon actions SHALL remain clearly secondary

### Requirement: Case workbench SHALL use progressive disclosure

Case-scoped tools SHALL be progressively disclosed after the user selects a case. The first workbench screen SHALL show the current case and next required task; deeper tools SHALL appear as internal tabs, sections, or drawers.

#### Scenario: Field visit tools appear after case selection

- **GIVEN** the user is on `/cases`
- **THEN** `現場必問工作台` SHALL NOT be visible as a full work surface
- **WHEN** the user opens `/cases/:id`
- **THEN** the workbench SHALL expose `現場必問` as a case-scoped task when the case type supports field visit data

### Requirement: Customer-facing copy SHALL use business terms

Customer-facing UI SHALL use Traditional Chinese business terms instead of implementation labels.

##### Example: copy mapping

| Internal term | Customer-facing term |
| --- | --- |
| BASIC | 基本方案 |
| pro | 進階方案 |
| advanced | 進階方案 |
| MOI_API_005 | 建物所有權資料 |
| COP309 | 查詢未成功 |

#### Scenario: Automation cards use customer terms

- **GIVEN** an automation feature is upgrade-gated
- **WHEN** the customer sees the feature card
- **THEN** the card SHALL say `尚未升級` or `進階方案`
- **AND** the card SHALL NOT include raw plan enum text
