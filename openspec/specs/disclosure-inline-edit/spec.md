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