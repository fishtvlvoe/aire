## ADDED Requirements

### Requirement: OPCOS and AIRE cloud entry boundary

The AIRE platform SHALL use OPCOS as the cloud entry point for public product pages, accounts, licensing, downloads, and updates while keeping owner personal data and case records inside the AIRE desktop application local storage.

#### Scenario: OPCOS handles cloud entry functions

- **WHEN** a user needs account login, registration, license management, product download, or update access for AIRE
- **THEN** the system SHALL route the user through OPCOS-controlled HTTPS pages or APIs
- **THEN** the AIRE desktop application SHALL consume only the account, license, download, and update signals required for operation

##### Example: login and license entry

- **GIVEN** a visitor clicks "開始使用 AIRE" on `https://aire.opcos.me/`
- **WHEN** the browser navigates to `https://opcos.me/login?redirect=/products/aire`
- **THEN** OPCOS SHALL handle authentication and AIRE SHALL receive only the resulting account or license state needed to continue

#### Scenario: AIRE case data remains local

- **WHEN** a user creates or edits an AIRE case containing owner personal data, land registry data, field survey data, or generated disclosure document data
- **THEN** the system SHALL store that data in the AIRE desktop application's local SQLite storage
- **THEN** the system SHALL NOT upload those case records to `opcos.me` or `aire.opcos.me`

#### Scenario: Public subsite describes the same boundary

- **WHEN** the public AIRE subsite describes product architecture or privacy behavior
- **THEN** it SHALL state that OPCOS manages accounts and licensing
- **THEN** it SHALL state that AIRE desktop keeps case data local
- **THEN** it SHALL NOT describe AIRE as a cloud case-management SaaS

##### Example: rejected SaaS wording

- **GIVEN** homepage copy contains "雲端案件管理 SaaS"
- **WHEN** the copy regression test scans the rendered AIRE homepage
- **THEN** the test SHALL fail the public boundary assertion
