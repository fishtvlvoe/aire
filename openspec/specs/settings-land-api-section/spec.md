# settings-land-api-section Specification

## Purpose

TBD - created by archiving change 'app-auth-settings-redesign'. Update Purpose after archive.

## Requirements

### Requirement: Land API credentials input and save

The Settings page SHALL display a LandApiSection card as the second section.

- **WHEN** the user navigates to the Settings page
- **THEN** the system SHALL display:
  - A text input for "Client ID" pre-filled from saved settings
  - A password input for "安全碼" pre-filled and masked
  - A "儲存" button (disabled when either field is empty)
  - A "測試連線" button (disabled when either field is empty)
  - A "申請說明" external link
  - A YouTube tutorial placeholder area with text "教學影片即將上線"

#### Scenario: Save API credentials

- **GIVEN** the user has entered Client ID `"test-client-123"` and Secret `"test-secret-456"`
- **WHEN** the user clicks "儲存"
- **THEN** the system SHALL call `save_land_api_settings({ clientId: "test-client-123", secret: "test-secret-456" })`
- **THEN** a success toast "地政 API 設定已儲存" SHALL be displayed

##### Example: Credentials saved

- **GIVEN** Client ID input is `"test-client-123"` and Secret input is `"test-secret-456"`
- **WHEN** user clicks "儲存"
- **THEN** `save_land_api_settings` returns `{ success: true }`
- **THEN** toast shows "地政 API 設定已儲存"

#### Scenario: Empty credentials disable buttons

- **WHEN** Client ID or Secret is empty
- **THEN** the "測試連線" button SHALL be disabled
- **THEN** the "儲存" button SHALL be disabled

##### Example: One field empty

- **GIVEN** Client ID is `"test-client-123"` and Secret is `""`
- **WHEN** the form renders
- **THEN** "儲存" button has `disabled` attribute
- **THEN** "測試連線" button has `disabled` attribute


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
### Requirement: Connection test

- **WHEN** saved credentials exist and the user clicks "測試連線"
- **THEN** the system SHALL call `test_land_api_connection()`
- **THEN** a loading spinner SHALL appear on the button during the call

#### Scenario: Connection test success

- **GIVEN** saved credentials exist
- **WHEN** the user clicks "測試連線" and the call succeeds
- **THEN** the system SHALL display green status text "連線成功（延遲 {latency_ms}ms）"

##### Example: Successful test

- **GIVEN** `save_land_api_settings` was called with valid credentials
- **WHEN** user clicks "測試連線"
- **THEN** `test_land_api_connection` returns `{ success: true, latency_ms: 120 }`
- **THEN** status text shows "連線成功（延遲 120ms）"

#### Scenario: Connection test failure

- **GIVEN** saved credentials exist
- **WHEN** the user clicks "測試連線" and the call fails
- **THEN** the system SHALL display red status text "連線失敗，請確認 Client ID 和安全碼"

##### Example: Failed test

- **GIVEN** `test_land_api_connection` returns `{ success: false, latency_ms: 0 }`
- **WHEN** user clicks "測試連線"
- **THEN** status text shows "連線失敗，請確認 Client ID 和安全碼" in red

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
### Requirement: Disabled button tooltip explanation
The "測試連線" button in the land registry API settings section SHALL display a tooltip with text "請先填入 Client ID 和安全碼" when the button is in disabled state. The button SHALL be disabled when either the Client ID or security code input field is empty. When both fields contain non-empty values, the button SHALL become enabled and the tooltip SHALL be removed.

#### Scenario: Hover disabled button
- **WHEN** Client ID is empty and user hovers over the disabled "測試連線" button
- **THEN** a tooltip "請先填入 Client ID 和安全碼" is displayed

#### Scenario: Both fields filled enables button
- **WHEN** user enters values in both Client ID and security code fields
- **THEN** the "測試連線" button becomes enabled (not greyed out) and the tooltip is removed

<!-- @trace
source: aire-settings-polish
updated: 2026-05-16
code:
  - src/components/ThemeSelector.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/pdf-engine/document.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/lib/pdf-themes/theme-e-warm/index.tsx
  - src/app/(dashboard)/settings/page.tsx
  - src/lib/mock-backend.ts
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/lib/pdf-themes/theme-d-fresh/index.tsx
  - src/components/CaseSupplementDialog.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/lib/land-registry-api.ts
  - src/components/AppSidebar.tsx
  - src/lib/pdf-themes/registry.ts
  - src/components/settings/LandApiSection.tsx
  - src/app/(dashboard)/settings/branding/page.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src/lib/cases-api.ts
  - src/components/OwnerAuthorizationDialog.tsx
  - src/components/SettingsTabs.tsx
  - src/components/ComingSoonCard.tsx
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src/lib/pdf-themes/index.ts
  - src/components/case-wizard/CaseWizard.tsx
  - src/components/CaseListActions.tsx
  - src/app/(dashboard)/cases/page.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/components/case-wizard/CaseWizardStep2.tsx
tests:
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/components/__tests__/AppSidebar.test.tsx
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
  - src/components/__tests__/ComingSoonCard.test.tsx
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/page.test.tsx
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/components/__tests__/ThemeSelector.test.tsx
-->