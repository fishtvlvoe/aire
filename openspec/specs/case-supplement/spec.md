# case-supplement Specification

## Purpose

TBD - created by archiving change 'aire-ux-wizard-refactor'. Update Purpose after archive.

## Requirements

### Requirement: Supplement dialog
Clicking the 補件 button in the case list SHALL open a dialog (`CaseSupplementDialog`) that displays two sections: (1) file upload area for attachments, (2) list of missing required fields for the case that the user can fill in directly.

#### Scenario: Open supplement dialog
- **WHEN** user clicks the 補件 icon button for a case with missing required fields
- **THEN** a dialog opens showing the upload area and a form listing the missing required fields

#### Scenario: No missing fields
- **WHEN** user clicks the 補件 icon button for a case with all required fields filled
- **THEN** the dialog opens showing only the upload area (no missing fields section)


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
### Requirement: File upload
The supplement dialog SHALL accept file uploads via drag-and-drop or file picker. Accepted file types SHALL be: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.doc`, `.docx`. The system SHALL store uploaded file metadata (filename, size, upload timestamp) in the case record.

#### Scenario: Upload a PDF attachment
- **WHEN** user drags a `.pdf` file into the upload area and clicks "儲存"
- **THEN** the file metadata is stored in the case record and the file appears in the attachments list

#### Scenario: Reject unsupported file type
- **WHEN** user attempts to upload a `.exe` file
- **THEN** the system rejects the file and displays an error message "不支援此檔案格式"


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
### Requirement: Supplement field completion
The dialog SHALL list all required fields that are currently empty for the case. The user SHALL be able to fill in values directly in the dialog. Clicking "儲存" SHALL update the case record with the filled values.

#### Scenario: Fill missing owner name
- **WHEN** the case is missing "所有權人" and user types "陳小美" in the field and clicks "儲存"
- **THEN** the case record is updated with owner_name = "陳小美" and the case list reflects the update

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