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