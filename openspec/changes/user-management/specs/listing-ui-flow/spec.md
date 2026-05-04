## ADDED Requirements

### Requirement: Listing list filters by role

The listing list page SHALL display different content based on the user's role.

#### Scenario: Agent sees only own listings

- **WHEN** an agent user loads the listings page
- **THEN** only listings where owner_id matches the agent's user id SHALL be displayed

##### Example: Agent with 3 listings

- **GIVEN** agent "王小明" (user_id=2) has 3 listings, and the system has 20 total listings
- **WHEN** 王小明 navigates to /listings
- **THEN** the list SHALL show exactly 3 listings, all with owner_id=2

#### Scenario: Admin sees all listings

- **WHEN** an admin user loads the listings page
- **THEN** all listings in the system SHALL be displayed regardless of owner_id

##### Example: Admin sees all 20

- **GIVEN** system has 20 total listings across all agents
- **WHEN** admin navigates to /listings
- **THEN** the list SHALL show all 20 listings with owner name displayed for each

### Requirement: Admin can edit any listing

The admin user SHALL be able to open and edit any listing regardless of owner_id.

#### Scenario: Admin edits another agent's listing

- **WHEN** admin opens a listing owned by agent "王小明"
- **THEN** the edit form SHALL be fully functional with save capability

##### Example: Admin modifies address

- **GIVEN** listing id=45 is owned by agent "王小明" (user_id=2)
- **WHEN** admin (user_id=1) navigates to /listings/45/edit and changes address to "新地址"
- **THEN** the update SHALL succeed and audit_logs SHALL record user_id=1, action="update_listing", target_id=45
