## ADDED Requirements

### Requirement: Parcel data pull status display

The case detail page SHALL display the status of land registry data pulls: "未查詢", "查詢中", "已完成", or "部分手動填寫". Each status SHALL be visually distinct (icon + color).

#### Scenario: Status shows after successful pull

- **WHEN** all 7 API endpoints returned successfully for a case
- **THEN** case detail shows "已完成" with green checkmark

##### Example: Full success status

- **GIVEN** case "case-001" has pull results for all 7 endpoints, all source "api"
- **WHEN** case detail page renders
- **THEN** status indicator shows green checkmark icon with text "已完成"

#### Scenario: Status shows partial manual

- **WHEN** 5 endpoints succeeded and 2 were manually entered
- **THEN** case detail shows "部分手動填寫" with yellow indicator

##### Example: Partial manual status

- **GIVEN** case "case-001" has 5 fields source "api" and 2 fields source "manual"
- **WHEN** case detail page renders
- **THEN** status shows yellow icon with text "部分手動填寫"

### Requirement: Balance warning banner on case page

When low_balance_warning is true, the case detail page SHALL display a yellow banner at the top with text "查詢餘額不足，請至設定頁確認" linking to the API key settings page.

#### Scenario: Banner appears when balance is low

- **WHEN** monthly queries are within 10 of the limit and low_balance_warning is true
- **THEN** yellow banner is visible at top of case detail page with link to /settings/api-key

##### Example: Low balance banner

- **GIVEN** monthly query count is 93 out of 100 limit (remaining = 7, low_balance_warning = true)
- **WHEN** case detail page renders
- **THEN** yellow banner displays "查詢餘額不足，請至設定頁確認" with clickable link to /settings/api-key
