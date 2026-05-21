## MODIFIED Requirements

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
  - A price or upgrade indication that does not imply payment is already connected
  - A "前往升級" CTA button

##### Example: Unsubscribed state

- **GIVEN** `get_premium_status` returns `{ subscribed: false, plan: null, expires_at: null }`
- **WHEN** PremiumUnlockSection renders
- **THEN** heading text is "實價登錄 MCP Hub"
- **THEN** "前往升級" button is visible and enabled

#### Scenario: Upgrade redirect

- **GIVEN** the premium status `subscribed` is `false`
- **WHEN** the user clicks "前往升級"
- **THEN** the system SHALL call `subscribe_premium()`
- **THEN** the system SHALL open the returned `redirect_url` in the system browser
- **THEN** the URL SHALL point to `https://opcos.me/products/aire?intent=request-access`

##### Example: Upgrade click

- **GIVEN** `subscribe_premium` returns `{ redirect_url: "https://opcos.me/products/aire?intent=request-access" }`
- **WHEN** user clicks "前往升級"
- **THEN** system browser opens `"https://opcos.me/products/aire?intent=request-access"`

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

#### Scenario: Admin sees unlocked state

- **WHEN** an admin user with `role === "admin"` navigates to 設定 > 進階功能
- **THEN** the 實價登錄 MCP Hub card SHALL render with label "已啟用（管理員）"
- **THEN** the "前往升級" button SHALL NOT be present in the DOM

##### Example: Admin state

- **GIVEN** sessionUser is `{ email: "admin@test.aire", role: "admin" }`
- **WHEN** PremiumUnlockSection renders
- **THEN** the card shows "已啟用（管理員）"
- **THEN** no button with text "前往升級" exists

#### Scenario: Non-admin still sees upgrade gate

- **WHEN** a non-admin user with `role !== "admin"` navigates to 設定 > 進階功能
- **WHEN** the user does not have an active subscription
- **THEN** the MCP Hub card SHALL show the "前往升級" button

##### Example: Staff state

- **GIVEN** sessionUser is `{ email: "staff@test.aire", role: "staff" }` and subscription is null
- **WHEN** PremiumUnlockSection renders
- **THEN** the card shows "前往升級" button
