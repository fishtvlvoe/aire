## MODIFIED Requirements

### Requirement: Mandatory consent before data pull

The system SHALL display an OwnerAuthorizationDialog before any land registry data pull. The dialog SHALL contain a checkbox labeled "客戶已書面授權查詢不動產資料" that the user MUST check before proceeding. When the user clicks the confirm button without checking the checkbox, the system SHALL apply a red border (`border border-red-500`) to the checkbox wrapper AND display an inline error message "請先勾選授權同意". The confirm button SHALL NOT be disabled by default; instead, validation SHALL trigger on confirm button click.

#### Scenario: Consent required to proceed

- **WHEN** user clicks "拉謄本" on a case
- **THEN** OwnerAuthorizationDialog appears with unchecked checkbox; confirm button is enabled

#### Scenario: Red border appears on confirm without consent

- **WHEN** user clicks the confirm button without checking the checkbox
- **THEN** the checkbox wrapper SHALL have CSS class `border-red-500` applied
- **THEN** an inline error text "請先勾選授權同意" SHALL be visible below the checkbox
- **THEN** the dialog SHALL remain open and the data pull SHALL NOT be triggered

#### Scenario: Error clears on checkbox checked

- **WHEN** the red border error state is active
- **AND** user checks the checkbox
- **THEN** the `border-red-500` class SHALL be removed from the checkbox wrapper
- **THEN** the error text SHALL disappear

#### Scenario: Confirm succeeds with consent

- **WHEN** user has checked the checkbox and clicks confirm
- **THEN** the dialog closes and the land registry data pull proceeds

##### Example: Validation error on empty submit

- **GIVEN** user is on case detail page with parcel_id "0301-0001"
- **WHEN** user clicks "拉謄本"
- **THEN** dialog shows with checkbox unchecked, confirm button enabled
- **WHEN** user clicks confirm without checking
- **THEN** checkbox wrapper has class `border-red-500` and error text is visible
- **WHEN** user checks the checkbox
- **THEN** error state clears
