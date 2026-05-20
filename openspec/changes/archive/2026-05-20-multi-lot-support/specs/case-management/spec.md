## MODIFIED Requirements

### Requirement: case-land-lots-field

The `Case` data type SHALL include a `land_lots: string[]` field alongside the existing `land_lot_no: string` field. The `create_case` and `update_case` IPC commands SHALL accept an optional `land_lots` parameter; when provided, `land_lot_no` SHALL be synchronized to `land_lots[0]`.
