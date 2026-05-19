# field-sketch-floor-plan-conversion Specification

## Purpose

TBD - created by archiving change 'field-sketch-floor-plan-conversion'. Update Purpose after archive.

## Requirements

### Requirement: Field sketch entry is attached to the existing floor plan field
The system SHALL expose field sketch capture from the residential disclosure attachments tab next to the existing `attachment_floor_plan` field, without requiring the field agent to operate a floor planning tool.

#### Scenario: sketch option appears beside floor plan attachment field
- **WHEN** an assistant opens the residential disclosure form attachments tab
- **THEN** the system displays a floor plan sketch panel next to the `附建物平面圖` field with upload, convert, review, and approval controls

#### Scenario: no professional tool required
- **WHEN** a field agent returns with a pencil sketch photo
- **THEN** the assistant can upload that image directly without opening Magicplan, Homestyler, or another drawing application


<!-- @trace
source: field-sketch-floor-plan-conversion
updated: 2026-05-19
code:
  - src-tauri/migrations/008_land_lots.sql
  - src-tauri/src/commands/cases.rs
  - src/lib/ipc-error.ts
  - src/lib/use-draft-autosave.ts
  - src/lib/cases-api.ts
  - src-tauri/src/rendering/mod.rs
  - src/components/KeyinSplitPage.tsx
  - src-tauri/src/commands/floor_plan_extraction.rs
  - src-tauri/src/lib.rs
  - src-tauri/src/db/cases.rs
  - src/lib/pdf-themes/registry.ts
  - package.json
  - src/components/FieldSketchFloorPlanPanel.tsx
  - src/components/PdfPreviewer.tsx
  - src/components/DossierPage7FeeTable.tsx
  - src-tauri/src/commands/floor_plan.rs
  - src/components/DossierPage8TaxNotes.tsx
  - src/components/StatusBadge.tsx
  - src-tauri/migrations/009_floor_plan_sketches.sql
  - docs/map-api-reference.md
  - src/app/(dashboard)/cases/page.tsx
  - src/components/CaseLotInput.tsx
  - src/components/disclosure-form-residential.tsx
  - src-tauri/src/db/drafts.rs
  - src-tauri/src/paths.rs
  - src/components/CaseListActions.tsx
  - docs/cop-scrape/00-網站架構圖解.md
  - src/lib/tax-calculator.ts
  - src/components/DossierSurroundingMap.tsx
  - src/components/disclosure-form-land.tsx
  - src/lib/mock-backend.ts
  - src-tauri/src/commands/mod.rs
  - src/components/DisclosureHtmlPreview.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/components/FloorPlanReviewPanel.tsx
  - src-tauri/Cargo.toml
  - src/app/(dashboard)/cases/[id]/keyin/page.tsx
  - src/components/case-wizard/CaseWizardStep5.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/components/DossierPage6Notices.tsx
  - src/hooks/useIpcErrorToast.ts
  - src-tauri/migrations/007_case_status_keyin.sql
  - src-tauri/src/db/floor_plan_sketches.rs
  - src-tauri/src/rendering/floor_plan_renderer.rs
  - src/lib/pdf-blocks/field-sketch-floor-plan-page.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/pdf-engine/document.tsx
  - src-tauri/src/db/mod.rs
  - src-tauri/src/commands/floor_plan_approval.rs
  - src/lib/map-api.ts
  - docs/cop-scrape/scrape_cop.py
  - src-tauri/src/commands/floor_plan_rendering.rs
  - src/lib/disclosure-schema-residential.ts
  - src/components/CaseSupplementDialog.tsx
tests:
  - src/lib/pdf-engine/__tests__/floor-plan-fallback.test.ts
  - src-tauri/tests/e2e_smoke.rs
  - src/components/__tests__/DossierSurroundingMap.test.tsx
  - src/components/__tests__/FieldSketchFloorPlanPanel.test.tsx
  - src/components/__tests__/CaseWizardStep4.test.tsx
  - src/components/__tests__/DossierPage6Notices.test.tsx
  - src/components/__tests__/DossierPage7FeeTable.test.tsx
  - src/components/__tests__/KeyinSplitPage.test.tsx
  - src/lib/__tests__/use-draft-autosave.test.ts
  - src/components/__tests__/CaseSupplementDialog.disclosure.test.tsx
  - src/components/case-wizard/__tests__/CaseWizardStep3Disclosure.test.tsx
  - src/components/__tests__/CaseWizardStep1.test.tsx
  - src/components/__tests__/CaseLotInput.test.tsx
  - src/components/__tests__/DisclosureHtmlPreview.integration.test.tsx
  - src/components/__tests__/FloorPlanReviewPanel.test.tsx
  - src/components/__tests__/PdfPreviewer.test.tsx
  - src/components/__tests__/FieldSketchFloorPlanPanel.autosave.test.tsx
  - src/components/__tests__/StatusBadge.test.tsx
  - src/components/__tests__/CaseWizard.test.tsx
  - src/components/__tests__/DossierPage8TaxNotes.test.tsx
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/__tests__/map-api.test.ts
  - src/lib/__tests__/tax-calculator.test.ts
  - src/components/__tests__/KeyinSplitPage.markkeyin.test.tsx
  - src/lib/__tests__/ipc-error.test.ts
  - src/lib/pdf-blocks/__tests__/field-sketch-floor-plan-page.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/components/__tests__/KeyinSplitPage.preview.test.tsx
  - src/components/__tests__/KeyinSplitPage.taxinputs.test.tsx
  - src/components/__tests__/PdfPreviewer.browser-compat.test.tsx
-->

---
### Requirement: Original field sketch evidence is preserved
The system SHALL preserve the original uploaded field sketch image as immutable evidence and SHALL link every converted floor plan output back to that original sketch.

#### Scenario: original sketch is uploaded
- **WHEN** an assistant uploads a hand-drawn sketch photo for a case
- **THEN** the system stores the original image, records uploader, upload timestamp in Asia/Taipei, file hash, source type `field_sketch`, and case identifier

#### Scenario: converted output keeps evidence link
- **WHEN** the system creates a cleaned floor plan from a field sketch
- **THEN** the converted output record references the original sketch record and displays both images in the review screen

#### Scenario: original sketch cannot be overwritten
- **WHEN** a user uploads a revised sketch for the same case
- **THEN** the system creates a new original sketch version and retains the previous original sketch version


<!-- @trace
source: field-sketch-floor-plan-conversion
updated: 2026-05-19
code:
  - src-tauri/migrations/008_land_lots.sql
  - src-tauri/src/commands/cases.rs
  - src/lib/ipc-error.ts
  - src/lib/use-draft-autosave.ts
  - src/lib/cases-api.ts
  - src-tauri/src/rendering/mod.rs
  - src/components/KeyinSplitPage.tsx
  - src-tauri/src/commands/floor_plan_extraction.rs
  - src-tauri/src/lib.rs
  - src-tauri/src/db/cases.rs
  - src/lib/pdf-themes/registry.ts
  - package.json
  - src/components/FieldSketchFloorPlanPanel.tsx
  - src/components/PdfPreviewer.tsx
  - src/components/DossierPage7FeeTable.tsx
  - src-tauri/src/commands/floor_plan.rs
  - src/components/DossierPage8TaxNotes.tsx
  - src/components/StatusBadge.tsx
  - src-tauri/migrations/009_floor_plan_sketches.sql
  - docs/map-api-reference.md
  - src/app/(dashboard)/cases/page.tsx
  - src/components/CaseLotInput.tsx
  - src/components/disclosure-form-residential.tsx
  - src-tauri/src/db/drafts.rs
  - src-tauri/src/paths.rs
  - src/components/CaseListActions.tsx
  - docs/cop-scrape/00-網站架構圖解.md
  - src/lib/tax-calculator.ts
  - src/components/DossierSurroundingMap.tsx
  - src/components/disclosure-form-land.tsx
  - src/lib/mock-backend.ts
  - src-tauri/src/commands/mod.rs
  - src/components/DisclosureHtmlPreview.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/components/FloorPlanReviewPanel.tsx
  - src-tauri/Cargo.toml
  - src/app/(dashboard)/cases/[id]/keyin/page.tsx
  - src/components/case-wizard/CaseWizardStep5.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/components/DossierPage6Notices.tsx
  - src/hooks/useIpcErrorToast.ts
  - src-tauri/migrations/007_case_status_keyin.sql
  - src-tauri/src/db/floor_plan_sketches.rs
  - src-tauri/src/rendering/floor_plan_renderer.rs
  - src/lib/pdf-blocks/field-sketch-floor-plan-page.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/pdf-engine/document.tsx
  - src-tauri/src/db/mod.rs
  - src-tauri/src/commands/floor_plan_approval.rs
  - src/lib/map-api.ts
  - docs/cop-scrape/scrape_cop.py
  - src-tauri/src/commands/floor_plan_rendering.rs
  - src/lib/disclosure-schema-residential.ts
  - src/components/CaseSupplementDialog.tsx
tests:
  - src/lib/pdf-engine/__tests__/floor-plan-fallback.test.ts
  - src-tauri/tests/e2e_smoke.rs
  - src/components/__tests__/DossierSurroundingMap.test.tsx
  - src/components/__tests__/FieldSketchFloorPlanPanel.test.tsx
  - src/components/__tests__/CaseWizardStep4.test.tsx
  - src/components/__tests__/DossierPage6Notices.test.tsx
  - src/components/__tests__/DossierPage7FeeTable.test.tsx
  - src/components/__tests__/KeyinSplitPage.test.tsx
  - src/lib/__tests__/use-draft-autosave.test.ts
  - src/components/__tests__/CaseSupplementDialog.disclosure.test.tsx
  - src/components/case-wizard/__tests__/CaseWizardStep3Disclosure.test.tsx
  - src/components/__tests__/CaseWizardStep1.test.tsx
  - src/components/__tests__/CaseLotInput.test.tsx
  - src/components/__tests__/DisclosureHtmlPreview.integration.test.tsx
  - src/components/__tests__/FloorPlanReviewPanel.test.tsx
  - src/components/__tests__/PdfPreviewer.test.tsx
  - src/components/__tests__/FieldSketchFloorPlanPanel.autosave.test.tsx
  - src/components/__tests__/StatusBadge.test.tsx
  - src/components/__tests__/CaseWizard.test.tsx
  - src/components/__tests__/DossierPage8TaxNotes.test.tsx
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/__tests__/map-api.test.ts
  - src/lib/__tests__/tax-calculator.test.ts
  - src/components/__tests__/KeyinSplitPage.markkeyin.test.tsx
  - src/lib/__tests__/ipc-error.test.ts
  - src/lib/pdf-blocks/__tests__/field-sketch-floor-plan-page.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/components/__tests__/KeyinSplitPage.preview.test.tsx
  - src/components/__tests__/KeyinSplitPage.taxinputs.test.tsx
  - src/components/__tests__/PdfPreviewer.browser-compat.test.tsx
-->

---
### Requirement: AI extraction creates a structured draft only
The system SHALL use AI vision extraction only to create a structured draft from the sketch and SHALL NOT use an AI-generated image as the approved final floor plan.

#### Scenario: sketch is sent for AI extraction
- **WHEN** an assistant requests conversion for a field sketch
- **THEN** the system extracts rooms, labels, rough dimensions, door/window marks, balcony, kitchen, bathrooms, adjacency, and uncertain items into structured JSON

#### Scenario: extraction confidence is low
- **WHEN** the AI extraction contains unreadable labels, missing room count, or contradictory adjacency
- **THEN** the system marks the draft as needing manual correction and blocks approval until the uncertain items are resolved

#### Scenario: AI generated picture is not final
- **WHEN** an AI service returns an illustrative generated image
- **THEN** the system treats that image as a preview only and prevents it from becoming the approved PDF floor plan asset


<!-- @trace
source: field-sketch-floor-plan-conversion
updated: 2026-05-19
code:
  - src-tauri/migrations/008_land_lots.sql
  - src-tauri/src/commands/cases.rs
  - src/lib/ipc-error.ts
  - src/lib/use-draft-autosave.ts
  - src/lib/cases-api.ts
  - src-tauri/src/rendering/mod.rs
  - src/components/KeyinSplitPage.tsx
  - src-tauri/src/commands/floor_plan_extraction.rs
  - src-tauri/src/lib.rs
  - src-tauri/src/db/cases.rs
  - src/lib/pdf-themes/registry.ts
  - package.json
  - src/components/FieldSketchFloorPlanPanel.tsx
  - src/components/PdfPreviewer.tsx
  - src/components/DossierPage7FeeTable.tsx
  - src-tauri/src/commands/floor_plan.rs
  - src/components/DossierPage8TaxNotes.tsx
  - src/components/StatusBadge.tsx
  - src-tauri/migrations/009_floor_plan_sketches.sql
  - docs/map-api-reference.md
  - src/app/(dashboard)/cases/page.tsx
  - src/components/CaseLotInput.tsx
  - src/components/disclosure-form-residential.tsx
  - src-tauri/src/db/drafts.rs
  - src-tauri/src/paths.rs
  - src/components/CaseListActions.tsx
  - docs/cop-scrape/00-網站架構圖解.md
  - src/lib/tax-calculator.ts
  - src/components/DossierSurroundingMap.tsx
  - src/components/disclosure-form-land.tsx
  - src/lib/mock-backend.ts
  - src-tauri/src/commands/mod.rs
  - src/components/DisclosureHtmlPreview.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/components/FloorPlanReviewPanel.tsx
  - src-tauri/Cargo.toml
  - src/app/(dashboard)/cases/[id]/keyin/page.tsx
  - src/components/case-wizard/CaseWizardStep5.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/components/DossierPage6Notices.tsx
  - src/hooks/useIpcErrorToast.ts
  - src-tauri/migrations/007_case_status_keyin.sql
  - src-tauri/src/db/floor_plan_sketches.rs
  - src-tauri/src/rendering/floor_plan_renderer.rs
  - src/lib/pdf-blocks/field-sketch-floor-plan-page.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/pdf-engine/document.tsx
  - src-tauri/src/db/mod.rs
  - src-tauri/src/commands/floor_plan_approval.rs
  - src/lib/map-api.ts
  - docs/cop-scrape/scrape_cop.py
  - src-tauri/src/commands/floor_plan_rendering.rs
  - src/lib/disclosure-schema-residential.ts
  - src/components/CaseSupplementDialog.tsx
tests:
  - src/lib/pdf-engine/__tests__/floor-plan-fallback.test.ts
  - src-tauri/tests/e2e_smoke.rs
  - src/components/__tests__/DossierSurroundingMap.test.tsx
  - src/components/__tests__/FieldSketchFloorPlanPanel.test.tsx
  - src/components/__tests__/CaseWizardStep4.test.tsx
  - src/components/__tests__/DossierPage6Notices.test.tsx
  - src/components/__tests__/DossierPage7FeeTable.test.tsx
  - src/components/__tests__/KeyinSplitPage.test.tsx
  - src/lib/__tests__/use-draft-autosave.test.ts
  - src/components/__tests__/CaseSupplementDialog.disclosure.test.tsx
  - src/components/case-wizard/__tests__/CaseWizardStep3Disclosure.test.tsx
  - src/components/__tests__/CaseWizardStep1.test.tsx
  - src/components/__tests__/CaseLotInput.test.tsx
  - src/components/__tests__/DisclosureHtmlPreview.integration.test.tsx
  - src/components/__tests__/FloorPlanReviewPanel.test.tsx
  - src/components/__tests__/PdfPreviewer.test.tsx
  - src/components/__tests__/FieldSketchFloorPlanPanel.autosave.test.tsx
  - src/components/__tests__/StatusBadge.test.tsx
  - src/components/__tests__/CaseWizard.test.tsx
  - src/components/__tests__/DossierPage8TaxNotes.test.tsx
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/__tests__/map-api.test.ts
  - src/lib/__tests__/tax-calculator.test.ts
  - src/components/__tests__/KeyinSplitPage.markkeyin.test.tsx
  - src/lib/__tests__/ipc-error.test.ts
  - src/lib/pdf-blocks/__tests__/field-sketch-floor-plan-page.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/components/__tests__/KeyinSplitPage.preview.test.tsx
  - src/components/__tests__/KeyinSplitPage.taxinputs.test.tsx
  - src/components/__tests__/PdfPreviewer.browser-compat.test.tsx
-->

---
### Requirement: Clean floor plan is rendered deterministically
The system SHALL render the final clean floor plan from reviewed structured data using a deterministic renderer so the final image is traceable to confirmed fields.

#### Scenario: reviewed structured draft is rendered
- **WHEN** the assistant confirms room list, adjacency, openings, and labels
- **THEN** the system renders a clean black-and-white floor plan image from the structured data and records renderer version

#### Scenario: dimensions are absent
- **WHEN** the confirmed structured data has no verified dimensions
- **THEN** the system renders the floor plan without numeric scale claims and labels it as not-to-scale

#### Scenario: dimensions are verified
- **WHEN** the confirmed structured data includes dimensions copied from the sketch or manually entered by the assistant
- **THEN** the system displays those dimensions as provided values and records their source as field sketch or manual confirmation


<!-- @trace
source: field-sketch-floor-plan-conversion
updated: 2026-05-19
code:
  - src-tauri/migrations/008_land_lots.sql
  - src-tauri/src/commands/cases.rs
  - src/lib/ipc-error.ts
  - src/lib/use-draft-autosave.ts
  - src/lib/cases-api.ts
  - src-tauri/src/rendering/mod.rs
  - src/components/KeyinSplitPage.tsx
  - src-tauri/src/commands/floor_plan_extraction.rs
  - src-tauri/src/lib.rs
  - src-tauri/src/db/cases.rs
  - src/lib/pdf-themes/registry.ts
  - package.json
  - src/components/FieldSketchFloorPlanPanel.tsx
  - src/components/PdfPreviewer.tsx
  - src/components/DossierPage7FeeTable.tsx
  - src-tauri/src/commands/floor_plan.rs
  - src/components/DossierPage8TaxNotes.tsx
  - src/components/StatusBadge.tsx
  - src-tauri/migrations/009_floor_plan_sketches.sql
  - docs/map-api-reference.md
  - src/app/(dashboard)/cases/page.tsx
  - src/components/CaseLotInput.tsx
  - src/components/disclosure-form-residential.tsx
  - src-tauri/src/db/drafts.rs
  - src-tauri/src/paths.rs
  - src/components/CaseListActions.tsx
  - docs/cop-scrape/00-網站架構圖解.md
  - src/lib/tax-calculator.ts
  - src/components/DossierSurroundingMap.tsx
  - src/components/disclosure-form-land.tsx
  - src/lib/mock-backend.ts
  - src-tauri/src/commands/mod.rs
  - src/components/DisclosureHtmlPreview.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/components/FloorPlanReviewPanel.tsx
  - src-tauri/Cargo.toml
  - src/app/(dashboard)/cases/[id]/keyin/page.tsx
  - src/components/case-wizard/CaseWizardStep5.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/components/DossierPage6Notices.tsx
  - src/hooks/useIpcErrorToast.ts
  - src-tauri/migrations/007_case_status_keyin.sql
  - src-tauri/src/db/floor_plan_sketches.rs
  - src-tauri/src/rendering/floor_plan_renderer.rs
  - src/lib/pdf-blocks/field-sketch-floor-plan-page.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/pdf-engine/document.tsx
  - src-tauri/src/db/mod.rs
  - src-tauri/src/commands/floor_plan_approval.rs
  - src/lib/map-api.ts
  - docs/cop-scrape/scrape_cop.py
  - src-tauri/src/commands/floor_plan_rendering.rs
  - src/lib/disclosure-schema-residential.ts
  - src/components/CaseSupplementDialog.tsx
tests:
  - src/lib/pdf-engine/__tests__/floor-plan-fallback.test.ts
  - src-tauri/tests/e2e_smoke.rs
  - src/components/__tests__/DossierSurroundingMap.test.tsx
  - src/components/__tests__/FieldSketchFloorPlanPanel.test.tsx
  - src/components/__tests__/CaseWizardStep4.test.tsx
  - src/components/__tests__/DossierPage6Notices.test.tsx
  - src/components/__tests__/DossierPage7FeeTable.test.tsx
  - src/components/__tests__/KeyinSplitPage.test.tsx
  - src/lib/__tests__/use-draft-autosave.test.ts
  - src/components/__tests__/CaseSupplementDialog.disclosure.test.tsx
  - src/components/case-wizard/__tests__/CaseWizardStep3Disclosure.test.tsx
  - src/components/__tests__/CaseWizardStep1.test.tsx
  - src/components/__tests__/CaseLotInput.test.tsx
  - src/components/__tests__/DisclosureHtmlPreview.integration.test.tsx
  - src/components/__tests__/FloorPlanReviewPanel.test.tsx
  - src/components/__tests__/PdfPreviewer.test.tsx
  - src/components/__tests__/FieldSketchFloorPlanPanel.autosave.test.tsx
  - src/components/__tests__/StatusBadge.test.tsx
  - src/components/__tests__/CaseWizard.test.tsx
  - src/components/__tests__/DossierPage8TaxNotes.test.tsx
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/__tests__/map-api.test.ts
  - src/lib/__tests__/tax-calculator.test.ts
  - src/components/__tests__/KeyinSplitPage.markkeyin.test.tsx
  - src/lib/__tests__/ipc-error.test.ts
  - src/lib/pdf-blocks/__tests__/field-sketch-floor-plan-page.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/components/__tests__/KeyinSplitPage.preview.test.tsx
  - src/components/__tests__/KeyinSplitPage.taxinputs.test.tsx
  - src/components/__tests__/PdfPreviewer.browser-compat.test.tsx
-->

---
### Requirement: Human confirmation gates legal output
The system SHALL require human confirmation before any converted sketch floor plan can be used in a disclosure PDF.

#### Scenario: checklist is incomplete
- **WHEN** room count, kitchen location, bathroom location, balcony location, entrance, or uncertainty confirmation is incomplete
- **THEN** the system blocks approval and lists the missing confirmation items

#### Scenario: assistant approves converted floor plan
- **WHEN** an authorized assistant confirms the checklist and approves the converted floor plan
- **THEN** the system records approver, approval timestamp in Asia/Taipei, source sketch version, final renderer output version, and approval statement

#### Scenario: approval is revoked
- **WHEN** a user rejects or revokes an approved converted floor plan
- **THEN** the system removes that floor plan from future PDF output while preserving the original sketch and conversion record


<!-- @trace
source: field-sketch-floor-plan-conversion
updated: 2026-05-19
code:
  - src-tauri/migrations/008_land_lots.sql
  - src-tauri/src/commands/cases.rs
  - src/lib/ipc-error.ts
  - src/lib/use-draft-autosave.ts
  - src/lib/cases-api.ts
  - src-tauri/src/rendering/mod.rs
  - src/components/KeyinSplitPage.tsx
  - src-tauri/src/commands/floor_plan_extraction.rs
  - src-tauri/src/lib.rs
  - src-tauri/src/db/cases.rs
  - src/lib/pdf-themes/registry.ts
  - package.json
  - src/components/FieldSketchFloorPlanPanel.tsx
  - src/components/PdfPreviewer.tsx
  - src/components/DossierPage7FeeTable.tsx
  - src-tauri/src/commands/floor_plan.rs
  - src/components/DossierPage8TaxNotes.tsx
  - src/components/StatusBadge.tsx
  - src-tauri/migrations/009_floor_plan_sketches.sql
  - docs/map-api-reference.md
  - src/app/(dashboard)/cases/page.tsx
  - src/components/CaseLotInput.tsx
  - src/components/disclosure-form-residential.tsx
  - src-tauri/src/db/drafts.rs
  - src-tauri/src/paths.rs
  - src/components/CaseListActions.tsx
  - docs/cop-scrape/00-網站架構圖解.md
  - src/lib/tax-calculator.ts
  - src/components/DossierSurroundingMap.tsx
  - src/components/disclosure-form-land.tsx
  - src/lib/mock-backend.ts
  - src-tauri/src/commands/mod.rs
  - src/components/DisclosureHtmlPreview.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/components/FloorPlanReviewPanel.tsx
  - src-tauri/Cargo.toml
  - src/app/(dashboard)/cases/[id]/keyin/page.tsx
  - src/components/case-wizard/CaseWizardStep5.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/components/DossierPage6Notices.tsx
  - src/hooks/useIpcErrorToast.ts
  - src-tauri/migrations/007_case_status_keyin.sql
  - src-tauri/src/db/floor_plan_sketches.rs
  - src-tauri/src/rendering/floor_plan_renderer.rs
  - src/lib/pdf-blocks/field-sketch-floor-plan-page.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/pdf-engine/document.tsx
  - src-tauri/src/db/mod.rs
  - src-tauri/src/commands/floor_plan_approval.rs
  - src/lib/map-api.ts
  - docs/cop-scrape/scrape_cop.py
  - src-tauri/src/commands/floor_plan_rendering.rs
  - src/lib/disclosure-schema-residential.ts
  - src/components/CaseSupplementDialog.tsx
tests:
  - src/lib/pdf-engine/__tests__/floor-plan-fallback.test.ts
  - src-tauri/tests/e2e_smoke.rs
  - src/components/__tests__/DossierSurroundingMap.test.tsx
  - src/components/__tests__/FieldSketchFloorPlanPanel.test.tsx
  - src/components/__tests__/CaseWizardStep4.test.tsx
  - src/components/__tests__/DossierPage6Notices.test.tsx
  - src/components/__tests__/DossierPage7FeeTable.test.tsx
  - src/components/__tests__/KeyinSplitPage.test.tsx
  - src/lib/__tests__/use-draft-autosave.test.ts
  - src/components/__tests__/CaseSupplementDialog.disclosure.test.tsx
  - src/components/case-wizard/__tests__/CaseWizardStep3Disclosure.test.tsx
  - src/components/__tests__/CaseWizardStep1.test.tsx
  - src/components/__tests__/CaseLotInput.test.tsx
  - src/components/__tests__/DisclosureHtmlPreview.integration.test.tsx
  - src/components/__tests__/FloorPlanReviewPanel.test.tsx
  - src/components/__tests__/PdfPreviewer.test.tsx
  - src/components/__tests__/FieldSketchFloorPlanPanel.autosave.test.tsx
  - src/components/__tests__/StatusBadge.test.tsx
  - src/components/__tests__/CaseWizard.test.tsx
  - src/components/__tests__/DossierPage8TaxNotes.test.tsx
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/__tests__/map-api.test.ts
  - src/lib/__tests__/tax-calculator.test.ts
  - src/components/__tests__/KeyinSplitPage.markkeyin.test.tsx
  - src/lib/__tests__/ipc-error.test.ts
  - src/lib/pdf-blocks/__tests__/field-sketch-floor-plan-page.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/components/__tests__/KeyinSplitPage.preview.test.tsx
  - src/components/__tests__/KeyinSplitPage.taxinputs.test.tsx
  - src/components/__tests__/PdfPreviewer.browser-compat.test.tsx
-->

---
### Requirement: Disclosure PDF includes source and limitation statement
The system SHALL include source and limitation text when a converted field sketch floor plan appears in the disclosure PDF.

#### Scenario: approved converted sketch is included
- **WHEN** a case has an approved converted field sketch floor plan and the assistant generates the disclosure PDF
- **THEN** the PDF includes the clean floor plan image with source label `現場手稿整理圖` and a limitation statement

#### Scenario: limitation statement appears
- **WHEN** the PDF includes a converted field sketch floor plan
- **THEN** the PDF states that the drawing is organized from field sketch information for layout reference and that legal area, rights scope, and official records follow land registry and title documents

#### Scenario: no approved converted sketch exists
- **WHEN** a case has uploaded sketches but no approved converted floor plan
- **THEN** the PDF excludes the converted floor plan page and generation still succeeds


<!-- @trace
source: field-sketch-floor-plan-conversion
updated: 2026-05-19
code:
  - src-tauri/migrations/008_land_lots.sql
  - src-tauri/src/commands/cases.rs
  - src/lib/ipc-error.ts
  - src/lib/use-draft-autosave.ts
  - src/lib/cases-api.ts
  - src-tauri/src/rendering/mod.rs
  - src/components/KeyinSplitPage.tsx
  - src-tauri/src/commands/floor_plan_extraction.rs
  - src-tauri/src/lib.rs
  - src-tauri/src/db/cases.rs
  - src/lib/pdf-themes/registry.ts
  - package.json
  - src/components/FieldSketchFloorPlanPanel.tsx
  - src/components/PdfPreviewer.tsx
  - src/components/DossierPage7FeeTable.tsx
  - src-tauri/src/commands/floor_plan.rs
  - src/components/DossierPage8TaxNotes.tsx
  - src/components/StatusBadge.tsx
  - src-tauri/migrations/009_floor_plan_sketches.sql
  - docs/map-api-reference.md
  - src/app/(dashboard)/cases/page.tsx
  - src/components/CaseLotInput.tsx
  - src/components/disclosure-form-residential.tsx
  - src-tauri/src/db/drafts.rs
  - src-tauri/src/paths.rs
  - src/components/CaseListActions.tsx
  - docs/cop-scrape/00-網站架構圖解.md
  - src/lib/tax-calculator.ts
  - src/components/DossierSurroundingMap.tsx
  - src/components/disclosure-form-land.tsx
  - src/lib/mock-backend.ts
  - src-tauri/src/commands/mod.rs
  - src/components/DisclosureHtmlPreview.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/components/FloorPlanReviewPanel.tsx
  - src-tauri/Cargo.toml
  - src/app/(dashboard)/cases/[id]/keyin/page.tsx
  - src/components/case-wizard/CaseWizardStep5.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/components/DossierPage6Notices.tsx
  - src/hooks/useIpcErrorToast.ts
  - src-tauri/migrations/007_case_status_keyin.sql
  - src-tauri/src/db/floor_plan_sketches.rs
  - src-tauri/src/rendering/floor_plan_renderer.rs
  - src/lib/pdf-blocks/field-sketch-floor-plan-page.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/pdf-engine/document.tsx
  - src-tauri/src/db/mod.rs
  - src-tauri/src/commands/floor_plan_approval.rs
  - src/lib/map-api.ts
  - docs/cop-scrape/scrape_cop.py
  - src-tauri/src/commands/floor_plan_rendering.rs
  - src/lib/disclosure-schema-residential.ts
  - src/components/CaseSupplementDialog.tsx
tests:
  - src/lib/pdf-engine/__tests__/floor-plan-fallback.test.ts
  - src-tauri/tests/e2e_smoke.rs
  - src/components/__tests__/DossierSurroundingMap.test.tsx
  - src/components/__tests__/FieldSketchFloorPlanPanel.test.tsx
  - src/components/__tests__/CaseWizardStep4.test.tsx
  - src/components/__tests__/DossierPage6Notices.test.tsx
  - src/components/__tests__/DossierPage7FeeTable.test.tsx
  - src/components/__tests__/KeyinSplitPage.test.tsx
  - src/lib/__tests__/use-draft-autosave.test.ts
  - src/components/__tests__/CaseSupplementDialog.disclosure.test.tsx
  - src/components/case-wizard/__tests__/CaseWizardStep3Disclosure.test.tsx
  - src/components/__tests__/CaseWizardStep1.test.tsx
  - src/components/__tests__/CaseLotInput.test.tsx
  - src/components/__tests__/DisclosureHtmlPreview.integration.test.tsx
  - src/components/__tests__/FloorPlanReviewPanel.test.tsx
  - src/components/__tests__/PdfPreviewer.test.tsx
  - src/components/__tests__/FieldSketchFloorPlanPanel.autosave.test.tsx
  - src/components/__tests__/StatusBadge.test.tsx
  - src/components/__tests__/CaseWizard.test.tsx
  - src/components/__tests__/DossierPage8TaxNotes.test.tsx
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/__tests__/map-api.test.ts
  - src/lib/__tests__/tax-calculator.test.ts
  - src/components/__tests__/KeyinSplitPage.markkeyin.test.tsx
  - src/lib/__tests__/ipc-error.test.ts
  - src/lib/pdf-blocks/__tests__/field-sketch-floor-plan-page.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/components/__tests__/KeyinSplitPage.preview.test.tsx
  - src/components/__tests__/KeyinSplitPage.taxinputs.test.tsx
  - src/components/__tests__/PdfPreviewer.browser-compat.test.tsx
-->

---
### Requirement: Conversion audit trail is available for dispute review
The system SHALL retain a conversion audit trail containing original sketch, extracted draft, manual edits, approval checklist, final rendered image, model metadata when AI is used, and PDF inclusion history.

#### Scenario: audit trail opened
- **WHEN** a manager opens the floor plan conversion history for a case
- **THEN** the system shows original sketch versions, extracted JSON versions, manual edits, approvals, and final output versions in chronological order

#### Scenario: AI model metadata recorded
- **WHEN** AI extraction is used for a sketch
- **THEN** the system records provider, model identifier, request timestamp, prompt template version, and response fingerprint without exposing private API keys

#### Scenario: PDF output history recorded
- **WHEN** a PDF is generated with a converted field sketch floor plan
- **THEN** the system records which approved floor plan version was included in that PDF generation event

<!-- @trace
source: field-sketch-floor-plan-conversion
updated: 2026-05-19
code:
  - src-tauri/migrations/008_land_lots.sql
  - src-tauri/src/commands/cases.rs
  - src/lib/ipc-error.ts
  - src/lib/use-draft-autosave.ts
  - src/lib/cases-api.ts
  - src-tauri/src/rendering/mod.rs
  - src/components/KeyinSplitPage.tsx
  - src-tauri/src/commands/floor_plan_extraction.rs
  - src-tauri/src/lib.rs
  - src-tauri/src/db/cases.rs
  - src/lib/pdf-themes/registry.ts
  - package.json
  - src/components/FieldSketchFloorPlanPanel.tsx
  - src/components/PdfPreviewer.tsx
  - src/components/DossierPage7FeeTable.tsx
  - src-tauri/src/commands/floor_plan.rs
  - src/components/DossierPage8TaxNotes.tsx
  - src/components/StatusBadge.tsx
  - src-tauri/migrations/009_floor_plan_sketches.sql
  - docs/map-api-reference.md
  - src/app/(dashboard)/cases/page.tsx
  - src/components/CaseLotInput.tsx
  - src/components/disclosure-form-residential.tsx
  - src-tauri/src/db/drafts.rs
  - src-tauri/src/paths.rs
  - src/components/CaseListActions.tsx
  - docs/cop-scrape/00-網站架構圖解.md
  - src/lib/tax-calculator.ts
  - src/components/DossierSurroundingMap.tsx
  - src/components/disclosure-form-land.tsx
  - src/lib/mock-backend.ts
  - src-tauri/src/commands/mod.rs
  - src/components/DisclosureHtmlPreview.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/components/FloorPlanReviewPanel.tsx
  - src-tauri/Cargo.toml
  - src/app/(dashboard)/cases/[id]/keyin/page.tsx
  - src/components/case-wizard/CaseWizardStep5.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/components/DossierPage6Notices.tsx
  - src/hooks/useIpcErrorToast.ts
  - src-tauri/migrations/007_case_status_keyin.sql
  - src-tauri/src/db/floor_plan_sketches.rs
  - src-tauri/src/rendering/floor_plan_renderer.rs
  - src/lib/pdf-blocks/field-sketch-floor-plan-page.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/pdf-engine/document.tsx
  - src-tauri/src/db/mod.rs
  - src-tauri/src/commands/floor_plan_approval.rs
  - src/lib/map-api.ts
  - docs/cop-scrape/scrape_cop.py
  - src-tauri/src/commands/floor_plan_rendering.rs
  - src/lib/disclosure-schema-residential.ts
  - src/components/CaseSupplementDialog.tsx
tests:
  - src/lib/pdf-engine/__tests__/floor-plan-fallback.test.ts
  - src-tauri/tests/e2e_smoke.rs
  - src/components/__tests__/DossierSurroundingMap.test.tsx
  - src/components/__tests__/FieldSketchFloorPlanPanel.test.tsx
  - src/components/__tests__/CaseWizardStep4.test.tsx
  - src/components/__tests__/DossierPage6Notices.test.tsx
  - src/components/__tests__/DossierPage7FeeTable.test.tsx
  - src/components/__tests__/KeyinSplitPage.test.tsx
  - src/lib/__tests__/use-draft-autosave.test.ts
  - src/components/__tests__/CaseSupplementDialog.disclosure.test.tsx
  - src/components/case-wizard/__tests__/CaseWizardStep3Disclosure.test.tsx
  - src/components/__tests__/CaseWizardStep1.test.tsx
  - src/components/__tests__/CaseLotInput.test.tsx
  - src/components/__tests__/DisclosureHtmlPreview.integration.test.tsx
  - src/components/__tests__/FloorPlanReviewPanel.test.tsx
  - src/components/__tests__/PdfPreviewer.test.tsx
  - src/components/__tests__/FieldSketchFloorPlanPanel.autosave.test.tsx
  - src/components/__tests__/StatusBadge.test.tsx
  - src/components/__tests__/CaseWizard.test.tsx
  - src/components/__tests__/DossierPage8TaxNotes.test.tsx
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/__tests__/map-api.test.ts
  - src/lib/__tests__/tax-calculator.test.ts
  - src/components/__tests__/KeyinSplitPage.markkeyin.test.tsx
  - src/lib/__tests__/ipc-error.test.ts
  - src/lib/pdf-blocks/__tests__/field-sketch-floor-plan-page.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/components/__tests__/KeyinSplitPage.preview.test.tsx
  - src/components/__tests__/KeyinSplitPage.taxinputs.test.tsx
  - src/components/__tests__/PdfPreviewer.browser-compat.test.tsx
-->