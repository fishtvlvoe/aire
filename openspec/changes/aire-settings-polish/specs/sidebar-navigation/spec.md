## ADDED Requirements

### Requirement: Two-item sidebar navigation
The sidebar SHALL render exactly two top-level navigation items: "案件管理" (icon: FileText, navigates to `/cases`) and "設定" (icon: Settings, navigates to `/settings`). The sidebar SHALL NOT render separate items for "品牌設定" or "日誌".

#### Scenario: Sidebar renders two items
- **WHEN** the user is logged in and views any page
- **THEN** the sidebar displays exactly "案件管理" and "設定" as navigation items

#### Scenario: Navigate to settings
- **WHEN** the user clicks "設定" in the sidebar
- **THEN** the browser navigates to `/settings` and the settings page renders with tabs
