## MODIFIED Requirements

### Requirement: sidebar-navigation

The App Shell SHALL provide a sidebar containing navigation links to all primary sections: Cases (/cases), Branding Settings (/settings/branding), Logs (/settings/logs), and Settings (/settings). Each link SHALL display an icon (Lucide) and a label in Traditional Chinese. The sidebar SHALL support a collapsed state on desktop viewports where only icons are displayed.

#### Scenario: desktop sidebar always visible

- **WHEN** the viewport width is greater than 768px
- **THEN** the sidebar SHALL be permanently visible on the left side
- **THEN** the sidebar width SHALL be 240px when expanded or 60px when collapsed

#### Scenario: mobile sidebar as sheet overlay

- **WHEN** the viewport width is 768px or less
- **THEN** the sidebar SHALL be hidden by default and accessible via a hamburger button in the topbar
- **THEN** tapping the hamburger button SHALL open the sidebar as a Sheet overlay from the left

#### Scenario: active route highlighting

- **WHEN** the user is on a page matching a sidebar link's href
- **THEN** that link SHALL be visually highlighted with a distinct background color

##### Example: settings page active

- **GIVEN** the sidebar contains links: 案件管理 (/cases), 品牌設定 (/settings/branding), 日誌 (/settings/logs), 設定 (/settings)
- **WHEN** the current URL path is /settings
- **THEN** the "設定" link SHALL have blue-50 background and blue-600 text color
- **THEN** other links SHALL have default transparent background

#### Scenario: four navigation items

- **WHEN** the sidebar renders
- **THEN** it SHALL display exactly 4 navigation items in order: 案件管理, 品牌設定, 日誌, 設定

##### Example: navigation items list

- **GIVEN** the sidebar component mounts
- **WHEN** rendered
- **THEN** nav items are: { label: "案件管理", href: "/cases", icon: FileText }, { label: "品牌設定", href: "/settings/branding", icon: Palette }, { label: "日誌", href: "/settings/logs", icon: ScrollText }, { label: "設定", href: "/settings", icon: Settings }
