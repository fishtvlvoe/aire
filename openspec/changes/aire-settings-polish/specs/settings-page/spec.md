## ADDED Requirements

### Requirement: Settings page tab navigation
The settings page SHALL render a `SettingsTabs` component at the top with three tabs: "一般設定" (active when on `/settings`), "品牌設定" (active when on `/settings/branding`), and "操作日誌" (active when on `/settings/logs`). Clicking a tab SHALL navigate to the corresponding sub-route.

#### Scenario: Tab switching
- **WHEN** user is on `/settings` and clicks the "品牌設定" tab
- **THEN** the browser navigates to `/settings/branding` and the "品牌設定" tab shows as active

#### Scenario: Direct URL access
- **WHEN** user navigates directly to `/settings/logs`
- **THEN** the settings page renders with the "操作日誌" tab active

### Requirement: Coming soon placeholder cards
The settings page SHALL render a `ComingSoonCard` component for the "申請說明" section and the "教學影片" section. Each card SHALL display a clock or info icon and the text "敬請期待". The card SHALL NOT display "申請說明" content or "教學影片即將上線" text.

#### Scenario: API help section
- **WHEN** user views the land registry API settings area
- **THEN** the "申請說明" section displays a `ComingSoonCard` with text "敬請期待"

#### Scenario: Tutorial video section
- **WHEN** user views the settings page
- **THEN** the "教學影片" section displays a `ComingSoonCard` with text "敬請期待"

### Requirement: Test connection button tooltip
The "測試連線" button SHALL display a tooltip "請先填入 Client ID 和安全碼" when disabled (Client ID or security code is empty). The button SHALL become enabled when both fields have non-empty values.

#### Scenario: Fields empty
- **WHEN** the Client ID and security code fields are both empty and user hovers over the "測試連線" button
- **THEN** a tooltip reading "請先填入 Client ID 和安全碼" appears

#### Scenario: Fields filled
- **WHEN** both Client ID and security code fields have values
- **THEN** the "測試連線" button is enabled and clickable without tooltip
