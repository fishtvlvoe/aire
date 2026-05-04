## ADDED Requirements

### Requirement: Listings page includes folder sidebar

The listings page SHALL display a folder sidebar on the left side for folder navigation.

#### Scenario: Sidebar displays all folders

- **WHEN** user opens the listings page
- **THEN** the left sidebar SHALL show: "全部", all user-created folders, "未分類", and "封存區"

##### Example: Sidebar with 3 folders

- **GIVEN** user has created folders: "信義區", "VIP客戶", "已成交"
- **WHEN** user opens the listings page
- **THEN** sidebar SHALL display in order: "全部", "信義區", "VIP客戶", "已成交", "未分類", "封存區"

#### Scenario: Folder selection updates list

- **WHEN** user clicks a folder in the sidebar
- **THEN** the right-side listing table SHALL update to show only listings in that folder

##### Example: Filter by folder

- **GIVEN** 5 listings total, 2 in folder "信義區"
- **WHEN** user clicks "信義區" in sidebar
- **THEN** only the 2 listings in "信義區" SHALL be displayed

### Requirement: Listings page includes search bar

The listings page SHALL display a search input above the listing table.

#### Scenario: Search bar presence

- **WHEN** user opens the listings page
- **THEN** a search input with placeholder "搜尋物件..." SHALL be visible above the table

#### Scenario: Search triggers filtering

- **WHEN** user types a keyword and waits 300ms (debounce)
- **THEN** the listing table SHALL update to show only matching results

### Requirement: Archive action on listing row

The listings page SHALL provide an archive action for each listing.

#### Scenario: Archive button visibility

- **WHEN** user views a non-archived listing row
- **THEN** an "封存" action SHALL be available in the row actions menu
