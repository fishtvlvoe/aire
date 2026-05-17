# signature-block Specification

## Purpose

TBD - created by archiving change 'disclosure-smart-draft'. Update Purpose after archive.

## Requirements

### Requirement: Render signature block

The system SHALL render a signature block on the final page of the disclosure document containing four signature areas: 賣方 (Seller), 買方 (Buyer), 不動產經紀人 (Real Estate Agent), and 不動產經紀業 (Brokerage Company). Each area SHALL include a signature line and a date field.

#### Scenario: Signature block renders in PDF

- **WHEN** generating either land or building type PDF
- **THEN** the last content page SHALL contain the four-party signature block with blank signature lines and date fields formatted as "中華民國＿年＿月＿日"

#### Scenario: Signature block layout

- **WHEN** rendering the signature block
- **THEN** the layout SHALL be: top row (賣方 left, 買方 right), bottom row (不動產經紀人 left, 不動產經紀業 right), with date field below all four blocks
