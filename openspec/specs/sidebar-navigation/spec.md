# sidebar-navigation Specification

## Purpose

TBD - created by archiving change 'ui-fixes-and-admin'. Update Purpose after archive.

## Requirements

### Requirement: Two-item sidebar navigation
The sidebar SHALL render exactly two top-level navigation items: "案件管理" (icon: FileText, navigates to `/cases`) and "設定" (icon: Settings, navigates to `/settings`). The sidebar SHALL NOT render separate items for "品牌設定" or "日誌".

#### Scenario: Sidebar renders two items
- **WHEN** the user is logged in and views any page
- **THEN** the sidebar displays exactly "案件管理" and "設定" as navigation items

#### Scenario: Navigate to settings
- **WHEN** the user clicks "設定" in the sidebar
- **THEN** the browser navigates to `/settings` and the settings page renders with tabs

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