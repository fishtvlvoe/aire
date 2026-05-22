## MODIFIED Requirements

### Requirement: Create case flow

The system SHALL provide a `/cases/new` page that asks the user to enter an address first, run registry classification, and only then create a draft case. Manual property-type selection SHALL appear only when the address is empty, lookup fails, or multiple candidates require user selection.

#### Scenario: Successful address-first creation

- **WHEN** the user enters a normal building address, clicks 判斷地政資料, and submits the form
- **THEN** the system creates a draft case with building/residential classification and navigates to `/cases/<new-id>`

#### Scenario: Missing registry decision is rejected

- **WHEN** the user enters an address and submits without clicking 判斷地政資料
- **THEN** the form displays 請先按「判斷地政資料」確認土地或建物資料，再建立案件。
- **AND** the system does not create a case

##### Example: guarded create

- **GIVEN** the user enters `台南市永康區勝利街58巷4號1樓`
- **WHEN** the user clicks `先判斷地政資料` without running 判斷地政資料
- **THEN** the form displays 請先按「判斷地政資料」確認土地或建物資料，再建立案件。
- **AND** `casesApi.create` is not called
