## ADDED Requirements

### Requirement: Paid query consent and cost SHALL be explicit before formal COP runs

系統 SHALL 在使用者執行付費正式查詢前，明確揭露查詢用途、費用與計費風險，且未經確認不得發動 formal COP。

#### Scenario: User sees cost before paid formal query

- **GIVEN** 案件已具備 confirmed registry key
- **WHEN** 使用者點擊正式查詢
- **THEN** 系統 SHALL 顯示本次查詢要取得的資料、預估費用與是否可能失敗仍計費
- **AND** 僅在使用者確認後才可執行付費正式查詢

#### Scenario: User skips paid formal query

- **GIVEN** 使用者不確認付費
- **WHEN** 正式查詢對話框關閉
- **THEN** 系統 SHALL 不執行 formal COP
- **AND** 案件仍可保留免費前查資料繼續後續流程

### Requirement: Post-signing formal supplement SHALL use catalog-driven pricing

The system SHALL calculate formal supplement costs from the COP service catalog, not from a fixed successful-item multiplier. Each paid line item SHALL include the API code, service name, unit price, billable quantity, estimated cost, actual cost when available, and whether a failed request can remain billable.

#### Scenario: Pre-signing stage has no paid formal line items

- **GIVEN** a case is still in the pre-signing pre-survey stage
- **WHEN** the user reviews the workbench, preview, or PDF export
- **THEN** the system SHALL show COP cost as zero
- **AND** SHALL NOT show ownership, other-right, mortgage, or electronic transcript fees as already required

#### Scenario: Post-signing formal supplement estimates ownership and other-right costs

- **GIVEN** a case has entered the signed formal supplement stage
- **AND** the user chooses to query ownership and other-right records
- **WHEN** the system opens the paid confirmation dialog
- **THEN** the system SHALL build the cost estimate from `moi-service-catalog`
- **AND** SHALL show each selected API as a separate priced line item
- **AND** SHALL NOT calculate the total as `successful item count * 10`

#### Scenario: Catalog pricing is missing

- **GIVEN** a selected formal supplement API has no catalog price
- **WHEN** the user attempts to confirm the paid query
- **THEN** the system SHALL block the paid query
- **AND** SHALL show a pricing configuration error instead of falling back to a fixed NT$10 estimate
