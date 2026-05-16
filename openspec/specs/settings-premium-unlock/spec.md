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

---
### Requirement: admin-auto-unlock-mcp-hub

WHEN the currently authenticated user has role `admin`
THEN the 實價登錄 MCP Hub card on the settings page SHALL display status "已啟用（管理員）"
AND the "前往訂閱" button SHALL NOT be shown
AND no subscription check or payment API call SHALL be made

#### Scenario: Admin sees unlocked state

WHEN an admin user (role === "admin") navigates to 設定 > 進階功能
THEN the 實價登錄 MCP Hub card SHALL render with label "已啟用（管理員）"
AND the "前往訂閱" button SHALL NOT be present in the DOM

##### Example:
- Input: sessionUser = { email: "admin@test.aire", role: "admin" }
- Output: card shows "已啟用（管理員）"; no button with text "前往訂閱"

#### Scenario: Non-admin still sees subscription gate

WHEN a non-admin user (role !== "admin") navigates to 設定 > 進階功能
AND the user does not have an active subscription
THEN the MCP Hub card SHALL show the "前往訂閱" button

##### Example:
- Input: sessionUser = { email: "staff@test.aire", role: "staff" }, subscription = null
- Output: card shows "前往訂閱" button


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
### Requirement: tauri-invoke-browser-safe

The case preview page SHALL NOT import Tauri APIs directly. All Tauri IPC calls (export_pdf, get_theme, load_logo) on the preview page SHALL be routed through `safeInvoke` from `src/lib/safe-invoke.ts`, which provides browser-compatible mock responses when the Tauri runtime is unavailable.

#### Scenario: Preview page loads in browser dev mode

WHEN a user navigates to `/cases/CASE-001/preview` in a Chrome browser (no Tauri runtime)
THEN the page SHALL render the preview UI without throwing `Cannot read properties of undefined (reading 'invoke')`

##### Example:
- Environment: browser (window.__TAURI__ is undefined)
- URL: http://localhost:3000/cases/CASE-001/preview
- Output: page renders; no uncaught TypeError in console

#### Scenario: Export PDF in browser dev mode returns mock response

WHEN a user clicks 匯出 PDF on the preview page in browser dev mode
THEN `safeInvoke("export_pdf", { caseId: "CASE-001" })` SHALL return `{ filePath: "/mock/export/CASE-001.pdf" }`
AND the page SHALL display a notice such as "瀏覽器預覽模式，PDF 未實際產出"

##### Example:
- Input: click 匯出 PDF in browser
- Output: mock filePath returned; notice shown; no crash

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