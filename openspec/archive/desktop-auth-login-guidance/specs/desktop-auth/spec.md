## ADDED Requirements

### Requirement: Desktop auth login guidance

The Desktop login page SHALL tell website-authenticated customers how to obtain a Desktop login method without implying that Google or LINE OAuth credentials are stored in the Desktop app.

#### Scenario: Google or LINE purchaser sees desktop-code guidance

- **WHEN** the user opens the Desktop login page
- **THEN** the page SHALL tell Google or LINE purchasers to generate a Desktop login code on opcos.me
- **AND** the help link SHALL point to an opcos.me AIRE desktop-login entry

##### Example: Login page help copy

- **GIVEN** the login page is rendered
- **WHEN** the user reads the account help text
- **THEN** `Google 或 LINE 購買用戶請先在 opcos.me 產生桌面登入碼。` SHALL be visible
- **AND** the `用 Google 或 LINE 購買？` link SHALL use `https://opcos.me/products/aire?intent=desktop-login`
