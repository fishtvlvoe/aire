## ADDED Requirements

### Requirement: multi-lot-storage

A `Case` SHALL have a `land_lots` field (`string[]`) containing at least one non-empty land lot number. The `land_lot_no` field SHALL be kept in sync with `land_lots[0]`. When `land_lots` is empty or absent (legacy data), the system SHALL fall back to `[land_lot_no]`. Empty string entries in `land_lots` SHALL be filtered out before persistence.

##### Example: land_lots sync with land_lot_no

| land_lots input | stored land_lot_no | stored land_lots |
|---|---|---|
| `["123-4"]` | `"123-4"` | `["123-4"]` |
| `["123-4","456-7"]` | `"123-4"` | `["123-4","456-7"]` |
| `[]` (all empty) | error: missing_field | — |

### Requirement: multi-lot-ipc

`create_case` and `update_case` IPC commands SHALL accept an optional `land_lots: Vec<String>` parameter. If provided, `land_lot_no` SHALL be set to `land_lots[0]`. If not provided, `land_lots` SHALL default to `[land_lot_no]`. A `land_lots` array with all empty entries SHALL return error code `missing_field`.

#### Scenario: create case with multiple lots

- **GIVEN** a create_case input with `land_lots: ["123-4","456-7"]`
- **WHEN** the command executes
- **THEN** the stored case has `land_lot_no: "123-4"` and `land_lots: ["123-4","456-7"]`

### Requirement: multi-lot-ui

The case creation and edit forms SHALL render a multi-value input for land lots with `data-testid="case-lot-inputs"`. The user SHALL be able to add rows with a "＋" button and remove rows when more than one exists. The last remaining row SHALL NOT be removable.

### Requirement: multi-lot-disclosure-rendering

The "土地標示" section of disclosure forms SHALL render all entries in `land_lots` as an ordered list. Each lot entry SHALL be in a container with `data-testid="land-lots-list"`.
