# brand-settings-persistence Specification

## Purpose

TBD - created by archiving change 'case-form-fields-expansion'. Update Purpose after archive.

## Requirements

### Requirement: Brand text fields stored and retrievable

The system SHALL persist 7 brand identity text fields: `agent_name`, `agent_cert_no`, `company_name`, `company_license_no`, `company_address`, `company_phone`, `realtor_name`. All fields are TEXT nullable. Persistence SHALL go through `StorageAdapter`: in production, `TauriStorageAdapter.saveBranding` calls IPC `save_brand_text_settings`; in development, `MockStorageAdapter.saveBranding` writes to `localStorage['aire-mock-store'].branding`. `StorageAdapter.getBranding` SHALL be called on page mount; returned values SHALL pre-populate the 7 text inputs. If `getBranding` returns null, all inputs render empty.

#### Scenario: Save and retrieve brand text settings

- **WHEN** user fills 公司名稱 as "大安不動產" and clicks 儲存
- **THEN** `StorageAdapter.saveBranding({ companyName: "大安不動產", ... })` is called and the value is persisted
- **AND WHEN** `StorageAdapter.getBranding` is called later (e.g., on next mount)
- **THEN** it returns `{ companyName: "大安不動產", ... }` with the saved value

#### Scenario: Fields restored on page reload in dev environment

- **WHEN** user saves brand settings in dev environment then reloads the page
- **THEN** `localStorage['aire-mock-store'].branding` contains the saved values
- **THEN** the 7 text inputs are pre-populated with the saved values (not empty)

#### Scenario: Empty state

- **WHEN** brand settings have never been saved
- **THEN** all 7 text inputs render empty (not null or undefined)
- **THEN** `aire-mock-store` has no `branding` key or `branding` is null


<!-- @trace
source: fix-qa-bugs
updated: 2026-05-20
code:
  - src/components/KeyinSplitPage.tsx
  - src/components/case-wizard/CaseWizardStep3Disclosure.tsx
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src/lib/storage/StorageAdapter.ts
  - src/app/api/land-api/test-connection/route.ts
  - src/lib/storage/index.ts
  - src/lib/mock-backend.ts
  - src/lib/pdf-engine/html-renderer.tsx
  - src/components/OwnerAuthorizationDialog.tsx
  - src/app/api/location-map/route.ts
  - src/lib/pdf-blocks/location-map.tsx
  - src/lib/pdf-blocks/exterior-photo-page.tsx
  - src/lib/pdf-engine/react-pdf-init.ts
  - src/app/api/aerial-photo/route.ts
  - src/lib/use-draft-autosave.ts
  - src/app/api/street-view/route.ts
  - src/app/login/page.tsx
  - src/lib/pdf-engine/html-blocks/location-and-exterior.tsx
  - src/components/settings/LicenseSection.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/storage/MockStorageAdapter.ts
  - src/lib/pdf-blocks/aerial-photo-page.tsx
  - src/lib/nlsc-aerial-map.ts
  - src/components/case-wizard/CaseWizardStep5.tsx
  - src/lib/pdf-blocks/image-data-url.ts
  - src/app/api/v1/licenses/activate/route.ts
  - src/components/settings/LandApiSection.tsx
  - src/lib/pdf-engine/document.tsx
  - public/pdf-fonts/NotoSansTC-Regular.otf
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - src/app/(dashboard)/layout.tsx
  - src/lib/pdf-blocks/floor-plan-photo-page.tsx
  - src/components/case-wizard/CaseWizard.tsx
tests:
  - src/components/case-wizard/__tests__/CaseWizardStep3Disclosure-storage.test.tsx
  - src/components/__tests__/OwnerAuthorizationDialog-redborder.test.tsx
  - src/components/__tests__/RealtorLicenseField.test.tsx
  - src/components/settings/__tests__/LicenseSection-api.test.tsx
  - src/components/settings/__tests__/LandApiSection-toast.test.tsx
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/branding-storage.test.tsx
  - src/lib/pdf-blocks/__tests__/floor-plan-photo-page.test.tsx
  - src/components/__tests__/KeyinSplitPage.test.tsx
  - src/lib/pdf-blocks/__tests__/uint8-to-data-url.test.ts
  - src/lib/pdf-blocks/__tests__/dynamic-composition.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/app/(dashboard)/settings/sync-status/__tests__/page.test.tsx
  - src/lib/__tests__/use-draft-autosave.test.ts
  - src/lib/storage/__tests__/MockStorageAdapter.test.ts
  - src/lib/pdf-engine/__tests__/document-land-government-format.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/lib/pdf-blocks/__tests__/logo-anchors.test.tsx
  - src/components/settings/__tests__/LicenseSection.test.tsx
  - src/lib/pdf-engine/__tests__/html-renderer-floor-plan-photo.test.tsx
  - src/app/(dashboard)/cases/__tests__/page.test.tsx
  - src/components/case-wizard/__tests__/step3-photo-upload.test.tsx
-->

---
### Requirement: 品牌設定 page renders brand text form

The 品牌設定 settings tab SHALL render a form with 7 labelled text inputs for the brand identity fields, a 儲存 button, and a success toast on save. The form SHALL pre-populate with values returned by `StorageAdapter.getBranding` on mount.

#### Scenario: Page loads with saved data

- **WHEN** user navigates to 品牌設定 tab
- **THEN** all 7 text inputs are pre-populated with the values returned by `StorageAdapter.getBranding`

#### Scenario: Empty state on first visit

- **WHEN** brand settings have never been saved
- **THEN** all 7 text inputs render empty and the user can fill them in

##### Example: Dev environment roundtrip

- **GIVEN** `aire-mock-store.branding` is `{ agentName: "王小明", companyName: "大安不動產", agentCertNo: "A123456" }`
- **WHEN** user navigates to 品牌設定 tab
- **THEN** agent_name input shows "王小明", company_name input shows "大安不動產", agent_cert_no input shows "A123456"

<!-- @trace
source: fix-qa-bugs
updated: 2026-05-20
code:
  - src/components/KeyinSplitPage.tsx
  - src/components/case-wizard/CaseWizardStep3Disclosure.tsx
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src/lib/storage/StorageAdapter.ts
  - src/app/api/land-api/test-connection/route.ts
  - src/lib/storage/index.ts
  - src/lib/mock-backend.ts
  - src/lib/pdf-engine/html-renderer.tsx
  - src/components/OwnerAuthorizationDialog.tsx
  - src/app/api/location-map/route.ts
  - src/lib/pdf-blocks/location-map.tsx
  - src/lib/pdf-blocks/exterior-photo-page.tsx
  - src/lib/pdf-engine/react-pdf-init.ts
  - src/app/api/aerial-photo/route.ts
  - src/lib/use-draft-autosave.ts
  - src/app/api/street-view/route.ts
  - src/app/login/page.tsx
  - src/lib/pdf-engine/html-blocks/location-and-exterior.tsx
  - src/components/settings/LicenseSection.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/storage/MockStorageAdapter.ts
  - src/lib/pdf-blocks/aerial-photo-page.tsx
  - src/lib/nlsc-aerial-map.ts
  - src/components/case-wizard/CaseWizardStep5.tsx
  - src/lib/pdf-blocks/image-data-url.ts
  - src/app/api/v1/licenses/activate/route.ts
  - src/components/settings/LandApiSection.tsx
  - src/lib/pdf-engine/document.tsx
  - public/pdf-fonts/NotoSansTC-Regular.otf
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - src/app/(dashboard)/layout.tsx
  - src/lib/pdf-blocks/floor-plan-photo-page.tsx
  - src/components/case-wizard/CaseWizard.tsx
tests:
  - src/components/case-wizard/__tests__/CaseWizardStep3Disclosure-storage.test.tsx
  - src/components/__tests__/OwnerAuthorizationDialog-redborder.test.tsx
  - src/components/__tests__/RealtorLicenseField.test.tsx
  - src/components/settings/__tests__/LicenseSection-api.test.tsx
  - src/components/settings/__tests__/LandApiSection-toast.test.tsx
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/branding-storage.test.tsx
  - src/lib/pdf-blocks/__tests__/floor-plan-photo-page.test.tsx
  - src/components/__tests__/KeyinSplitPage.test.tsx
  - src/lib/pdf-blocks/__tests__/uint8-to-data-url.test.ts
  - src/lib/pdf-blocks/__tests__/dynamic-composition.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/app/(dashboard)/settings/sync-status/__tests__/page.test.tsx
  - src/lib/__tests__/use-draft-autosave.test.ts
  - src/lib/storage/__tests__/MockStorageAdapter.test.ts
  - src/lib/pdf-engine/__tests__/document-land-government-format.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/lib/pdf-blocks/__tests__/logo-anchors.test.tsx
  - src/components/settings/__tests__/LicenseSection.test.tsx
  - src/lib/pdf-engine/__tests__/html-renderer-floor-plan-photo.test.tsx
  - src/app/(dashboard)/cases/__tests__/page.test.tsx
  - src/components/case-wizard/__tests__/step3-photo-upload.test.tsx
-->