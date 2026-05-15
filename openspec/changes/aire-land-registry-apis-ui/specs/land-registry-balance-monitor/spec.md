## ADDED Requirements

### Requirement: Balance display from local billing log

The system SHALL display current month query count and total cost by aggregating the local billing_log table. The display SHALL update after each API call completes.

#### Scenario: Balance shows monthly totals

- **WHEN** user opens settings page or case detail page
- **THEN** the system displays "本月查詢 N 次，費用 NT$X"

##### Example: After 5 queries

- **GIVEN** billing_log has 5 successful calls this month at 10 cents each
- **WHEN** balance monitor renders
- **THEN** displays "本月查詢 5 次，費用 NT$50"

### Requirement: Low balance warning

When monthly query count exceeds a threshold minus 10 (i.e., fewer than 10 remaining), the system SHALL display a warning banner.

#### Scenario: Low balance warning shown

- **WHEN** monthly queries reach 90 out of 100 limit
- **THEN** system shows yellow warning "剩餘查詢次數不足 10 次，請注意用量"

##### Example: Warning threshold

- **GIVEN** monthly limit is 100, current count is 93
- **WHEN** balance monitor renders
- **THEN** displays yellow warning text "剩餘查詢次數不足 10 次，請注意用量"

### Requirement: Balance banner on case page

The case detail page SHALL show a compact balance banner when low_balance_warning is true. The banner SHALL link to the settings page.

#### Scenario: Banner visible on case page when balance is low

- **WHEN** user is on case detail page and balance is low
- **THEN** a yellow banner appears at top linking to settings

##### Example: Banner on case page

- **GIVEN** get_balance returns low_balance_warning = true
- **WHEN** case detail page for case "case-001" loads
- **THEN** yellow banner "查詢餘額不足，請至設定頁確認" with link to /settings/api-key is visible at page top
