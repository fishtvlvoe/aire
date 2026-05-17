## MODIFIED Requirements

### Requirement: Cover page displays all official format fields

The system SHALL render the cover page with all fields per official format: 物件名稱 (property name/address), 案件編號 (case number), 承辦人 (handling agent), 不動產經紀人 (licensed agent name + certificate number), 不動產經紀業 (brokerage company name + license number), 公司地址, 公司電話.

#### Scenario: Cover page with full company info

- **WHEN** CaseDossierData.cover contains all fields populated
- **THEN** the PDF cover page SHALL display all fields in the official layout format

#### Scenario: Cover page with minimal info

- **WHEN** only address and caseNo are available (new case, company info not yet configured)
- **THEN** the cover page SHALL render with available fields filled and missing fields as blank lines

#### Scenario: Cover page company info from settings

- **WHEN** the system has company settings configured (company name, license, address, phone)
- **THEN** the cover page SHALL auto-fill company fields from settings without manual input per case
