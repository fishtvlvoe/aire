## ADDED Requirements

### Requirement: Pre-charge confirmation dialog

Before executing a billable data pull, the system SHALL display a PreChargeConfirmDialog showing the number of API calls, estimated cost, and a confirm/cancel choice.

#### Scenario: Confirmation shows cost estimate

- **WHEN** user has consented and system is about to pull 3 API endpoints
- **THEN** dialog shows "本次預計查詢 3 支 API，預估費用 NT$30，確定要拉嗎？"

##### Example: Cost calculation

| API Count | Unit Price | Displayed Total |
| --------- | ---------- | --------------- |
| 1         | NT$10      | NT$10           |
| 7         | NT$10      | NT$70           |
| 3         | NT$10      | NT$30           |

### Requirement: Cancel aborts pull

If user clicks cancel on the confirmation dialog, the system SHALL NOT execute any API calls and SHALL NOT record any billing entries.

#### Scenario: Cancel prevents API calls

- **WHEN** user clicks "取消" on PreChargeConfirmDialog
- **THEN** no API calls are made and billing_log has no new entries

### Requirement: Confirm proceeds to pull

If user clicks confirm, the system SHALL proceed with the data pull and record all billing entries.

#### Scenario: Confirm triggers pull

- **WHEN** user clicks "確定" on PreChargeConfirmDialog
- **THEN** system executes all requested API calls and records results in billing_log
