## MODIFIED Requirements

### Requirement: floor-plan-page-in-pdf

The `PdfDocument` component (via `BuildingPages` and `LandPages`) SHALL conditionally render a `FloorPlanPhotoPage` component based on `CaseDossierData.floorPlanPhoto`. The component SHALL always be rendered (unconditional) to preserve page numbering consistency; it SHALL internally choose between showing the actual image or placeholder text.

`FloorPlanPhotoPage` SHALL accept props `{ photo: Uint8Array | null; title: string }` where:
- `title = "格局圖"` for building type
- `title = "土地規劃圖"` for land type

Insertion order:
- `BuildingPages`: after `ExteriorPhotoPage`, before `FieldSketchFloorPlanPage` (if present)
- `LandPages`: after `ExteriorPhotoPage`

#### Scenario: building PDF with floor plan photo

- **GIVEN** `data.propertyType === "building"` and `data.floorPlanPhoto` is a non-null `Uint8Array`
- **WHEN** `PdfDocument` renders
- **THEN** a `FloorPlanPhotoPage` with title "格局圖" and the image appears after the exterior photo page

#### Scenario: land PDF with planning map photo

- **GIVEN** `data.propertyType === "land"` and `data.floorPlanPhoto` is a non-null `Uint8Array`
- **WHEN** `PdfDocument` renders
- **THEN** a `FloorPlanPhotoPage` with title "土地規劃圖" and the image appears after the exterior photo page

#### Scenario: no photo — placeholder only

- **GIVEN** `data.floorPlanPhoto` is null
- **WHEN** `PdfDocument` renders
- **THEN** `FloorPlanPhotoPage` renders with placeholder text and no exception is thrown
