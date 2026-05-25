## ADDED Requirements

### Requirement: 方案與升級頁顯示開發中功能開關

The Settings page SHALL render the 方案與升級 feature availability section as customer-facing feature rows, not as test-build entitlement copy.

- **WHEN** a user navigates to `/settings?section=plans`
- **THEN** the feature availability section SHALL list exactly these six feature names in order:
  - Google 地圖
  - 空拍圖
  - 街景參考
  - AI 格局圖整理
  - 地籍圖整理
  - 實價登錄
- **THEN** each row SHALL display status text `開發中`
- **THEN** no row SHALL display text containing `測試版已開啟` or `正式版歸在`

#### Scenario: Default customer state is off and disabled

- **GIVEN** the current session user is not an admin
- **WHEN** the user opens `/settings?section=plans`
- **THEN** all six feature switches SHALL be visually off
- **THEN** all six feature switches SHALL be disabled

##### Example: non-admin feature row

- **GIVEN** sessionUser is `{ email: "user@test.aire", role: "user" }`
- **WHEN** the plans settings page renders
- **THEN** the Google 地圖 switch has accessible name `Google 地圖開發中`
- **THEN** the switch is disabled and not pressed

#### Scenario: Super admin can toggle development feature rows

- **GIVEN** the current session user is an admin
- **WHEN** the admin opens `/settings?section=plans`
- **THEN** all six feature switches SHALL be enabled controls
- **WHEN** the admin clicks `實價登錄開發中`
- **THEN** the switch SHALL update to the enabled visual state

##### Example: admin toggles real price

- **GIVEN** sessionUser is `{ email: "admin@test.aire", role: "admin" }`
- **AND** feature flag `real-price` is disabled
- **WHEN** the admin clicks the `實價登錄開發中` switch
- **THEN** `toggle_feature_flag` is called with id `real-price`
- **THEN** the row remains labelled `實價登錄` with status `開發中`
