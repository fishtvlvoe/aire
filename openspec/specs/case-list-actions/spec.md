# case-list-actions Specification

## Purpose

TBD - created by archiving change 'aire-ux-wizard-refactor'. Update Purpose after archive.

## Requirements

### Requirement: SVG icon action buttons
The case list table SHALL render 5 action buttons in the rightmost column for each row: 補件 (PlusCircle icon), 查看 (Eye icon), 修改 (Pencil icon), 刪除 (Trash2 icon), 下載 (Download icon). Each button SHALL be a pure SVG icon from the Lucide React library. Each button SHALL display a tooltip with the action name on hover.

#### Scenario: Render action buttons
- **WHEN** the case list page loads with at least one case
- **THEN** each table row displays 5 SVG icon buttons in the action column

#### Scenario: Hover tooltip
- **WHEN** user hovers over the 刪除 button
- **THEN** a tooltip reading "刪除" appears near the button


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
### Requirement: Row click navigation
The entire table row SHALL be clickable. Clicking anywhere on the row (outside the action buttons area) SHALL navigate to the case detail page (`/cases/[id]`). Action buttons SHALL call `event.stopPropagation()` to prevent row click from firing.

#### Scenario: Click row text
- **WHEN** user clicks the address text in a table row
- **THEN** the browser navigates to `/cases/[id]` for that case

#### Scenario: Click action button
- **WHEN** user clicks the 修改 icon button
- **THEN** the 修改 action fires AND the row click navigation does NOT fire


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
### Requirement: Delete confirmation dialog
Clicking the 刪除 button SHALL open a confirmation dialog with the message "確定要刪除此案件？此操作無法還原。" and two buttons: "確認刪除" (destructive) and "取消". The case SHALL only be deleted after the user clicks "確認刪除".

#### Scenario: Confirm delete
- **WHEN** user clicks 刪除 icon → dialog appears → user clicks "確認刪除"
- **THEN** the case is deleted from the database and removed from the list

#### Scenario: Cancel delete
- **WHEN** user clicks 刪除 icon → dialog appears → user clicks "取消"
- **THEN** the dialog closes and the case remains in the list


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
### Requirement: Download button triggers PDF export
Clicking the 下載 button SHALL trigger PDF export and download for the corresponding case.

#### Scenario: Download PDF
- **WHEN** user clicks the 下載 icon button for a case
- **THEN** the system generates the PDF and initiates a file download


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
### Requirement: Case list column layout
The case list table SHALL display columns: "案件名稱" (user-defined name, optional), "地址" (primary text) with "所有權人" (secondary text below address), "案件類型", "狀態", "建立日期", "操作".

#### Scenario: Address with owner display
- **WHEN** a case has address "台北市大安區和平東路一段100號" and owner "陳小美"
- **THEN** the address column shows "台北市大安區和平東路一段100號" as primary text and "陳小美" as secondary text below it

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