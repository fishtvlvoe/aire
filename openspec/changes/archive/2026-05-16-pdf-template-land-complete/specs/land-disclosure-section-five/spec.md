# land-disclosure-section-five

## Purpose

Define the field layout and rendering rules for Section Five (五、使用管制內容) of the land disclosure PDF, aligned with the 105-year government-mandated format.

## ADDED Requirements

### Requirement: LandPages SHALL render Section Five with all government-mandated fields

The system SHALL render a PDF page titled "五、使用管制內容" within `LandPages` containing the following fields in order:

1. 都市計畫使用分區 (`urbanPlanZone?: string`) — urban plan zoning designation
2. 非都市土地使用分區及編定 (`nonUrbanLandCategory?: string`) — non-urban land use classification
3. 容積率 (`floorAreaRatio?: string`) — floor area ratio percentage
4. 建蔽率 (`buildingCoverageRatio?: string`) — building coverage ratio percentage
5. 特定目的事業用地 (`specialDesignatedArea?: string`) — special designated area or restrictions

Each field SHALL be rendered using `PdfFieldTable`. When the corresponding `CaseDossierData` field is `undefined`, `null`, or empty string, the value cell SHALL display "待補" in muted text color.

Note: Fields 1-2 (`urbanPlanZone`, `nonUrbanLandCategory`) overlap with the existing `zoningType` and `usageCategory` fields in CaseDossierData. The system SHALL use the dedicated Section Five fields when present; if absent, it MAY fall back to `zoningType`/`usageCategory` as display values for 都市計畫使用分區 and 非都市土地使用分區及編定 respectively.

#### Scenario: Section Five renders with urban zoning data

- **WHEN** `PdfDocument` renders with `propertyType: 'land'` and `urbanPlanZone: '住宅區'` and `floorAreaRatio: '225%'`
- **THEN** the Section Five page SHALL display "住宅區" for 都市計畫使用分區 AND "225%" for 容積率

#### Scenario: Section Five falls back to existing zoningType

- **WHEN** `PdfDocument` renders with `propertyType: 'land'` and `urbanPlanZone` is undefined and `zoningType: '住宅區'`
- **THEN** the Section Five page SHALL display "住宅區" for 都市計畫使用分區

#### Scenario: Section Five renders with all fields undefined

- **WHEN** `PdfDocument` renders with `propertyType: 'land'` and no Section Five fields populated and no `zoningType`/`usageCategory` fallback
- **THEN** the Section Five page SHALL render without errors AND all value cells SHALL display "待補"
