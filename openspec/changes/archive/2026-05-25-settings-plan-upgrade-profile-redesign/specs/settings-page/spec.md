## ADDED Requirements

### Requirement: Settings section scope

The settings page SHALL render the selected settings section only. The default `/settings` route SHALL render 個人設定. Customer settings sections SHALL NOT show development-only Super Admin controls or engineering labels.

#### Scenario: Default settings route renders personal settings

- **WHEN** the user opens `/settings`
- **THEN** the page heading is 個人設定
- **AND** the page shows 帳號與授權管理、更新密碼、個人名稱與 Email、品牌色、目前操作紀錄

#### Scenario: Plans section replaces feature toggles

- **WHEN** the user opens `/settings?section=plans`
- **THEN** the page heading is 方案與升級
- **AND** the page shows 基本款、進階款、高級款
- **AND** the page does not show MCP Hub
