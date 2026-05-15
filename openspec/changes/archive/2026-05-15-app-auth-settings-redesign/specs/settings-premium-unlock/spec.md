## ADDED Requirements

### Requirement: Premium unlock section display

The Settings page SHALL display a PremiumUnlockSection card as the third section.

- **WHEN** the user navigates to the Settings page
- **THEN** the system SHALL display the premium subscription status by calling `get_premium_status()`

#### Scenario: Not subscribed

- **GIVEN** the premium status `subscribed` is `false`
- **WHEN** the user views the PremiumUnlockSection
- **THEN** the system SHALL display:
  - A heading "實價登錄 MCP Hub"
  - A description of the premium feature capabilities
  - A price indication "NT$ 月費訂閱"
  - A "前往訂閱" CTA button

##### Example: Unsubscribed state

- **GIVEN** `get_premium_status` returns `{ subscribed: false, plan: null, expires_at: null }`
- **WHEN** PremiumUnlockSection renders
- **THEN** heading text is "實價登錄 MCP Hub"
- **THEN** "前往訂閱" button is visible and enabled

#### Scenario: Subscribe redirect

- **GIVEN** the premium status `subscribed` is `false`
- **WHEN** the user clicks "前往訂閱"
- **THEN** the system SHALL call `subscribe_premium()`
- **THEN** the system SHALL open the returned `redirect_url` in the system browser

##### Example: Subscribe click

- **GIVEN** `subscribe_premium` returns `{ redirect_url: "https://opcos.tw/checkout/mcp-hub" }`
- **WHEN** user clicks "前往訂閱"
- **THEN** system browser opens `"https://opcos.tw/checkout/mcp-hub"`

#### Scenario: Already subscribed

- **GIVEN** the premium status `subscribed` is `true` with plan `"mcp-hub-monthly"` and expires_at `"2026-07-01T00:00:00+08:00"`
- **WHEN** the user views the PremiumUnlockSection
- **THEN** the system SHALL display:
  - A green Badge "訂閱中"
  - Plan name "MCP Hub 月費方案"
  - Expiration date in ROC format
  - A "管理訂閱" link

##### Example: Subscribed state

- **GIVEN** `get_premium_status` returns `{ subscribed: true, plan: "mcp-hub-monthly", expires_at: "2026-07-01T00:00:00+08:00" }`
- **WHEN** PremiumUnlockSection renders
- **THEN** Badge shows "訂閱中" in green
- **THEN** plan text shows "MCP Hub 月費方案"
- **THEN** "管理訂閱" link is visible
