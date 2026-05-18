# case-wizard-flow Specification

## Purpose

TBD - created by archiving change 'aire-ux-wizard-refactor'. Update Purpose after archive.

## Requirements

### Requirement: Wizard step navigation
The case detail page SHALL render a Wizard Stepper component with 4 steps: "填寫基本資料" (Step 1), "拉謄本" (Step 2), "實價登錄" (Step 3), "預覽/匯出" (Step 4). The system SHALL display only one step's content at a time, controlled by `currentStep` state.

#### Scenario: Initial load
- **WHEN** user navigates to `/cases/[id]`
- **THEN** the Wizard Stepper renders with Step 1 active and Steps 2-4 in "pending" state

#### Scenario: Forward navigation
- **WHEN** user completes Step 1 (address field is non-empty) and clicks "下一步"
- **THEN** the Wizard advances to Step 2, Step 1 shows "completed" state in the Stepper

#### Scenario: Backward navigation
- **WHEN** user is on Step 2 or later and clicks "上一步"
- **THEN** the Wizard returns to the previous step without losing entered data

#### Scenario: Click completed step in Stepper
- **WHEN** user clicks a completed step indicator in the Stepper bar
- **THEN** the Wizard navigates to that step for editing

#### Scenario: Cannot skip ahead
- **WHEN** user clicks a pending (not yet completed) step indicator in the Stepper bar
- **THEN** nothing happens; the Wizard stays on the current step


<!-- @trace
source: aire-ux-wizard-refactor
updated: 2026-05-16
code:
  - src/components/OwnerAuthorizationDialog.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/lib/pdf-engine/document.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/components/CaseListActions.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/mock-backend.ts
  - src/app/(dashboard)/cases/page.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src/components/CaseSupplementDialog.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/cases-api.ts
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/land-registry-api.ts
  - src/components/case-wizard/CaseWizard.tsx
-->

---
### Requirement: Step 3 conditional display
The Wizard SHALL display Step 3 (實價登錄) only when the user has purchased the premium real-price lookup service. The system SHALL check a feature flag `premium_real_price_enabled` to determine availability.

#### Scenario: Premium not purchased
- **WHEN** `premium_real_price_enabled` is false and user completes Step 2
- **THEN** the Wizard skips Step 3 and advances directly to Step 4; the Stepper shows Step 3 as "skipped"

#### Scenario: Premium purchased
- **WHEN** `premium_real_price_enabled` is true and user completes Step 2
- **THEN** the Wizard advances to Step 3 normally


<!-- @trace
source: aire-ux-wizard-refactor
updated: 2026-05-16
code:
  - src/components/OwnerAuthorizationDialog.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/lib/pdf-engine/document.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/components/CaseListActions.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/mock-backend.ts
  - src/app/(dashboard)/cases/page.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src/components/CaseSupplementDialog.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/cases-api.ts
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/land-registry-api.ts
  - src/components/case-wizard/CaseWizard.tsx
-->

---
### Requirement: Step persistence across page refresh
The system SHALL save `current_step` to the case record in the database whenever the user changes steps. On page load, the Wizard SHALL restore the last saved step.

#### Scenario: Refresh during Step 2
- **WHEN** user is on Step 2 and refreshes the browser
- **THEN** the page reloads and the Wizard resumes at Step 2

<!-- @trace
source: aire-ux-wizard-refactor
updated: 2026-05-16
code:
  - src/components/OwnerAuthorizationDialog.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/lib/pdf-engine/document.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/components/CaseListActions.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/mock-backend.ts
  - src/app/(dashboard)/cases/page.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src/components/CaseSupplementDialog.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/cases-api.ts
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/land-registry-api.ts
  - src/components/case-wizard/CaseWizard.tsx
-->

---
### Requirement: Step indicator navigation

The wizard step indicator (①②③④) SHALL be interactive. Users can click on completed step indicators to navigate directly to that step.

#### Scenario: Click completed step to navigate back

- **WHEN** user is on step 4 and clicks step indicator ①
- **THEN** wizard navigates to step 1, preserving all form data

#### Scenario: Click future step (not yet reached)

- **WHEN** user is on step 2 and clicks step indicator ④
- **THEN** nothing happens; the indicator is visually disabled

#### Scenario: Click current step

- **WHEN** user is on step 2 and clicks step indicator ②
- **THEN** nothing happens; the indicator shows active state but does not re-navigate


<!-- @trace
source: wizard-step4-preview-fix
updated: 2026-05-16
code:
  - src/components/PdfPreviewer.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/components/case-wizard/CaseWizard.tsx
tests:
  - src/components/__tests__/CaseWizardStep4.test.tsx
  - src/components/__tests__/CaseWizard.test.tsx
  - src/components/__tests__/PdfPreviewer.browser-compat.test.tsx
-->

---
### Requirement: Hide next button on final step

The wizard SHALL NOT render the "下一步" button when the user is on the final step (step 4).

#### Scenario: Step 4 navigation buttons

- **WHEN** user reaches step 4
- **THEN** only "上一步" button is visible; "下一步" button is not rendered


<!-- @trace
source: wizard-step4-preview-fix
updated: 2026-05-16
code:
  - src/components/PdfPreviewer.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/components/case-wizard/CaseWizard.tsx
tests:
  - src/components/__tests__/CaseWizardStep4.test.tsx
  - src/components/__tests__/CaseWizard.test.tsx
  - src/components/__tests__/PdfPreviewer.browser-compat.test.tsx
-->

---
### Requirement: Step 4 displays PDF preview

Step 4 "預覽匯出" SHALL embed the PdfPreviewer component to show a live PDF preview of the current case data, along with export and download controls.

#### Scenario: Step 4 content on arrival

- **WHEN** user navigates to step 4
- **THEN** PDF preview iframe loads automatically, showing the disclosure document with current case data; export button and download button are both visible below the preview

<!-- @trace
source: wizard-step4-preview-fix
updated: 2026-05-16
code:
  - src/components/PdfPreviewer.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/components/case-wizard/CaseWizard.tsx
tests:
  - src/components/__tests__/CaseWizardStep4.test.tsx
  - src/components/__tests__/CaseWizard.test.tsx
  - src/components/__tests__/PdfPreviewer.browser-compat.test.tsx
-->

---
### Requirement: Step 1 includes asking price field
Wizard Step 1 (基本資料) SHALL render a numeric input labelled "售價（萬元）" bound to the `asking_price` field of the case. The input SHALL accept only positive integers (or empty). On blur, the displayed value SHALL be the integer entered; on save the system converts 萬元 to NTD by multiplying by 10000 before calling `update_case` IPC.

#### Scenario: User enters asking price in Step 1
- **WHEN** user types "2500" into 售價（萬元）and advances to Step 2
- **THEN** `update_case` is called with `asking_price: 25000000`

#### Scenario: Empty asking price
- **WHEN** user leaves 售價（萬元）blank and advances to Step 2
- **THEN** `update_case` is called with `asking_price: null`


<!-- @trace
source: case-form-fields-expansion
updated: 2026-05-18
code:
  - src-tauri/src/db/cases.rs
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src-tauri/src/lib.rs
  - src-tauri/src/commands/cases.rs
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - src/lib/mock-backend.ts
  - src-tauri/src/db/drafts.rs
  - src/lib/cases-api.ts
  - src-tauri/src/branding/mod.rs
  - src-tauri/migrations/006_case_fields.sql
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/branding-api.ts
  - src-tauri/src/db/mod.rs
  - src/components/case-wizard/CaseWizardStep1.tsx
tests:
  - src/components/__tests__/CaseWizardStep1.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src-tauri/tests/e2e_smoke.rs
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
-->

---
### Requirement: Step 2 includes building lot number field
Wizard Step 2 (地政資料) SHALL render a text input labelled "建號" bound to the `building_lot_no` field of the case. The field SHALL be optional. On save the value is stored via `update_case` IPC.

#### Scenario: User enters building lot number in Step 2
- **WHEN** user types "556-1" into 建號 and advances to Step 3 or Step 4
- **THEN** `update_case` is called with `building_lot_no: "556-1"`

<!-- @trace
source: case-form-fields-expansion
updated: 2026-05-18
code:
  - src-tauri/src/db/cases.rs
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src-tauri/src/lib.rs
  - src-tauri/src/commands/cases.rs
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - src/lib/mock-backend.ts
  - src-tauri/src/db/drafts.rs
  - src/lib/cases-api.ts
  - src-tauri/src/branding/mod.rs
  - src-tauri/migrations/006_case_fields.sql
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/branding-api.ts
  - src-tauri/src/db/mod.rs
  - src/components/case-wizard/CaseWizardStep1.tsx
tests:
  - src/components/__tests__/CaseWizardStep1.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src-tauri/tests/e2e_smoke.rs
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
-->