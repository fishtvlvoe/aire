## ADDED Requirements

### Requirement: Listing bound to creator

Every new listing SHALL be automatically assigned to the user who created it.

#### Scenario: Auto-assign owner on creation

- **WHEN** agent "王小明" (user_id=2) creates a new listing
- **THEN** the listing's owner_id SHALL be set to 2

##### Example: Owner field populated

- **GIVEN** agent 王小明 is logged in (user_id=2)
- **WHEN** 王小明 creates listing with address "台北市信義區松仁路100號"
- **THEN** listings table SHALL contain new row with owner_id=2

### Requirement: Agent sees only own listings

An agent role user SHALL only see listings they own in the listing page.

#### Scenario: Filtered listing view for agent

- **WHEN** agent "王小明" (user_id=2) views the listings page
- **THEN** only listings with owner_id=2 SHALL be displayed

##### Example: Agent isolation

- **GIVEN** 3 listings exist: #1 (owner_id=2, 王小明), #2 (owner_id=3, 李大華), #3 (owner_id=2, 王小明)
- **WHEN** 王小明 opens /listings
- **THEN** only listing #1 and #3 SHALL appear

### Requirement: Admin sees all listings

An admin role user SHALL see all listings regardless of owner.

#### Scenario: Admin full visibility

- **WHEN** admin views the listings page
- **THEN** all listings from all agents SHALL be displayed

##### Example: Admin sees everything

- **GIVEN** same 3 listings as above
- **WHEN** admin opens /listings
- **THEN** listings #1, #2, and #3 SHALL all appear with owner name displayed

### Requirement: Admin can edit any listing

An admin role user SHALL be able to edit any listing regardless of owner.

#### Scenario: Admin edits another agent's listing

- **WHEN** admin edits listing #2 (owned by 李大華)
- **THEN** the edit SHALL succeed and audit log SHALL record admin's action
