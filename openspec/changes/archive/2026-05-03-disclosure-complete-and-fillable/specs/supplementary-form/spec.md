## ADDED Requirements

### Requirement: grouped-optional-field-sections

The supplementary form page SHALL display four collapsible sections for the new optional fields: 身份資訊, 交易資訊, 建物補充, 周遭機能.

#### Scenario: optional sections are collapsed by default

- **WHEN** the user opens the supplementary form page
- **THEN** the four new sections are collapsed by default; the user can expand any section to reveal and fill the fields

### Requirement: sale-price-in-wan-unit

The sale_price_text field in the form SHALL be labeled "成交價（萬元）" and accept numeric input representing units of 萬 (10,000 NTD). The stored value SHALL be the text string as-is; the conversion to NTD is performed at tax-calculation time.

#### Scenario: sale price input

- **WHEN** the user enters "800" in the 成交價（萬元）field and saves
- **THEN** supplementary_data.sale_price_text = "800", and tax-calculator converts this to 8,000,000 NTD for computation
