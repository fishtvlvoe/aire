## Context

Code inspection on 2026-05-19 shows the current implementation shape:

- `LocationMapPage`, `AerialPhotoPage`, and `ExteriorPhotoPage` already pass data URL strings to `@react-pdf/renderer` images, but each file contains its own `uint8ToDataUrl` helper.
- `CaseDossierData` currently has `locationMapImage`, `aerialPhoto`, and `exteriorPhoto`, but no direct-upload `floorPlanPhoto`.
- `assembleDossierData` already computes map, aerial, street-view, and optional `fieldSketchFloorPlan`; direct-upload floor plan bytes are not read.
- Wizard Step 3 is implemented by `src/components/case-wizard/CaseWizardStep3Disclosure.tsx`; there is no `CaseWizardStep3.tsx`.
- `CaseRow.land_registry_data` is already available through `casesApi.update()` and is the simplest browser/mock persistence path.

## Goals / Non-Goals

**Goals:**
- Preserve a formal SR task record for PDF browser images and direct floor-plan/planning-map upload.
- Keep implementation aligned with the current codebase instead of stale artifact paths.
- Use TDD for focused code changes.
- Make browser/dev PDF export show real image pages when bytes are available.
- Let Step 3 upload one JPG/PNG, persist it, restore preview after refresh, and include it in the PDF.

**Non-Goals:**
- Do not implement Rust file-storage IPC in this SR. The UI and dossier data may attempt the IPC read if present, but web/mock fallback is the acceptance path.
- Do not support multiple floor-plan images.
- Do not implement crop, rotate, compression, AI schematic generation, review workflow, or external floor-plan vendor import.
- Do not merge with `floor-plan-assets-and-ai-schematic`.

## Decisions

### Decision: Shared browser-safe image data URL helper

Create `src/lib/pdf-blocks/image-data-url.ts` and export `uint8ToDataUrl(bytes: Uint8Array): string`.

Behavior:
- `FF D8` prefix maps to `image/jpeg`
- all other non-empty byte arrays map to `image/png`
- output is `data:<mime>;base64,<payload>`

`LocationMapPage`, `AerialPhotoPage`, `ExteriorPhotoPage`, and `FloorPlanPhotoPage` shall import this helper instead of duplicating conversion code.

### Decision: Existing Step 3 disclosure component is the upload surface

The implementation modifies `src/components/case-wizard/CaseWizardStep3Disclosure.tsx`, not the stale artifact path `CaseWizardStep3.tsx`.

The upload block appears after the residential/land disclosure form and before the navigation buttons. The label and test ids depend on `caseData.property_type`:

| property_type | label | file input test id | preview test id |
| --- | --- | --- | --- |
| residential | 格局圖上傳 | floor-plan-file-input | floor-plan-preview |
| land | 規劃圖上傳 | planning-map-file-input | floor-plan-preview |

### Decision: Web/mock persistence uses land_registry_data

For browser/dev validation, persist one uploaded image under:

```typescript
land_registry_data.floor_plan_photo = {
  base64: string,
  mime: "image/jpeg" | "image/png"
}
```

Use `casesApi.update(caseId, { land_registry_data: { ...existing, floor_plan_photo } })` so existing data is preserved.

### Decision: Dossier assembly reads IPC first, then web/mock fallback

`assembleDossierData(caseRow)` shall set `floorPlanPhoto` using:

1. `safeInvoke("get_floor_plan_photo", { case_id: caseRow.id })`
2. if IPC throws or returns no usable bytes, decode `caseRow.land_registry_data?.floor_plan_photo?.base64`
3. if both fail, use `null`

Failure to read the image must not block PDF generation.

### Decision: PDF page is unconditional for this SR

The PDF shall always render a floor-plan/planning-map page:

- Building/residential dossier: after `<ExteriorPhotoPage>`, before `FieldSketchFloorPlanPage`, title `格局圖`
- Land dossier: after `<ExteriorPhotoPage>`, title `土地規劃圖`

If `floorPlanPhoto` is null, the page displays a placeholder:

- `請上傳格局圖`
- `請上傳規劃圖`

### Decision: Existing fieldSketchFloorPlan remains separate

`fieldSketchFloorPlan` is an AI/hand-sketch conversion result. This SR adds a direct-upload image path and does not replace or remove the existing conversion page.

## Implementation Contract

### C1: Browser PDF image helper

- `uint8ToDataUrl(new Uint8Array([0x89, 0x50, 0x4E, 0x47]))` starts with `data:image/png;base64,`
- `uint8ToDataUrl(new Uint8Array([0xFF, 0xD8, 0xFF]))` starts with `data:image/jpeg;base64,`
- Existing map/aerial/exterior PDF pages continue to render without throwing.

### C2: Dossier data shape

- `CaseDossierData.floorPlanPhoto?: Uint8Array | null`
- `assembleDossierData` returns `floorPlanPhoto` in both land and residential branches.
- IPC bytes and base64 fallback both produce `Uint8Array`.
- Missing or invalid image data returns `null`.

### C3: FloorPlanPhotoPage

- Props: `{ photo: Uint8Array | null; title: "格局圖" | "土地規劃圖" | string }`
- With non-empty `photo`, render an `<Image>` using `uint8ToDataUrl(photo)`.
- With null/empty `photo`, render a 430px placeholder with the title-specific upload instruction.
- Rendering must not throw under `@react-pdf/renderer`.

### C4: Step 3 upload block

- JPG and PNG are accepted.
- Files larger than 10MB show `圖片大小不超過 10MB` and do not persist.
- A successful upload updates local preview immediately.
- Refreshing Step 3 restores preview from `caseData.land_registry_data.floor_plan_photo`.
- Existing disclosure draft autosave behavior remains intact.

### C5: PDF export validation

- Browser/dev preview for case `b24e336a-46db-4cf4-845d-cbd95abee3f8` can export a PDF.
- Exported PDF image pages do not regress to the known placeholders when byte data exists:
  - `待取得地圖資料後自動填入`
  - `正在從政府圖資服務取得...`
  - `請於現場拍攝後上傳`

## Risks / Trade-offs

- Storing base64 in `land_registry_data` is acceptable for web/mock validation but not ideal for large production files. This SR caps file size at 10MB and leaves Rust file storage to a future desktop-focused change.
- Browser `btoa` and Node `Buffer` availability differ. The helper should be tested in Vitest and implemented to work in the project test/browser environment.
- Existing total page count labels in `document.tsx` may already be approximate because pages have been appended over time. This SR should not broaden scope into full page-number recalculation unless tests fail specifically because of the new page.
