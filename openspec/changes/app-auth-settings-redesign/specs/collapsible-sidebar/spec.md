## ADDED Requirements

### Requirement: Sidebar collapse toggle

The sidebar SHALL have a collapse/expand toggle button at the bottom.

- **WHEN** the user clicks the collapse button (ChevronsLeft icon)
- **THEN** the sidebar SHALL animate from 240px to 60px width over 200ms ease-in-out
- **THEN** navigation items SHALL show only icons (no text labels)
- **THEN** a tooltip SHALL appear on hover showing the full label
- **THEN** the toggle icon SHALL change to ChevronsRight

#### Scenario: Collapse sidebar

- **GIVEN** the sidebar is expanded (240px)
- **WHEN** the user clicks the collapse toggle
- **THEN** sidebar width transitions to 60px over 200ms
- **THEN** each nav item shows only its icon
- **THEN** hovering a nav item shows a tooltip with the full label

##### Example: Collapse transition

- **GIVEN** sidebar width is `240px`
- **WHEN** user clicks the ChevronsLeft button
- **THEN** sidebar CSS transition runs `width 200ms ease-in-out`
- **THEN** final sidebar width is `60px`
- **THEN** nav item text has `opacity: 0` or `display: none`

#### Scenario: Expand sidebar

- **GIVEN** the sidebar is collapsed (60px)
- **WHEN** the user clicks the expand toggle (ChevronsRight icon)
- **THEN** sidebar width transitions to 240px over 200ms
- **THEN** navigation items show icons and text labels

##### Example: Expand transition

- **GIVEN** sidebar width is `60px`
- **WHEN** user clicks the ChevronsRight button
- **THEN** sidebar CSS transition runs `width 200ms ease-in-out`
- **THEN** final sidebar width is `240px`
- **THEN** nav item text is visible

### Requirement: Sidebar state persistence

The sidebar collapsed state SHALL be persisted to localStorage key `aire-sidebar-collapsed`.

- **WHEN** the user collapses the sidebar
- **THEN** `localStorage.setItem("aire-sidebar-collapsed", "true")` SHALL be called

- **WHEN** the app loads
- **THEN** the sidebar SHALL read `localStorage.getItem("aire-sidebar-collapsed")`
- **THEN** if the value is `"true"` the sidebar SHALL start collapsed

#### Scenario: Restore collapsed state on reload

- **GIVEN** `localStorage.getItem("aire-sidebar-collapsed")` returns `"true"`
- **WHEN** the app loads
- **THEN** the sidebar SHALL render at 60px width without animation

##### Example: Persisted collapsed state

- **GIVEN** localStorage `aire-sidebar-collapsed` is `"true"`
- **WHEN** sidebar component mounts
- **THEN** initial width is `60px` (no transition on mount)

#### Scenario: Restore expanded state on reload

- **GIVEN** `localStorage.getItem("aire-sidebar-collapsed")` returns `"false"` or is absent
- **WHEN** the app loads
- **THEN** the sidebar SHALL render at 240px width

##### Example: Default expanded state

- **GIVEN** localStorage `aire-sidebar-collapsed` is not set
- **WHEN** sidebar component mounts
- **THEN** initial width is `240px`
