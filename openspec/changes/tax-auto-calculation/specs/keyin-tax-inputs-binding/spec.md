## ADDED Requirements

### Requirement: formState-to-tax-inputs-binding

KeyinSplitPage SHALL expose a `formStateToTaxInputs` pure function that converts formState fields into a `TaxInputs` object. The function SHALL return `undefined` when any of `contractPrice`, `officialLandValue`, or `buildingCurrentValue` evaluates to 0 or is absent.

#### Scenario: valid formState produces TaxInputs

- **GIVEN** formState contains transaction_price=1000000, tax_land_value=800000, tax_building_value=200000, usage_type="residential", transfer_date="2024-01-01"
- **WHEN** formStateToTaxInputs is called
- **THEN** result SHALL be `TaxInputs { contractPrice: 1000000, officialLandValue: 800000, shareRatio: 1, buildingCurrentValue: 200000, transactionDate: "2024-01-01", usage: "residential" }`

#### Scenario: zero contractPrice returns undefined

- **GIVEN** formState contains transaction_price=0, tax_land_value=800000, tax_building_value=200000
- **WHEN** formStateToTaxInputs is called
- **THEN** result SHALL be `undefined`

#### Scenario: zero officialLandValue returns undefined

- **GIVEN** formState contains transaction_price=1000000, tax_land_value=0, tax_building_value=200000
- **WHEN** formStateToTaxInputs is called
- **THEN** result SHALL be `undefined`

---
### Requirement: keyin-preview-live-tax-display

KeyinSplitPage SHALL pass the computed taxInputs (or undefined) to DisclosureHtmlPreview via the `taxInputs` prop. When taxInputs is valid, the preview SHALL render `data-testid="fee-stamp-tax"` with the calculated stamp tax value. When taxInputs is undefined, the preview SHALL display "—" in the fee section.

#### Scenario: preview shows stamp tax when form has all required fields

- **GIVEN** KeyinSplitPage renders with formState { transaction_price: 1000000, tax_land_value: 800000, tax_building_value: 200000, usage_type: "residential" }
- **WHEN** the component mounts and formState is applied
- **THEN** `data-testid="fee-stamp-tax"` SHALL contain "1800"

#### Scenario: preview shows dash when form is incomplete

- **GIVEN** KeyinSplitPage renders with empty formState
- **WHEN** the component mounts
- **THEN** the fee section SHALL display "—"
