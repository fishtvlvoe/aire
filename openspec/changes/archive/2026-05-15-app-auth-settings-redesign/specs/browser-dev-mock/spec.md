## ADDED Requirements

### Requirement: Extended mock commands for settings

The mock backend SHALL support the following additional commands:

- `get_land_api_settings() -> { clientId: string, secret: string }`
- `save_land_api_settings({ clientId: string, secret: string }) -> { success: true }`
- `test_land_api_connection() -> { success: boolean, latency_ms: number }`
- `get_premium_status() -> { subscribed: boolean, plan: string | null, expires_at: string | null }`
- `subscribe_premium() -> { redirect_url: string }`
- `get_feature_flags() -> Array<{ id: string, name: string, enabled: boolean }>`
- `toggle_feature_flag({ id: string }) -> { success: true, enabled: boolean }`

#### Scenario: Get land API settings default

- **GIVEN** a fresh mock store
- **WHEN** `get_land_api_settings` is called
- **THEN** returns `{ clientId: "", secret: "" }`

##### Example: Default land API settings

- **GIVEN** `__resetMockStoreForTests()` was called
- **WHEN** `mockInvoke("get_land_api_settings")`
- **THEN** result is `{ clientId: "", secret: "" }`

#### Scenario: Save and retrieve land API settings

- **GIVEN** a fresh mock store
- **WHEN** `save_land_api_settings({ clientId: "c1", secret: "s1" })` is called
- **THEN** returns `{ success: true }`
- **THEN** subsequent `get_land_api_settings` returns `{ clientId: "c1", secret: "s1" }`

##### Example: Save then get

- **GIVEN** fresh store
- **WHEN** `mockInvoke("save_land_api_settings", { clientId: "c1", secret: "s1" })`
- **THEN** result is `{ success: true }`
- **WHEN** `mockInvoke("get_land_api_settings")`
- **THEN** result is `{ clientId: "c1", secret: "s1" }`

#### Scenario: Test land API connection mock

- **WHEN** `test_land_api_connection` is called
- **THEN** the response SHALL be delayed by approximately 500ms
- **THEN** returns `{ success: true, latency_ms: <number> }`

##### Example: Connection test mock

- **WHEN** `mockInvoke("test_land_api_connection")`
- **THEN** result has `success: true` and `latency_ms` is a number greater than 0

#### Scenario: Get premium status default

- **GIVEN** a fresh mock store
- **WHEN** `get_premium_status` is called
- **THEN** returns `{ subscribed: false, plan: null, expires_at: null }`

##### Example: Default premium status

- **GIVEN** fresh store
- **WHEN** `mockInvoke("get_premium_status")`
- **THEN** result is `{ subscribed: false, plan: null, expires_at: null }`

#### Scenario: Subscribe premium redirect

- **WHEN** `subscribe_premium` is called
- **THEN** returns `{ redirect_url: "https://opcos.tw/checkout/mcp-hub" }`

##### Example: Subscribe redirect URL

- **WHEN** `mockInvoke("subscribe_premium")`
- **THEN** result is `{ redirect_url: "https://opcos.tw/checkout/mcp-hub" }`

#### Scenario: Feature flags default list

- **GIVEN** a fresh mock store
- **WHEN** `get_feature_flags` is called
- **THEN** returns at least 3 flags: `premium-unlock` (false), `mcp-hub` (false), `land-registry-api` (true)

##### Example: Default flags

- **GIVEN** fresh store
- **WHEN** `mockInvoke("get_feature_flags")`
- **THEN** result includes `{ id: "premium-unlock", name: "進階功能解鎖", enabled: false }`
- **THEN** result includes `{ id: "mcp-hub", name: "MCP Hub", enabled: false }`
- **THEN** result includes `{ id: "land-registry-api", name: "地政 API", enabled: true }`

#### Scenario: Toggle feature flag

- **GIVEN** flag `mcp-hub` is `false`
- **WHEN** `toggle_feature_flag({ id: "mcp-hub" })` is called
- **THEN** returns `{ success: true, enabled: true }`
- **THEN** subsequent `get_feature_flags` shows `mcp-hub` as `true`

##### Example: Toggle mcp-hub on

- **GIVEN** `mcp-hub` flag is `false`
- **WHEN** `mockInvoke("toggle_feature_flag", { id: "mcp-hub" })`
- **THEN** result is `{ success: true, enabled: true }`
- **WHEN** `mockInvoke("get_feature_flags")`
- **THEN** `mcp-hub` item has `enabled: true`

### Requirement: No trial period text in mock responses

All mock responses SHALL NOT contain text referencing "30天", "30 天", "30日", "試用期", or "trial".

#### Scenario: Clean mock responses

- **WHEN** any mock command is called
- **THEN** the JSON response SHALL NOT contain any trial period references

##### Example: License status text

- **GIVEN** fresh store, license status is `"none"`
- **WHEN** `mockInvoke("get_license_status")`
- **THEN** result does NOT contain string "30天" or "trial"

### Requirement: localStorage persistence for all settings

All settings data (license, landApi, premium, featureFlags) SHALL be persisted to localStorage via the existing `aire-mock-store` key.

#### Scenario: Settings survive page reload

- **GIVEN** user saved land API settings `{ clientId: "c1", secret: "s1" }`
- **WHEN** a new MockStore instance is created (simulating page reload)
- **THEN** `get_land_api_settings` returns `{ clientId: "c1", secret: "s1" }`

##### Example: Persistence across instances

- **GIVEN** `save_land_api_settings({ clientId: "c1", secret: "s1" })` was called
- **WHEN** `new MockStore()` is created
- **THEN** `store.invoke("get_land_api_settings")` returns `{ clientId: "c1", secret: "s1" }`
