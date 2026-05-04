## ADDED Requirements

### Requirement: Remote feature flag synchronization

The system SHALL fetch the list of enabled features from the server on startup and cache locally.

#### Scenario: Fetch features on startup

- **WHEN** application starts and license is verified
- **THEN** system SHALL call GET /api/features with the license key
- **THEN** system SHALL cache the returned feature list locally

##### Example: Startup feature sync

- **GIVEN** license_key is "LIC-001" and server has features ["disclosure-document", "contract"]
- **WHEN** application starts and license passes verification
- **THEN** GET /api/features?license_key=LIC-001 SHALL return ["disclosure-document", "contract"]
- **THEN** local cache SHALL store ["disclosure-document", "contract"]

#### Scenario: Feature list response

- **WHEN** server receives GET /api/features with a valid license
- **THEN** server SHALL return an array of enabled feature identifiers (e.g., ["disclosure-document"])

### Requirement: Hide disabled features from UI

The system SHALL hide menu items, navigation links, and page access for features not in the enabled list.

#### Scenario: Menu rendering

- **WHEN** application renders the navigation menu
- **THEN** only features present in the enabled list SHALL have visible menu items

##### Example: Filtered navigation

- **GIVEN** enabled features are ["disclosure-document"] and full menu has ["disclosure-document", "contract", "commission-report"]
- **WHEN** navigation renders
- **THEN** only "不動產說明書" menu item SHALL be visible; "合約書" and "佣金報表" SHALL be hidden

#### Scenario: Route interception for disabled features

- **WHEN** user navigates to a route belonging to a disabled feature
- **THEN** system SHALL redirect to the home page (not show a 403 or error)

### Requirement: Admin feature management panel

The system SHALL provide an admin-only panel to toggle features per license.

#### Scenario: Admin panel access

- **WHEN** user logged in as admin navigates to /admin/features
- **THEN** a panel showing all licenses and their enabled features SHALL be displayed

##### Example: Admin panel content

- **GIVEN** system has 2 licenses: LIC-001 (features: ["disclosure-document"]) and LIC-002 (features: ["disclosure-document", "contract"])
- **WHEN** admin opens /admin/features
- **THEN** panel SHALL show two rows: "LIC-001: 不動產說明書 ✓" and "LIC-002: 不動產說明書 ✓, 合約書 ✓"

#### Scenario: Toggle feature for a license

- **WHEN** admin enables "contract" feature for license_001
- **THEN** next time that client syncs features, "contract" SHALL be included in their list
