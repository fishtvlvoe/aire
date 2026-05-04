## ADDED Requirements

### Requirement: Batch transfer cases on agent departure

The admin SHALL be able to transfer all listings from one agent to another in a single action.

#### Scenario: Transfer all cases

- **WHEN** admin selects "轉移案件" for disabled agent "王小明" and chooses target agent "李大華"
- **THEN** all listings with owner_id = 王小明's id SHALL be updated to owner_id = 李大華's id
- **THEN** audit log SHALL record "管理員將王小明的 N 筆物件轉移給李大華"

##### Example: Bulk transfer

- **GIVEN** 王小明 (user_id=2) owns 8 listings and has been disabled
- **WHEN** admin transfers all of 王小明's cases to 李大華 (user_id=3)
- **THEN** all 8 listings SHALL now have owner_id=3
- **THEN** audit_logs SHALL contain entry: action="transfer_cases", detail="王小明 → 李大華, 8 筆"

### Requirement: Transfer includes all related documents

When cases are transferred, all associated documents and file history SHALL follow the listing.

#### Scenario: Documents follow transfer

- **WHEN** listing #5 is transferred from 王小明 to 李大華
- **THEN** all generated PDFs, supplementary data, and version history for listing #5 SHALL remain accessible to 李大華

##### Example: PDF history preserved

- **GIVEN** listing #5 has 3 generated 不動產說明書 versions
- **WHEN** listing #5 is transferred to 李大華
- **THEN** 李大華 can view all 3 historical versions of the document
