# tax-calculation-engine Specification

## Purpose

TBD - created by archiving change 'disclosure-smart-draft'. Update Purpose after archive.

## Requirements

### Requirement: Calculate land value increment tax

The system SHALL calculate 土地增值稅 (Land Value Increment Tax) using both general rate (一般稅率) and preferential rate (自用住宅優惠稅率 10%). The calculation SHALL use the formula: (current announced value - previous transfer value) × applicable rate × holding multiplier.

#### Scenario: General rate calculation

- **WHEN** calculateTaxFees is called with totalPrice=10000000, announcedLandValue=5000000, holdingYears=3, isFirstSale=false
- **THEN** the system SHALL return landValueIncrementTax computed at progressive rates (20%/30%/40% tiers based on increment ratio)

#### Scenario: Preferential rate calculation

- **WHEN** calculateTaxFees is called with isFirstSale=true (self-use residential)
- **THEN** the system SHALL return landValueIncrementTaxPreferential at flat 10% rate

#### Scenario: Zero increment

- **WHEN** current announced value equals or is less than previous transfer value
- **THEN** landValueIncrementTax and landValueIncrementTaxPreferential SHALL both be 0

---
### Requirement: Calculate deed tax

The system SHALL calculate 契稅 (Deed Tax) at 6% of the assessed house value for purchases.

#### Scenario: Standard deed tax

- **WHEN** propertyType is building and totalPrice is provided
- **THEN** deedTax SHALL equal assessedHouseValue × 0.06

---
### Requirement: Calculate stamp tax

The system SHALL calculate 印花稅 (Stamp Tax) at 0.1% of the contract price.

#### Scenario: Standard stamp tax

- **WHEN** totalPrice=10000000
- **THEN** stampTax SHALL equal 10000 (10000000 × 0.001)

---
### Requirement: Calculate registration fee

The system SHALL calculate 登記規費 (Registration Fee) at 0.1% of the declared value for ownership transfer.

#### Scenario: Standard registration fee

- **WHEN** declared property value is 8000000
- **THEN** registrationFee SHALL equal 8000

---
### Requirement: Calculate scrivener fee

The system SHALL include a configurable 代書費 (Scrivener Fee) with default value of 12000 for standard transfer.

#### Scenario: Default scrivener fee

- **WHEN** no custom scrivener fee is provided
- **THEN** scrivenerFee SHALL default to 12000

---
### Requirement: Aggregate seller and buyer costs

The system SHALL separately total costs for seller (賣方) and buyer (買方):
- Seller: 土地增值稅 + 代書費(賣方部分)
- Buyer: 契稅 + 印花稅 + 登記規費 + 代書費(買方部分)

#### Scenario: Cost aggregation

- **WHEN** all individual taxes are calculated
- **THEN** totalSellerCost SHALL equal sum of seller items and totalBuyerCost SHALL equal sum of buyer items

---
### Requirement: Handle invalid inputs

The system SHALL handle invalid inputs gracefully without throwing exceptions.

#### Scenario: Negative or zero total price

- **WHEN** totalPrice is 0 or negative
- **THEN** all tax fields SHALL be 0 and warnings array SHALL contain "總價必須為正數"
