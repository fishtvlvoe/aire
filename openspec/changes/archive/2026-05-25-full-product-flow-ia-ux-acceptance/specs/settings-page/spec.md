## ADDED Requirements

### Requirement: Settings section scope

The settings page SHALL render the selected settings section only. It SHALL NOT render a page-internal category sidebar duplicating the global sidebar. Customer settings sections SHALL NOT show development-only Super Admin controls.

#### Scenario: Feature toggles render once

- **WHEN** the user opens `/settings?section=features`
- **THEN** the page heading is 功能開關
- **AND** exactly one 授權與升級 toggle list is rendered
- **AND** 授權管理、實價登錄 MCP Hub, and Super Admin are not rendered

##### Example: feature section content

- **GIVEN** the URL is `/settings?section=features`
- **WHEN** the page renders
- **THEN** there is one heading named 授權與升級
- **AND** there is no text 授權管理
- **AND** there is no text 實價登錄 MCP Hub
- **AND** there is no text Super Admin

#### Scenario: Settings content has no duplicate category rail

- **WHEN** the user opens `/settings`, `/settings?section=features`, or `/settings?section=entitlements`
- **THEN** the page does not render a 設定分類 heading or duplicated category links inside the content area

##### Example: no internal settings category

- **GIVEN** the URL is `/settings?section=entitlements`
- **WHEN** the page renders
- **THEN** there is no heading named 設定分類
