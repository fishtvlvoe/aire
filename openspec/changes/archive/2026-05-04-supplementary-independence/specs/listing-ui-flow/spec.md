## ADDED Requirements

### Requirement: Listing creation form excludes supplementary tab

The listing creation/edit form SHALL no longer include a supplementary data tab or "前去補件" navigation button.

#### Scenario: Form tabs after modification

- **WHEN** user opens listing creation or edit form
- **THEN** only "基本資料" and "謄本資料" tabs SHALL be displayed
- **THEN** no supplementary-related UI elements SHALL be present

### Requirement: Listing list includes supplement status column

The listing list table SHALL include a new column displaying supplementary data completion status as an icon.

#### Scenario: Status column presence

- **WHEN** user views the listings page
- **THEN** a "補件" column with status icons SHALL be visible between "狀態" and "動作" columns
