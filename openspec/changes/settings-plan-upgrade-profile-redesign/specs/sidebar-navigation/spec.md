## ADDED Requirements

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
