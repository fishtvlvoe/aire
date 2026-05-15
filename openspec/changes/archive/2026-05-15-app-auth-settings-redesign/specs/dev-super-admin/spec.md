## ADDED Requirements

### Requirement: Developer Super Admin panel visibility

- **WHEN** `NODE_ENV` equals `"development"`
- **THEN** the Settings page SHALL render a DevSuperAdmin section at the bottom

- **WHEN** `NODE_ENV` does NOT equal `"development"`
- **THEN** the DevSuperAdmin section SHALL NOT be rendered (zero DOM footprint)

#### Scenario: Development environment

- **GIVEN** `NODE_ENV` is `"development"`
- **WHEN** the Settings page renders
- **THEN** DevSuperAdmin section is present in DOM

##### Example: Dev mode rendering

- **GIVEN** `process.env.NODE_ENV === "development"`
- **WHEN** Settings page loads
- **THEN** a section with heading "Super Admin" is visible at page bottom

#### Scenario: Production environment

- **GIVEN** `NODE_ENV` is `"production"`
- **WHEN** the Settings page renders
- **THEN** DevSuperAdmin section is NOT in DOM (no hidden element, zero footprint)

### Requirement: Feature flags management

- **WHEN** the DevSuperAdmin section is rendered
- **THEN** the system SHALL call `get_feature_flags()`
- **THEN** each feature flag SHALL be displayed as a row with name label and Switch toggle

#### Scenario: Toggle a feature flag on

- **GIVEN** a feature flag `{ id: "mcp-hub", name: "MCP Hub", enabled: false }`
- **WHEN** the developer toggles the switch to on
- **THEN** the system SHALL call `toggle_feature_flag({ id: "mcp-hub" })`
- **THEN** the switch SHALL reflect the new state `enabled: true`

##### Example: Enable mcp-hub flag

- **GIVEN** `get_feature_flags` returns `[{ id: "mcp-hub", name: "MCP Hub", enabled: false }]`
- **WHEN** user clicks the Switch for "MCP Hub"
- **THEN** `toggle_feature_flag({ id: "mcp-hub" })` returns `{ success: true, enabled: true }`
- **THEN** Switch shows "on" state

#### Scenario: Toggle a feature flag off

- **GIVEN** a feature flag `{ id: "mcp-hub", name: "MCP Hub", enabled: true }`
- **WHEN** the developer toggles the switch to off
- **THEN** the system SHALL call `toggle_feature_flag({ id: "mcp-hub" })`
- **THEN** the switch SHALL reflect the new state `enabled: false`

##### Example: Disable mcp-hub flag

- **GIVEN** `get_feature_flags` returns `[{ id: "mcp-hub", name: "MCP Hub", enabled: true }]`
- **WHEN** user clicks the Switch for "MCP Hub"
- **THEN** `toggle_feature_flag({ id: "mcp-hub" })` returns `{ success: true, enabled: false }`
- **THEN** Switch shows "off" state

#### Scenario: Default feature flags

- **WHEN** the DevSuperAdmin section loads for the first time
- **THEN** the system SHALL display at least 3 flags:
  - `premium-unlock` — "進階功能解鎖" (default: `false`)
  - `mcp-hub` — "MCP Hub" (default: `false`)
  - `land-registry-api` — "地政 API" (default: `true`)

##### Example: Initial flags list

- **GIVEN** fresh mock store
- **WHEN** DevSuperAdmin renders
- **THEN** 3 rows displayed: "進階功能解鎖" (off), "MCP Hub" (off), "地政 API" (on)
