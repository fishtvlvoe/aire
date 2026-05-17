## MODIFIED Requirements

### Requirement: tax-calculation-from-inputs

When sale_price and house_assessed_value are present in supplementary_data, the assembleDossierData function SHALL call calculateTaxFees and store the result in CaseDossierData.taxCalculation using the individual-field format defined by the CaseDossierData interface. The taxCalculation object SHALL contain landValueIncrementTax, landValueIncrementTaxPreferential, deedTax, stampTax, registrationFee, scrivenerFee, totalSellerCost, totalBuyerCost, and warnings fields directly — NOT as sellerFees/buyerFees arrays.

#### Scenario: assembleDossierData populates taxCalculation from supplementary inputs

- **WHEN** assembleDossierData is called with supplementary_data containing sale_price 10000000 and house_assessed_value 1200000
- **THEN** CaseDossierData.taxCalculation SHALL contain deedTax 72000, stampTax 10000, registrationFee 10000, scrivenerFee 12000

#### Scenario: assembleDossierData omits taxCalculation when inputs missing

- **WHEN** assembleDossierData is called with supplementary_data missing both sale_price and house_assessed_value
- **THEN** CaseDossierData.taxCalculation SHALL be null

### Requirement: null-output-for-missing-inputs

When sale_price is absent but house_assessed_value is present, calculateTaxFees SHALL compute deedTax from house_assessed_value and set all price-dependent fields (stampTax, registrationFee) to 0.

#### Scenario: partial inputs with house_assessed_value only

- **WHEN** calculateTaxFees is called with totalPrice 0 and assessedHouseValue 1200000
- **THEN** deedTax SHALL equal 72000 and stampTax SHALL equal 0 and registrationFee SHALL equal 0
