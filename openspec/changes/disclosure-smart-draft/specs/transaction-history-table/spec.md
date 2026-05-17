## ADDED Requirements

### Requirement: Render transaction history table

The system SHALL render a "透明房價一覽表" (Transaction History Table) page in the PDF. Each transaction record SHALL be displayed as one row containing: address, area (坪), total price, unit price (per 坪), and transaction date.

#### Scenario: Transaction history with multiple records

- **WHEN** CaseDossierData contains transactionHistory with 5+ records
- **THEN** the PDF SHALL render a table with all records, one per row, sorted by date descending

#### Scenario: Transaction history with no records

- **WHEN** CaseDossierData contains transactionHistory as empty array
- **THEN** the PDF SHALL render the table header with a single row stating "查無成交紀錄"

#### Scenario: Transaction history pagination

- **WHEN** transactionHistory contains more than 15 records
- **THEN** the system SHALL split across multiple pages (max 15 rows per page) with repeated headers
