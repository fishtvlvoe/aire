# AIRE MVP Implementation Plan

Date: 2026-05-20

Scope:

- Product: AIRE real-estate disclosure MVP
- First target: 建物版 / 房屋版本 / 大樓華廈
- Runtime: Tauri local app
- SaaS role: license, account, plan entitlement, download/update, minimal usage record
- Privacy rule: customer real-estate case data stays local

## Technical Feasibility

Current assessment:

```text
Technically feasible.
No hard blocker found for MVP.
The work must be sequenced carefully because current UI, storage, and feature gating are only partially aligned.
```

What can be reused:

| Existing capability | Reuse level | Notes |
| --- | --- | --- |
| Tauri local runtime | High | Fits local-only data/privacy direction. |
| SQLite/local draft storage | High | Good base for disclosure draft and supplement editing. |
| Case wizard | Medium | Keep navigation ideas, but workbench layout needs refactor. |
| Residential disclosure schema | Medium | Useful seed, but must be replaced/expanded by Page Contracts. |
| Registry/API pull button | Medium | Useful, but persistence must be verified/fixed. |
| PDF blocks/engine | Medium | Reuse renderer pieces, but source must become Page Contract payload. |
| Case asset upload | Medium | Useful foundation; currently too narrow because it only supports floor plan. |
| Floor-plan/geo services | Medium | Living-function map automation is now a first-version MVP requirement; floor plan/cadastral/aerial/street-view can still be packaged later. |
| Mock premium/feature flags | Low | Replace with real Basic/Pro/Advanced entitlement model. |

## Non-Negotiable Technical Rules

1. Customer property/case/disclosure data must not be uploaded to AIRE Cloud.
2. SaaS Cloud can store only account, license, subscription, device binding, minimal usage, and entitlement state.
3. Manual output slots must exist in Basic.
4. First full-feature MVP includes auto map generation and tax auto-calculation paths; later Basic/Pro/Advanced packaging may gate automation, not document layout.
5. The UI must be driven by Page Contracts, not one-off form assumptions.
6. Registry payload persistence must be proven in real Tauri before depending on it.
7. PDF output and right-side preview must consume the same normalized payload.
8. Missing printable values render blank, not `待補`.
9. Legal/tax wording uses fixed admin/legal/tax templates; normal users edit case values/notes, not controlled wording.

## MVP Workstreams

### Workstream A: Page Contract Foundation

Goal:

Create the source of truth that maps customer documents to UI, local storage, preview, and PDF.

Deliverables:

- `house.cover` Page Contract
- `house.property_rights` Page Contract
- `house.land_building_display` Page Contract
- `house.field_survey.highrise` Page Contract
- `house.living_function` Page Contract

Acceptance criteria:

- Each contract lists field key, label, type, source, storage target, entitlement behavior, preview slot, PDF slot, and missing-data behavior.
- Fields map back to `house-building-source-inventory.md`.
- MVP field survey uses the photo's 38-question customer form as the primary template.
- Automation fields identify which paths are first-version requirements now, especially living-function map generation and tax auto-calculation.

### Workstream B: Local Storage And Persistence

Goal:

Make pulled and manually entered data durable in the local app.

Deliverables:

- Verify real Tauri persistence for registry payloads.
- If missing, add durable local table/columns for registry payloads.
- Normalize draft/supplement payload structure by Page Contract.
- Keep case assets local and referenced by ID/path.

Acceptance criteria:

- Pull registry data, close/reopen case, and confirm data remains available.
- No property address, land number, owner, PDF, image, or registry payload is sent to cloud.
- Draft autosave and formal supplement edit paths use the same local storage boundary.

### Workstream C: Disclosure Workbench UI

Goal:

Replace generic disclosure tabs with a workbench that matches the customer workflow.

Target layout:

```text
Page/section list
  ↓
Left panel: structured fields for selected official page
Right panel: official-style preview of selected page
Bottom/top actions: save, next page, export/checklist
```

Deliverables:

- Case Setup remains separate.
- Draft Disclosure workbench.
- Formal Supplement workbench uses the same Page Contracts but optimized for correction/backfill.
- Field Survey workbench for 大樓華廈.
- Images/Maps workbench for shared image slots.

Acceptance criteria:

- User does not feel they are filling an unrelated generic SaaS form.
- Right preview visibly resembles the formal disclosure page.
- Empty fields render blank, not `待補` and not guessed values.

### Workstream D: Asset Slots

Goal:

Expand asset handling beyond only floor plan.

Required asset slots:

- company_logo
- floor_plan
- exterior_photo
- location_map
- surrounding_map
- cadastral_map
- field_survey_photo
- other_site_photo

Acceptance criteria:

- Basic users can upload images manually.
- First full-feature MVP auto-generates the living-function location/surrounding map.
- Manual upload remains fallback/override for map and image slots.
- Pro/Advanced automation can populate the same slots when packaging is split later.
- Asset files remain local.
- PDF and preview read assets through the same slot model.

### Workstream E: Entitlement And SaaS Control

Goal:

Connect the local app to SaaS-controlled Basic/Pro/Advanced feature availability.

Deliverables:

- Define entitlement payload.
- Replace mock feature flags where needed.
- Cache entitlement locally with grace behavior.
- Gate automation buttons by entitlement.

Acceptance criteria:

- Plan changes on SaaS unlock/lock local automation after sync.
- Basic can still manually fill/upload into output slots.
- Super admin/dev local account can enable all features for testing.

### Workstream F: PDF And Export

Goal:

Generate sellable draft and final disclosure PDF from Page Contract payload.

Deliverables:

- Right-side HTML preview for selected page.
- PDF renderer consuming the same payload.
- Draft output.
- Final supplement output.
- Export checklist for missing required fields/assets.

Acceptance criteria:

- Preview and PDF do not disagree on field values.
- First house PDF has formal document appearance.
- Missing data is visible before export.

## Recommended Build Order

### Phase 1: Lock First Page Contract

1. Create `house.cover`.
2. Create `house.property_rights`.
3. Create `house.land_building_display`.
4. Review with Fish before implementation.
5. Encode approved MVP defaults: optional market appendix, auto-map with manual fallback, tax estimate caveats, fixed legal/tax templates, and 38-question survey with empty checkboxes.

Why:

This prevents backend/frontend/PDF from being built from different assumptions.

### Phase 2: Prove Local Persistence

1. Run real Tauri path.
2. Create/open case.
3. Pull registry data.
4. Reload/reopen.
5. Inspect SQLite/local storage.
6. Patch persistence if needed.

Why:

Registry data is the backbone of the disclosure. If it is not durable, UI work will be unstable.

### Phase 3: Build First Workbench Slice

1. Page list with cover/property-rights pages.
2. Left structured fields for selected page.
3. Right official-style preview.
4. Autosave to local draft.
5. Manual image/logo support where needed.

Why:

This creates the real product interaction pattern before expanding pages.

### Phase 4: Expand Assets And Field Survey

1. Extend `case_assets.kind`.
2. Add image slots.
3. Build 大樓華廈 field survey workbench.
4. Feed field survey data into disclosure pages.

Why:

This covers the customer workflow after site visit and before formal supplement.

### Phase 5: Entitlements

1. Define Basic/Pro/Advanced payload.
2. Gate automation controls.
3. Keep manual slots available in Basic.
4. Add local cache/grace behavior.

Why:

Commercial packaging should not block the first workbench, but must be included before selling.

### Phase 6: Export MVP

1. Generate draft PDF.
2. Generate final PDF after supplement.
3. Add missing-data checklist.
4. Run manual customer-like workflow test.

Immediate implementation sequence:

1. Fixed templates and Page Contract data model.
2. Right-side HTML preview for the selected official page.
3. PDF renderer from the same normalized payload.

Why:

The first sellable value is producing a usable disclosure document.

## Known Risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Registry payload not actually persisted in real DB | High | Verify before UI binding; add durable storage if missing. |
| Existing UI form does not match official page workflow | High | Use Page Contract workbench, not current generic tab form as final UX. |
| Asset model only supports floor plan | Medium | Expand slot model before image-heavy pages. |
| Feature flags are mock-heavy | Medium | Replace with SaaS entitlement payload before paid launch. |
| PDF and HTML preview may diverge | Medium | Force both to consume same Page Contract payload. |
| Legal text/privacy language not final | Medium | Keep legal review task open; do not present as legal advice. |
| MOI API costs/availability vary by service | Medium | Map service cost and availability per field before enabling automation. |

## Fish Support Needed

Immediate support:

1. Confirm first Page Contract order:
   - `house.cover`
   - `house.property_rights`
   - `house.land_building_display`
2. Confirm whether Basic should show market/地籍圖 pages as manual slots or hide them until Pro.
3. Confirm whether first customer test should prioritize draft PDF or formal supplement editing.

Not needed yet:

- No need to整理 all PDFs manually.
- No need to provide new legal wording yet.
- No need to decide final pricing before the first workbench slice exists.
