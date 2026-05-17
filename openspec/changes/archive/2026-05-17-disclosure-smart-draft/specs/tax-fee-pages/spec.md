## ADDED Requirements

### Requirement: Render land value increment tax estimate page

The system SHALL render a "增值稅概算表" page in the PDF following the client format (不動產說明書9.pdf). The page SHALL display: 前次移轉現值, 本次公告現值, 漲價總數額, 一般稅率計算, 自用住宅優惠稅率計算.

#### Scenario: Tax estimate page with calculated values

- **WHEN** CaseDossierData contains taxCalculation with non-zero values
- **THEN** the PDF SHALL render the estimate table with all computed fields filled

#### Scenario: Tax estimate page in draft mode

- **WHEN** taxCalculation is null (no total price provided yet)
- **THEN** the PDF SHALL render the page structure with all value cells blank

### Requirement: Render fee summary page

The system SHALL render a "費用一覽表" page following the client format (不動產說明書8.pdf). The page SHALL have two sections: 賣方費用 (8 items) and 買方費用 (6 items), each with item name and amount columns.

#### Scenario: Fee summary with computed values

- **WHEN** taxCalculation is populated
- **THEN** the PDF SHALL display seller costs (土地增值稅, 代書費, etc.) and buyer costs (契稅, 印花稅, 登記規費, 代書費, etc.) with amounts

#### Scenario: Fee summary in draft mode

- **WHEN** taxCalculation is null
- **THEN** all amount cells SHALL be blank; row structure SHALL still render
