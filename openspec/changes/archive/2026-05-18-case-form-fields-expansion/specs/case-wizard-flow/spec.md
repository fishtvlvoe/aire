## ADDED Requirements

### Requirement: Step 1 includes asking price field
Wizard Step 1 (基本資料) SHALL render a numeric input labelled "售價（萬元）" bound to the `asking_price` field of the case. The input SHALL accept only positive integers (or empty). On blur, the displayed value SHALL be the integer entered; on save the system converts 萬元 to NTD by multiplying by 10000 before calling `update_case` IPC.

#### Scenario: User enters asking price in Step 1
- **WHEN** user types "2500" into 售價（萬元）and advances to Step 2
- **THEN** `update_case` is called with `asking_price: 25000000`

#### Scenario: Empty asking price
- **WHEN** user leaves 售價（萬元）blank and advances to Step 2
- **THEN** `update_case` is called with `asking_price: null`

### Requirement: Step 2 includes building lot number field
Wizard Step 2 (地政資料) SHALL render a text input labelled "建號" bound to the `building_lot_no` field of the case. The field SHALL be optional. On save the value is stored via `update_case` IPC.

#### Scenario: User enters building lot number in Step 2
- **WHEN** user types "556-1" into 建號 and advances to Step 3 or Step 4
- **THEN** `update_case` is called with `building_lot_no: "556-1"`
