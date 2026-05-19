# Tax Fee Pages

## MODIFIED Requirements

### Requirement: fee-stamp-tax testid in KeyinSplitPage

**Status**: Modified

**Previously**: The stamp tax calculation result in `KeyinSplitPage` had no `data-testid` attribute.

**Updated**: The element displaying the computed stamp tax fee SHALL have `data-testid="fee-stamp-tax"` so that tests and E2E automation can assert its value.

**Acceptance Criteria**:
- The element rendering the stamp tax amount in `KeyinSplitPage.tsx` has `data-testid="fee-stamp-tax"`
- When `formState` contains valid `transaction_price`, `tax_land_value`, `tax_building_value`, `usage_type`, `transfer_date`, the element displays the computed fee value (e.g., `1800`)
- When `formState` is empty, the element displays `—` (em dash placeholder)
- Test `"shows fee-stamp-tax=1800 when formState has valid tax fields"` passes
