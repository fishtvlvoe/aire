## ADDED Requirements

### Requirement: land-value-increment-approximation

When `announced_land_price`, `previous_transfer_value`, `land_area`, and `rights_range` are all present and valid, the system SHALL compute approximate land value increment tax values and store them in `system_computed`:

- `computed_land_increment_general_approx` — 一般稅率試算（previous_transfer_value × 0.1）
- `computed_land_increment_self_use_approx` — 自用稅率試算（previous_transfer_value × 0.08）

If any required input is missing or non-numeric, BOTH fields SHALL be omitted from `system_computed` (not null, not zero — simply absent).

These values are approximations. The LLM prompt SHALL label them as「試算近似值，以主管機關核定為準」.

#### Scenario: all inputs present

- **WHEN** previous_transfer_value = 5000000, announced_land_price = 10188, land_area = 50, rights_range = "1/1"
- **THEN** system_computed includes computed_land_increment_general_approx = 500000 and computed_land_increment_self_use_approx = 400000

#### Scenario: previous_transfer_value absent

- **WHEN** previous_transfer_value is undefined
- **THEN** computed_land_increment_general_approx and computed_land_increment_self_use_approx are NOT present in system_computed

##### Example: absent field produces no keys

| Input | system_computed result |
|-------|----------------------|
| previous_transfer_value = undefined | computed_land_increment_general_approx key does not exist; computed_land_increment_self_use_approx key does not exist |

## MODIFIED Requirements

### Requirement: null-output-for-missing-inputs

When sale_price or house_assessed_value is absent, the system SHALL output null for the corresponding computed fields; those fields SHALL appear as empty cells in the PDF (no placeholder text, no "待補" label).

#### Scenario: missing sale_price

- **WHEN** sale_price is empty and house_assessed_value = 1200000
- **THEN** 契稅 = 72000 (computed from house_assessed_value only), but 登記規費, 印花稅, 履保費 fields in the PDF are completely empty (no text)

#### Scenario: all tax inputs missing

- **WHEN** both sale_price and house_assessed_value are absent
- **THEN** all Chapter 10 tax fields in the PDF are empty — no placeholder text, no explanatory phrases appear
