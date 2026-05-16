# dev-super-admin Specification

## Purpose

TBD - created by archiving change 'app-auth-settings-redesign'. Update Purpose after archive.

## Requirements

### Requirement: Developer Super Admin panel visibility

- **WHEN** `NODE_ENV` equals `"development"`
- **THEN** the Settings page SHALL render a DevSuperAdmin section at the bottom

- **WHEN** `NODE_ENV` does NOT equal `"development"`
- **THEN** the DevSuperAdmin section SHALL NOT be rendered (zero DOM footprint)

#### Scenario: Development environment

- **GIVEN** `NODE_ENV` is `"development"`
- **WHEN** the Settings page renders
- **THEN** DevSuperAdmin section is present in DOM

##### Example: Dev mode rendering

- **GIVEN** `process.env.NODE_ENV === "development"`
- **WHEN** Settings page loads
- **THEN** a section with heading "Super Admin" is visible at page bottom

#### Scenario: Production environment

- **GIVEN** `NODE_ENV` is `"production"`
- **WHEN** the Settings page renders
- **THEN** DevSuperAdmin section is NOT in DOM (no hidden element, zero footprint)


<!-- @trace
source: app-auth-settings-redesign
updated: 2026-05-15
code:
  - src/lib/mock-backend.ts
  - src-tauri/src/land_registry/opcos_offline_grace/mod.rs
  - src/components/disclosure-form-land.tsx
  - src-tauri/src/land_registry/apis/co_owners.rs
  - src-tauri/src/land_registry/billing_log/tests.rs
  - src-tauri/src/lib.rs
  - src/app/(dashboard)/layout.tsx
  - src/app/login/page.tsx
  - src-tauri/src/secrets.rs
  - src-tauri/src/land_registry/disk_resilience/mod.rs
  - src/components/ApiKeySettings.tsx
  - src-tauri/src/db/mod.rs
  - src-tauri/src/land_registry/time_sync/tests.rs
  - src-tauri/src/log.rs
  - src-tauri/src/db/settings.rs
  - src-tauri/src/commands/license.rs
  - src-tauri/src/encryption/tests.rs
  - src-tauri/src/db/cases.rs
  - src-tauri/src/land_registry/apis/land_value.rs
  - src-tauri/src/land_registry/apis/land_registry.rs
  - src/components/BalanceMonitor.tsx
  - src-tauri/src/land_registry/apis/zoning.rs
  - src-tauri/src/land_registry/billing_log/mod.rs
  - src/components/ManualFallbackInput.tsx
  - src-tauri/src/land_registry/mod.rs
  - src/components/disclosure-form-residential.tsx
  - src-tauri/src/land_registry/apis/building_ownership.rs
  - src-tauri/src/db/drafts.rs
  - src-tauri/src/commands/log.rs
  - src-tauri/src/crypto/recovery_code.rs
  - src-tauri/src/legal_clauses/sync.rs
  - src/lib/land-registry-api.ts
  - src/components/BalanceBanner.tsx
  - src-tauri/migrations/005_owner_consent_log.sql
  - src-tauri/src/land_registry/cache/tests.rs
  - src/components/settings/DevSuperAdmin.tsx
  - src-tauri/src/branding/logo.rs
  - src-tauri/src/land_registry/batch/mod.rs
  - src-tauri/src/opcos.rs
  - src/components/OwnerAuthorizationDialog.tsx
  - src-tauri/src/commands/pdf.rs
  - src-tauri/src/land_registry/cache/mod.rs
  - src-tauri/src/realtor_license/mod.rs
  - src-tauri/src/land_registry/consent.rs
  - src-tauri/src/commands/drafts.rs
  - src-tauri/src/crypto/vault.rs
  - src-tauri/src/realtor_license/cache.rs
  - src/app/(dashboard)/settings/api-key/page.tsx
  - src-tauri/src/land_registry/migration_rollback/tests.rs
  - src/components/PreChargeConfirmDialog.tsx
  - src-tauri/src/land_registry/errors/mod.rs
  - src-tauri/src/land_registry/client/tests.rs
  - src-tauri/src/crypto/master_password.rs
  - src-tauri/src/land_registry/apis/building_registry.rs
  - src-tauri/src/land_registry/errors/tests.rs
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src-tauri/src/legal_clauses/cache.rs
  - src-tauri/src/encryption/mod.rs
  - src-tauri/src/branding/mod.rs
  - src-tauri/src/startup.rs
  - src-tauri/src/commands/cases.rs
  - src-tauri/src/land_registry/apis/mod.rs
  - src/app/(dashboard)/settings/page.tsx
  - src-tauri/src/land_registry/api_key_storage.rs
  - src-tauri/src/land_registry/batch/tests.rs
  - src-tauri/src/realtor_license/client.rs
  - src-tauri/src/land_registry/apis/mortgages.rs
  - src-tauri/src/land_registry/pull.rs
  - src-tauri/src/land_registry/time_sync/mod.rs
  - src/components/settings/PremiumUnlockSection.tsx
  - src-tauri/src/land_registry/disk_resilience/tests.rs
  - src-tauri/src/land_registry/field_mapping/tests.rs
  - src/hooks/useAuth.ts
  - src-tauri/src/land_registry/balance.rs
  - src-tauri/src/land_registry/migration_rollback/mod.rs
  - src-tauri/src/land_registry/opcos_offline_grace/tests.rs
  - src-tauri/src/land_registry/client/mod.rs
  - src/components/settings/LicenseSection.tsx
  - src-tauri/Cargo.toml
  - src-tauri/src/legal_clauses/mod.rs
  - src-tauri/src/land_registry/apis/address_to_parcel.rs
  - src/components/settings/LandApiSection.tsx
  - src/components/PullParcelDataButton.tsx
tests:
  - src/components/__tests__/sidebar.test.tsx
  - src/components/settings/__tests__/PremiumUnlockSection.test.tsx
  - src-tauri/tests/e2e_smoke.rs
  - src/lib/__tests__/mock-backend.test.ts
  - src/app/login/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/components/settings/__tests__/DevSuperAdmin.test.tsx
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/components/settings/__tests__/LicenseSection.test.tsx
-->

---
### Requirement: Feature flags management

- **WHEN** the DevSuperAdmin section is rendered
- **THEN** the system SHALL call `get_feature_flags()`
- **THEN** each feature flag SHALL be displayed as a row with name label and Switch toggle

#### Scenario: Toggle a feature flag on

- **GIVEN** a feature flag `{ id: "mcp-hub", name: "MCP Hub", enabled: false }`
- **WHEN** the developer toggles the switch to on
- **THEN** the system SHALL call `toggle_feature_flag({ id: "mcp-hub" })`
- **THEN** the switch SHALL reflect the new state `enabled: true`

##### Example: Enable mcp-hub flag

- **GIVEN** `get_feature_flags` returns `[{ id: "mcp-hub", name: "MCP Hub", enabled: false }]`
- **WHEN** user clicks the Switch for "MCP Hub"
- **THEN** `toggle_feature_flag({ id: "mcp-hub" })` returns `{ success: true, enabled: true }`
- **THEN** Switch shows "on" state

#### Scenario: Toggle a feature flag off

- **GIVEN** a feature flag `{ id: "mcp-hub", name: "MCP Hub", enabled: true }`
- **WHEN** the developer toggles the switch to off
- **THEN** the system SHALL call `toggle_feature_flag({ id: "mcp-hub" })`
- **THEN** the switch SHALL reflect the new state `enabled: false`

##### Example: Disable mcp-hub flag

- **GIVEN** `get_feature_flags` returns `[{ id: "mcp-hub", name: "MCP Hub", enabled: true }]`
- **WHEN** user clicks the Switch for "MCP Hub"
- **THEN** `toggle_feature_flag({ id: "mcp-hub" })` returns `{ success: true, enabled: false }`
- **THEN** Switch shows "off" state

#### Scenario: Default feature flags

- **WHEN** the DevSuperAdmin section loads for the first time
- **THEN** the system SHALL display at least 3 flags:
  - `premium-unlock` — "進階功能解鎖" (default: `false`)
  - `mcp-hub` — "MCP Hub" (default: `false`)
  - `land-registry-api` — "地政 API" (default: `true`)

##### Example: Initial flags list

- **GIVEN** fresh mock store
- **WHEN** DevSuperAdmin renders
- **THEN** 3 rows displayed: "進階功能解鎖" (off), "MCP Hub" (off), "地政 API" (on)

<!-- @trace
source: app-auth-settings-redesign
updated: 2026-05-15
code:
  - src/lib/mock-backend.ts
  - src-tauri/src/land_registry/opcos_offline_grace/mod.rs
  - src/components/disclosure-form-land.tsx
  - src-tauri/src/land_registry/apis/co_owners.rs
  - src-tauri/src/land_registry/billing_log/tests.rs
  - src-tauri/src/lib.rs
  - src/app/(dashboard)/layout.tsx
  - src/app/login/page.tsx
  - src-tauri/src/secrets.rs
  - src-tauri/src/land_registry/disk_resilience/mod.rs
  - src/components/ApiKeySettings.tsx
  - src-tauri/src/db/mod.rs
  - src-tauri/src/land_registry/time_sync/tests.rs
  - src-tauri/src/log.rs
  - src-tauri/src/db/settings.rs
  - src-tauri/src/commands/license.rs
  - src-tauri/src/encryption/tests.rs
  - src-tauri/src/db/cases.rs
  - src-tauri/src/land_registry/apis/land_value.rs
  - src-tauri/src/land_registry/apis/land_registry.rs
  - src/components/BalanceMonitor.tsx
  - src-tauri/src/land_registry/apis/zoning.rs
  - src-tauri/src/land_registry/billing_log/mod.rs
  - src/components/ManualFallbackInput.tsx
  - src-tauri/src/land_registry/mod.rs
  - src/components/disclosure-form-residential.tsx
  - src-tauri/src/land_registry/apis/building_ownership.rs
  - src-tauri/src/db/drafts.rs
  - src-tauri/src/commands/log.rs
  - src-tauri/src/crypto/recovery_code.rs
  - src-tauri/src/legal_clauses/sync.rs
  - src/lib/land-registry-api.ts
  - src/components/BalanceBanner.tsx
  - src-tauri/migrations/005_owner_consent_log.sql
  - src-tauri/src/land_registry/cache/tests.rs
  - src/components/settings/DevSuperAdmin.tsx
  - src-tauri/src/branding/logo.rs
  - src-tauri/src/land_registry/batch/mod.rs
  - src-tauri/src/opcos.rs
  - src/components/OwnerAuthorizationDialog.tsx
  - src-tauri/src/commands/pdf.rs
  - src-tauri/src/land_registry/cache/mod.rs
  - src-tauri/src/realtor_license/mod.rs
  - src-tauri/src/land_registry/consent.rs
  - src-tauri/src/commands/drafts.rs
  - src-tauri/src/crypto/vault.rs
  - src-tauri/src/realtor_license/cache.rs
  - src/app/(dashboard)/settings/api-key/page.tsx
  - src-tauri/src/land_registry/migration_rollback/tests.rs
  - src/components/PreChargeConfirmDialog.tsx
  - src-tauri/src/land_registry/errors/mod.rs
  - src-tauri/src/land_registry/client/tests.rs
  - src-tauri/src/crypto/master_password.rs
  - src-tauri/src/land_registry/apis/building_registry.rs
  - src-tauri/src/land_registry/errors/tests.rs
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src-tauri/src/legal_clauses/cache.rs
  - src-tauri/src/encryption/mod.rs
  - src-tauri/src/branding/mod.rs
  - src-tauri/src/startup.rs
  - src-tauri/src/commands/cases.rs
  - src-tauri/src/land_registry/apis/mod.rs
  - src/app/(dashboard)/settings/page.tsx
  - src-tauri/src/land_registry/api_key_storage.rs
  - src-tauri/src/land_registry/batch/tests.rs
  - src-tauri/src/realtor_license/client.rs
  - src-tauri/src/land_registry/apis/mortgages.rs
  - src-tauri/src/land_registry/pull.rs
  - src-tauri/src/land_registry/time_sync/mod.rs
  - src/components/settings/PremiumUnlockSection.tsx
  - src-tauri/src/land_registry/disk_resilience/tests.rs
  - src-tauri/src/land_registry/field_mapping/tests.rs
  - src/hooks/useAuth.ts
  - src-tauri/src/land_registry/balance.rs
  - src-tauri/src/land_registry/migration_rollback/mod.rs
  - src-tauri/src/land_registry/opcos_offline_grace/tests.rs
  - src-tauri/src/land_registry/client/mod.rs
  - src/components/settings/LicenseSection.tsx
  - src-tauri/Cargo.toml
  - src-tauri/src/legal_clauses/mod.rs
  - src-tauri/src/land_registry/apis/address_to_parcel.rs
  - src/components/settings/LandApiSection.tsx
  - src/components/PullParcelDataButton.tsx
tests:
  - src/components/__tests__/sidebar.test.tsx
  - src/components/settings/__tests__/PremiumUnlockSection.test.tsx
  - src-tauri/tests/e2e_smoke.rs
  - src/lib/__tests__/mock-backend.test.ts
  - src/app/login/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/components/settings/__tests__/DevSuperAdmin.test.tsx
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/components/settings/__tests__/LicenseSection.test.tsx
-->

---
### Requirement: dev-page-route

The application SHALL expose a dashboard route at `/dev` with a corresponding `page.tsx` so that the dev superadmin panel is accessible in browser dev mode.

#### Scenario: /dev route resolves

WHEN a user navigates to `http://localhost:3000/dev` in browser dev mode
THEN the page SHALL render without a 404 error

##### Example:
- URL: http://localhost:3000/dev
- Expected HTTP status: 200 (page renders)
- Not expected: Next.js 404 page


<!-- @trace
source: aire-ux-bugfix-wave1
updated: 2026-05-16
code:
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src/components/RealPricePanel.tsx
  - src/components/case-wizard/CaseWizard.tsx
  - src/lib/pdf-themes/registry.ts
  - next.config.ts
  - src/lib/pdf-engine/document.tsx
  - src-tauri/src/lib.rs
  - src/app/login/page.tsx
  - src/components/LogoUploader.tsx
  - src/lib/cases-api.ts
  - src/app/(dashboard)/layout.tsx
  - src/components/settings/PremiumUnlockSection.tsx
  - src/lib/pdf-themes/theme-d-fresh/index.tsx
  - src/components/settings/LandApiSection.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src-tauri/src/commands/mod.rs
  - src/lib/pdf-themes/theme-e-warm/index.tsx
  - src/app/(dashboard)/settings/page.tsx
  - src/lib/land-registry-api.ts
  - src/components/PdfPreviewer.tsx
  - src-tauri/src/mcp_client.rs
  - src/app/(dashboard)/dev/page.tsx
  - vitest.config.ts
  - src/components/CaseSupplementDialog.tsx
  - src/lib/pdf-engine/react-pdf-init.ts
  - src/lib/pdf-engine/index.ts
  - src/lib/mock-backend.ts
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/components/ComingSoonCard.tsx
  - src/lib/safe-invoke.ts
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/lib/pdf-themes/index.ts
  - src/components/AppSidebar.tsx
  - src/resources/fonts/NotoSansTC-Regular.otf
  - src/lib/pdf-engine/engine.ts
  - src/lib/pdf-engine/react-pdf-components.tsx
  - src/components/case-wizard/CaseWizardStep2.tsx
  - vitest.setup.ts
  - src/components/SettingsTabs.tsx
  - src/lib/address-parser.ts
  - src/components/CaseListActions.tsx
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/components/OwnerAuthorizationDialog.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/ThemeSelector.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src-tauri/src/commands/real_price.rs
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src-tauri/src/land_registry/batch/mod.rs
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/app/(dashboard)/settings/branding/page.tsx
  - src/app/(dashboard)/cases/page.tsx
  - src/app/(dashboard)/cases/new/page.tsx
tests:
  - src/lib/__tests__/address-parser.test.ts
  - src/components/__tests__/ThemeSelector.test.tsx
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
  - src/lib/pdf-engine/__tests__/render-with-legal.test.tsx
  - src/lib/pdf-engine/__tests__/document.test.tsx
  - src/lib/pdf-engine/__tests__/react-pdf-components.test.tsx
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/lib/pdf-engine/__tests__/engine.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/components/__tests__/ComingSoonCard.test.tsx
  - src/components/__tests__/AppSidebar.test.tsx
  - src/components/__tests__/RealPricePanel.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/components/settings/__tests__/PremiumUnlockSection.test.tsx
-->

---
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

<!-- @trace
source: aire-ux-bugfix-wave1
updated: 2026-05-16
code:
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src/components/RealPricePanel.tsx
  - src/components/case-wizard/CaseWizard.tsx
  - src/lib/pdf-themes/registry.ts
  - next.config.ts
  - src/lib/pdf-engine/document.tsx
  - src-tauri/src/lib.rs
  - src/app/login/page.tsx
  - src/components/LogoUploader.tsx
  - src/lib/cases-api.ts
  - src/app/(dashboard)/layout.tsx
  - src/components/settings/PremiumUnlockSection.tsx
  - src/lib/pdf-themes/theme-d-fresh/index.tsx
  - src/components/settings/LandApiSection.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src-tauri/src/commands/mod.rs
  - src/lib/pdf-themes/theme-e-warm/index.tsx
  - src/app/(dashboard)/settings/page.tsx
  - src/lib/land-registry-api.ts
  - src/components/PdfPreviewer.tsx
  - src-tauri/src/mcp_client.rs
  - src/app/(dashboard)/dev/page.tsx
  - vitest.config.ts
  - src/components/CaseSupplementDialog.tsx
  - src/lib/pdf-engine/react-pdf-init.ts
  - src/lib/pdf-engine/index.ts
  - src/lib/mock-backend.ts
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/components/ComingSoonCard.tsx
  - src/lib/safe-invoke.ts
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/lib/pdf-themes/index.ts
  - src/components/AppSidebar.tsx
  - src/resources/fonts/NotoSansTC-Regular.otf
  - src/lib/pdf-engine/engine.ts
  - src/lib/pdf-engine/react-pdf-components.tsx
  - src/components/case-wizard/CaseWizardStep2.tsx
  - vitest.setup.ts
  - src/components/SettingsTabs.tsx
  - src/lib/address-parser.ts
  - src/components/CaseListActions.tsx
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/components/OwnerAuthorizationDialog.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/ThemeSelector.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src-tauri/src/commands/real_price.rs
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src-tauri/src/land_registry/batch/mod.rs
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/app/(dashboard)/settings/branding/page.tsx
  - src/app/(dashboard)/cases/page.tsx
  - src/app/(dashboard)/cases/new/page.tsx
tests:
  - src/lib/__tests__/address-parser.test.ts
  - src/components/__tests__/ThemeSelector.test.tsx
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
  - src/lib/pdf-engine/__tests__/render-with-legal.test.tsx
  - src/lib/pdf-engine/__tests__/document.test.tsx
  - src/lib/pdf-engine/__tests__/react-pdf-components.test.tsx
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/lib/pdf-engine/__tests__/engine.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/components/__tests__/ComingSoonCard.test.tsx
  - src/components/__tests__/AppSidebar.test.tsx
  - src/components/__tests__/RealPricePanel.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/components/settings/__tests__/PremiumUnlockSection.test.tsx
-->