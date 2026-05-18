## ADDED Requirements

### Requirement: building_lot_no exposed in wizard Step 2
The system SHALL persist `building_lot_no` (建號) in the `cases` SQLite table (TEXT, NULL-able) and SHALL render a 建號 text input in Wizard Step 2 (地政資料), allowing the user to enter or edit the building lot number. The field SHALL accept free-form text up to 50 characters.

#### Scenario: User enters building lot number
- **WHEN** user types "556-1" into the 建號 field in Step 2 and advances past that step
- **THEN** the value "556-1" is stored in `cases.building_lot_no` for that case

#### Scenario: Building lot number optional
- **WHEN** user leaves 建號 empty in Step 2
- **THEN** `cases.building_lot_no` remains NULL and the document renders the field as blank

#### Scenario: case_name also persists
- **WHEN** user enters a case name in Step 1
- **THEN** `cases.case_name` is stored in the database (this field was previously TS-only and not persisted in Rust)
