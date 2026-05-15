## ADDED Requirements

### Requirement: dev-page-route

The application SHALL expose a dashboard route at `/dev` with a corresponding `page.tsx` so that the dev superadmin panel is accessible in browser dev mode.

#### Scenario: /dev route resolves

WHEN a user navigates to `http://localhost:3000/dev` in browser dev mode
THEN the page SHALL render without a 404 error

##### Example:
- URL: http://localhost:3000/dev
- Expected HTTP status: 200 (page renders)
- Not expected: Next.js 404 page

### Requirement: feature-flag-toggle-ui

The `/dev` page SHALL display a list of all known feature flags with their current state (enabled/disabled) and provide a toggle control for each flag.

#### Scenario: Toggle enables a feature flag

WHEN a user clicks the toggle for feature flag `mcp-hub` on the `/dev` page
AND `mcp-hub` is currently disabled
THEN the flag state SHALL switch to enabled
AND mock-backend featureFlags["mcp-hub"] SHALL equal true
AND the toggle UI SHALL visually indicate enabled without page reload

##### Example:
- Before: featureFlags = { "mcp-hub": false }
- Action: click toggle for mcp-hub
- After: featureFlags = { "mcp-hub": true }; toggle shows enabled state

#### Scenario: Toggle disables a feature flag

WHEN a user clicks the toggle for feature flag `mcp-hub` on the `/dev` page
AND `mcp-hub` is currently enabled
THEN the flag state SHALL switch to disabled
AND the UI SHALL reflect the new state immediately

##### Example:
- Before: featureFlags = { "mcp-hub": true }
- Action: click toggle for mcp-hub
- After: featureFlags = { "mcp-hub": false }; toggle shows disabled state

#### Scenario: Feature flags load on mount

WHEN the `/dev` page first renders with featureFlags = { "mcp-hub": false }
THEN the page SHALL display a row for "mcp-hub" with toggle in disabled position

##### Example:
- Mock state: featureFlags = { "mcp-hub": false }
- Output: page shows "mcp-hub" row with toggle in off position
