# settings-premium-unlock Specification

## Purpose

TBD - created by archiving change 'app-auth-settings-redesign'. Update Purpose after archive.

## Requirements

### Requirement: Premium unlock section display

The Settings page SHALL display a PremiumUnlockSection card as the third section.

- **WHEN** the user navigates to the Settings page
- **THEN** the system SHALL display the premium subscription status by calling `get_premium_status()`

#### Scenario: Not subscribed

- **GIVEN** the premium status `subscribed` is `false`
- **WHEN** the user views the PremiumUnlockSection
- **THEN** the system SHALL display:
  - A heading "實價登錄 MCP Hub"
  - A description of the premium feature capabilities
  - A price indication "NT$ 月費訂閱"
  - A "前往訂閱" CTA button

##### Example: Unsubscribed state

- **GIVEN** `get_premium_status` returns `{ subscribed: false, plan: null, expires_at: null }`
- **WHEN** PremiumUnlockSection renders
- **THEN** heading text is "實價登錄 MCP Hub"
- **THEN** "前往訂閱" button is visible and enabled

#### Scenario: Subscribe redirect

- **GIVEN** the premium status `subscribed` is `false`
- **WHEN** the user clicks "前往訂閱"
- **THEN** the system SHALL call `subscribe_premium()`
- **THEN** the system SHALL open the returned `redirect_url` in the system browser

##### Example: Subscribe click

- **GIVEN** `subscribe_premium` returns `{ redirect_url: "https://opcos.tw/checkout/mcp-hub" }`
- **WHEN** user clicks "前往訂閱"
- **THEN** system browser opens `"https://opcos.tw/checkout/mcp-hub"`

#### Scenario: Already subscribed

- **GIVEN** the premium status `subscribed` is `true` with plan `"mcp-hub-monthly"` and expires_at `"2026-07-01T00:00:00+08:00"`
- **WHEN** the user views the PremiumUnlockSection
- **THEN** the system SHALL display:
  - A green Badge "訂閱中"
  - Plan name "MCP Hub 月費方案"
  - Expiration date in ROC format
  - A "管理訂閱" link

##### Example: Subscribed state

- **GIVEN** `get_premium_status` returns `{ subscribed: true, plan: "mcp-hub-monthly", expires_at: "2026-07-01T00:00:00+08:00" }`
- **WHEN** PremiumUnlockSection renders
- **THEN** Badge shows "訂閱中" in green
- **THEN** plan text shows "MCP Hub 月費方案"
- **THEN** "管理訂閱" link is visible

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