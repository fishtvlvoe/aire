## ADDED Requirements

### Requirement: sidebar-collapse-toggle

The sidebar SHALL provide a collapse toggle button at the bottom. When clicked on desktop (viewport >= 768px), the sidebar SHALL transition between expanded (240px with icon + label) and collapsed (60px with icon only + tooltip) states.

#### Scenario: collapse sidebar on desktop

- **WHEN** the user clicks the collapse toggle button on desktop viewport
- **THEN** the sidebar width SHALL animate from 240px to 60px
- **THEN** navigation labels SHALL be hidden
- **THEN** each navigation icon SHALL show a tooltip with the label text on hover

##### Example: collapse from expanded

- **GIVEN** the sidebar is expanded (240px) showing icon + label for each nav item
- **WHEN** the user clicks the ChevronLeft collapse button
- **THEN** the sidebar animates to 60px width
- **THEN** only icons are visible
- **THEN** hovering over the cases icon shows tooltip "案件管理"

#### Scenario: expand sidebar on desktop

- **WHEN** the user clicks the collapse toggle button while sidebar is collapsed
- **THEN** the sidebar width SHALL animate from 60px to 240px
- **THEN** navigation labels SHALL become visible

##### Example: expand from collapsed

- **GIVEN** the sidebar is collapsed (60px) showing only icons
- **WHEN** the user clicks the ChevronRight expand button
- **THEN** the sidebar animates to 240px width showing icon + label

### Requirement: sidebar-collapse-persistence

The sidebar collapse state SHALL be persisted to localStorage. On page load, the sidebar SHALL restore the previously saved collapse state.

#### Scenario: persist collapsed state

- **WHEN** the user collapses the sidebar and refreshes the page
- **THEN** the sidebar SHALL load in collapsed state

##### Example: refresh preserves collapsed state

- **GIVEN** the user collapsed the sidebar (localStorage key "aire-sidebar-collapsed" = "true")
- **WHEN** the page reloads
- **THEN** the sidebar renders in collapsed state (60px)

#### Scenario: mobile unaffected by collapse

- **WHEN** the viewport width is less than 768px
- **THEN** the collapse toggle button SHALL NOT be visible
- **THEN** the sidebar SHALL use the Sheet overlay behavior regardless of collapse state

##### Example: mobile ignores collapse setting

- **GIVEN** localStorage "aire-sidebar-collapsed" = "true"
- **WHEN** the viewport is 375px wide
- **THEN** the sidebar is hidden by default and opens via hamburger as a Sheet overlay

### Requirement: sidebar-settings-nav-item

The sidebar SHALL include a "設定" navigation item with the Settings icon from lucide-react, linking to /settings.

#### Scenario: settings nav item visible

- **WHEN** the sidebar renders
- **THEN** it SHALL display 4 navigation items: 案件管理, 品牌設定, 日誌, 設定
- **THEN** the 設定 item SHALL use the Settings icon and link to /settings

##### Example: settings item active state

- **GIVEN** the sidebar displays 4 items
- **WHEN** the current URL path is /settings
- **THEN** the "設定" link SHALL have blue-50 background and blue-600 text
