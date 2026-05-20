## ADDED Requirements

### Requirement: Page 7 renders buyer/seller fee table with auto-calculated taxes

The system SHALL render Page 7 of the disclosure document as a fee table that automatically calculates tax amounts from three user inputs: transaction price (交易價金), transfer date (交屋日), and usage type (使用性質：住家/營業).

#### Scenario: Buyer taxes auto-calculated

- **GIVEN** `contractPrice = 1000000`, `officialLandValue = 800000`, `shareRatio = 1.0`
- **WHEN** `DossierPage7FeeTable` renders
- **THEN** `data-testid="fee-stamp-tax"` shows 1800 (元)
- **AND** `data-testid="fee-deed-tax"` shows 60000 (元)

#### Scenario: Seller building tax for residential usage

- **GIVEN** `buildingCurrentValue = 200000`, `usage = "residential"`
- **WHEN** `DossierPage7FeeTable` renders
- **THEN** `data-testid="fee-building-tax"` shows 2400 (元)

#### Scenario: Seller building tax for commercial usage

- **GIVEN** `buildingCurrentValue = 200000`, `usage = "commercial"`
- **THEN** `data-testid="fee-building-tax"` shows 6000 (元)

#### Scenario: Land value tax (LVT) not calculated — explanation shown

- **WHEN** any case renders Page 7
- **THEN** the LVT row displays a static explanation text instead of a calculated amount: "土地增值稅依地政機關核定，請洽詢稅捐稽徵處"

#### Scenario: Disclaimer shown below fee table

- **WHEN** Page 7 renders
- **THEN** the disclaimer text appears: "上述應納稅額僅為概算，正確稅額依稅捐機關核發稅單之金額為準"

### Requirement: Page 8 renders land value tax notes

The system SHALL render Page 8 of the disclosure document as a static section containing seven fixed explanatory notes about land value tax calculation conditions.

#### Scenario: All seven notes present

- **WHEN** `DossierPage8TaxNotes` is rendered
- **THEN** all seven notes are present; the fifth note SHALL contain the text "非都市土地持分面積>700m²"
