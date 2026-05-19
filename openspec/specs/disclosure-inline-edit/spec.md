# disclosure-inline-edit Specification

## Purpose

TBD - created by archiving change 'disclosure-preview'. Update Purpose after archive.

## Requirements

### Requirement: User edits disclosure field text inline and saves changes

The system SHALL allow users to edit text fields directly in the disclosure preview using contentEditable. Edits are saved automatically on blur and persisted to the database. Only plain text is accepted; HTML tags are stripped before saving.

#### Scenario: User clicks a field and edits text

- **WHEN** user clicks on a text field in the preview (e.g., the object-name field showing "信義路三段100號")
- **THEN** the field becomes editable (contentEditable activates), a visual border appears to indicate edit mode, and the user can type to modify the text

#### Scenario: User finishes editing (blur)

- **WHEN** user clicks outside the edited field or presses Tab
- **THEN** the system sends PATCH /api/documents/disclosure-preview/save with body { listingId, fieldKey, value } where value is the plain text content with HTML tags stripped

**Example:**

| User types | Stored value |
|-----------|-------------|
| 信義路三段100號<b>5樓</b> | 信義路三段100號5樓 |
| 建安不動產&nbsp;台南 | 建安不動產 台南 |
| <script>alert(1)</script>test | test |

#### Scenario: Save succeeds

- **WHEN** PATCH /api/documents/disclosure-preview/save returns 200
- **THEN** the field shows a brief success indicator (green checkmark that fades after 1 second) and the value is persisted in listings.generated_documents JSON under the disclosure_overrides key

#### Scenario: Save fails due to network error

- **WHEN** PATCH /api/documents/disclosure-preview/save fails (network error or 500)
- **THEN** the field shows a red border, a toast message displays the error, and the field reverts to the last saved value

#### Scenario: Multiple fields edited before any blur

- **WHEN** user edits field A, then clicks directly on field B without clicking outside first
- **THEN** field A triggers blur and saves automatically, then field B enters edit mode

**Example:**

| Action sequence | Result |
|----------------|--------|
| Click object-name, type "新名稱", click broker-name | object-name saves "新名稱" via PATCH, broker-name enters edit mode |
| Click company-address, type "台北市", click company-phone | company-address saves "台北市" via PATCH, company-phone enters edit mode |

#### Scenario: Empty field value

- **WHEN** user clears all text from a field and blurs
- **THEN** the system saves an empty string for that fieldKey, and the preview shows the field as empty (no placeholder text in the rendered output)

**Example:**

| fieldKey | Before edit | User action | Stored value | Preview display |
|----------|------------|-------------|-------------|----------------|
| object-name | 信義路三段100號 | Select all + Delete + blur | "" (empty string) | Empty area, no text shown |
| company-phone | 02-12345678 | Select all + Delete + blur | "" (empty string) | Empty area, no text shown |

<!-- @trace
source: disclosure-preview
updated: 2026-05-09
code:
  - src/app/api/documents/disclosure-preview/route.ts
  - src/components/DisclosurePreview.tsx
  - playwright.config.ts
  - src/app/api/admin/templates/background/route.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/app/admin/(dashboard)/templates/page.tsx
  - src/lib/branding/field-layouts.ts
  - src/app/api/documents/disclosure-preview/save/route.ts
  - src/components/DisclosureFieldOverlay.tsx
  - src/app/listings/[id]/documents/preview/page.tsx
  - src/app/api/admin/templates/route.ts
  - src/lib/db/schema.ts
tests:
  - e2e/disclosure-preview-flow.spec.ts
  - src/app/api/__tests__/disclosure-preview-save.test.ts
  - src/app/api/__tests__/disclosure-preview.test.ts
-->

---
### Requirement: Overlay input layer in PdfPreviewer

`PdfPreviewer` SHALL render an absolutely-positioned transparent overlay div over the PDF canvas. The overlay SHALL contain `<input>` elements positioned at the coordinates defined in `src/lib/pdf-field-coords.ts` for the current PDF page. The initial version SHALL cover only the cover page (page 1) fields: 承辦人, 經紀人, 物件名稱. Each input SHALL be invisible (transparent background, no border) until focused.

#### Scenario: Clicking a cover page field

- **GIVEN** the PDF cover page is rendered at 99% zoom (scale = 0.99)
- **AND** `PDF_FIELD_COORDS.agent_name = { page: 1, x: 100, y: 618, w: 200, h: 22 }`
- **WHEN** the user clicks the overlay at approximately (99, 612)
- **THEN** the `<input>` for `agent_name` receives focus and displays a visible underline border

##### Example:

| field_key | PDF coords (x, y, w, h) | scale | overlay position (left, top, width, height) |
|-----------|------------------------|-------|---------------------------------------------|
| agent_name | 100, 618, 200, 22 | 0.99 | 99, 612, 198, 21 |
| broker_name | 100, 645, 200, 22 | 0.99 | 99, 638, 198, 21 |
| property_name | 100, 518, 300, 22 | 0.99 | 99, 513, 297, 21 |


<!-- @trace
source: disclosure-form-wiring
updated: 2026-05-19
code:
  - src/lib/disclosure-schema-residential.ts
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/components/disclosure-form-residential.tsx
  - src/components/case-wizard/CaseWizardStep3Disclosure.tsx
  - src/lib/pdf-field-coords.ts
  - src/components/case-wizard/CaseWizard.tsx
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/components/case-wizard/CaseWizardStep5.tsx
  - src/lib/disclosure-schema-land.ts
  - AGENTS.md
  - src/components/CaseSupplementDialog.tsx
  - src/components/disclosure-form-land.tsx
  - src/components/PdfPreviewer.tsx
tests:
  - src/lib/__tests__/disclosure-schema.test.ts
  - src/components/case-wizard/__tests__/CaseWizardStep3Disclosure.test.tsx
  - src/components/__tests__/CaseSupplementDialog.disclosure.test.tsx
  - src/components/__tests__/CaseWizard.test.tsx
-->

---
### Requirement: Blur saves and re-renders

When an overlay input loses focus (blur event), `PdfPreviewer` SHALL call `save_draft(caseId, updatedPayload, schemaVersion)` with the new field value merged into the existing payload. On save success, `PdfPreviewer` SHALL trigger a PDF re-render to reflect the updated value. On save failure, a toast "預覽更新失敗" SHALL appear and the previous rendered PDF SHALL remain visible.

#### Scenario: Editing承辦人 field

- **WHEN** the user types a value in the 承辦人 overlay input and clicks outside
- **THEN** `save_draft` is called, the PDF re-renders, and the承辦人 field in the PDF shows the new value

#### Scenario: Save failure

- **WHEN** `save_draft` returns an error after blur
- **THEN** a toast "預覽更新失敗" appears and the PDF continues to show the previous value


<!-- @trace
source: disclosure-form-wiring
updated: 2026-05-19
code:
  - src/lib/disclosure-schema-residential.ts
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/components/disclosure-form-residential.tsx
  - src/components/case-wizard/CaseWizardStep3Disclosure.tsx
  - src/lib/pdf-field-coords.ts
  - src/components/case-wizard/CaseWizard.tsx
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/components/case-wizard/CaseWizardStep5.tsx
  - src/lib/disclosure-schema-land.ts
  - AGENTS.md
  - src/components/CaseSupplementDialog.tsx
  - src/components/disclosure-form-land.tsx
  - src/components/PdfPreviewer.tsx
tests:
  - src/lib/__tests__/disclosure-schema.test.ts
  - src/components/case-wizard/__tests__/CaseWizardStep3Disclosure.test.tsx
  - src/components/__tests__/CaseSupplementDialog.disclosure.test.tsx
  - src/components/__tests__/CaseWizard.test.tsx
-->

---
### Requirement: Scale-aware coordinate adjustment

Overlay input positions SHALL be multiplied by the current PDF viewer scale factor (default 0.99 ≈ 99% zoom) to maintain alignment with the rendered PDF canvas. If the PDF viewer scale changes, overlay positions SHALL update accordingly.

#### Scenario: Overlay alignment at default zoom

- **WHEN** the PDF is displayed at 99% zoom (the default)
- **THEN** each overlay input is visually aligned with its corresponding field in the rendered PDF

<!-- @trace
source: disclosure-form-wiring
updated: 2026-05-19
code:
  - src/lib/disclosure-schema-residential.ts
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/components/disclosure-form-residential.tsx
  - src/components/case-wizard/CaseWizardStep3Disclosure.tsx
  - src/lib/pdf-field-coords.ts
  - src/components/case-wizard/CaseWizard.tsx
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/components/case-wizard/CaseWizardStep5.tsx
  - src/lib/disclosure-schema-land.ts
  - AGENTS.md
  - src/components/CaseSupplementDialog.tsx
  - src/components/disclosure-form-land.tsx
  - src/components/PdfPreviewer.tsx
tests:
  - src/lib/__tests__/disclosure-schema.test.ts
  - src/components/case-wizard/__tests__/CaseWizardStep3Disclosure.test.tsx
  - src/components/__tests__/CaseSupplementDialog.disclosure.test.tsx
  - src/components/__tests__/CaseWizard.test.tsx
-->