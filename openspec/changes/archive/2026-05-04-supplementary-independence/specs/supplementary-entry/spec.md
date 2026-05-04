## ADDED Requirements

### Requirement: Supplementary status icon on listing row

The system SHALL display a supplementary data status icon on each listing row in the list view.

#### Scenario: Listing with missing required fields

- **WHEN** a listing has status "in-progress" or higher and has unfilled required supplementary fields
- **THEN** the list row SHALL display a warning icon (⚠️) in the supplement status column

#### Scenario: Listing with all supplementary fields completed

- **WHEN** a listing has all required supplementary fields filled
- **THEN** the list row SHALL display a checkmark icon (✅) in the supplement status column

##### Example: Complete listing icon

- **GIVEN** listing #3 has status "in-progress" and 5/5 required supplementary fields filled
- **WHEN** listing #3 appears in the list
- **THEN** its supplement column SHALL show ✅

#### Scenario: Draft listing not yet in supplementary phase

- **WHEN** a listing is still in "draft" status
- **THEN** the list row SHALL display a dash (──) in the supplement status column

### Requirement: Independent supplementary page route

The system SHALL provide an independent route for supplementary data entry at /listings/[id]/supplement.

#### Scenario: Navigate via icon click

- **WHEN** user clicks the supplement status icon (⚠️ or ✅) on a listing row
- **THEN** browser SHALL navigate to /listings/[id]/supplement

##### Example: Icon click navigation

- **GIVEN** listing #7 shows ⚠️ icon in the supplement column
- **WHEN** user clicks the ⚠️ icon
- **THEN** browser SHALL navigate to /listings/7/supplement

#### Scenario: Direct URL access

- **WHEN** user navigates to /listings/[id]/supplement directly
- **THEN** the supplementary form for that listing SHALL be displayed

##### Example: Direct URL

- **GIVEN** listing #7 exists
- **WHEN** user enters /listings/7/supplement in browser
- **THEN** the supplementary form for listing #7 SHALL render

### Requirement: Supplementary form removed from listing creation flow

The system SHALL NOT include supplementary data fields or navigation within the listing creation/edit form.

#### Scenario: Listing creation form tabs

- **WHEN** user opens the listing creation or edit form
- **THEN** no "補件資料" tab SHALL be present
- **THEN** no "前去補件" button SHALL be present
