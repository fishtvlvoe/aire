## ADDED Requirements

### Requirement: sidebar-navigation

The App Shell SHALL provide a fixed sidebar on the left side (240px width) containing navigation links to all primary sections: Cases (/cases), Branding Settings (/settings/branding), and Logs (/settings/logs). Each link SHALL display an icon (Lucide) and a label in Traditional Chinese.

#### Scenario: desktop sidebar always visible

- **WHEN** the viewport width is greater than 768px
- **THEN** the sidebar SHALL be permanently visible on the left side with 240px width

#### Scenario: mobile sidebar as sheet overlay

- **WHEN** the viewport width is 768px or less
- **THEN** the sidebar SHALL be hidden by default and accessible via a hamburger button in the topbar
- **THEN** tapping the hamburger button SHALL open the sidebar as a Sheet overlay from the left

#### Scenario: active route highlighting

- **WHEN** the user is on a page matching a sidebar link's href
- **THEN** that link SHALL be visually highlighted with a distinct background color

##### Example: cases page active

- **GIVEN** the sidebar contains links: 案件管理 (/cases), 品牌設定 (/settings/branding), 日誌 (/settings/logs)
- **WHEN** the current URL path is /cases
- **THEN** the "案件管理" link SHALL have a blue-50 background and blue-600 text color
- **THEN** other links SHALL have default (transparent) background

### Requirement: topbar-display

The App Shell SHALL display a topbar containing the current page title and a hamburger menu button (visible only on mobile viewports).

#### Scenario: topbar shows page title

- **WHEN** any dashboard page is rendered
- **THEN** the topbar SHALL display the page title corresponding to the current route

##### Example: route to title mapping

- **GIVEN** the route-to-title mapping: /cases → "案件管理", /settings/branding → "品牌設定", /settings/logs → "操作日誌"
- **WHEN** the user navigates to /cases
- **THEN** the topbar SHALL display "案件管理"

#### Scenario: hamburger button visibility

- **WHEN** the viewport width is 768px or less
- **THEN** a hamburger menu button SHALL appear in the topbar
- **WHEN** the viewport width is greater than 768px
- **THEN** the hamburger menu button SHALL NOT be rendered

### Requirement: layout-wrapper

The dashboard layout SHALL wrap all child pages with the sidebar, topbar, and a scrollable main content area.

#### Scenario: layout renders children

- **WHEN** a user navigates to any /cases/* or /settings/* route
- **THEN** the page content SHALL render inside the main content area alongside the sidebar and topbar

##### Example: cases page inside layout

- **GIVEN** the user is authorized
- **WHEN** the user navigates to /cases
- **THEN** the browser SHALL render: left sidebar (240px) + topbar + cases list in the main content area

#### Scenario: layout excludes auth pages

- **WHEN** a user navigates to /activation
- **THEN** the page SHALL render without the sidebar and topbar (full-page layout)

##### Example: activation page standalone

- **GIVEN** the user has no valid license
- **WHEN** the browser loads /activation
- **THEN** the page SHALL render only the activation form centered on screen, with no sidebar or topbar visible
