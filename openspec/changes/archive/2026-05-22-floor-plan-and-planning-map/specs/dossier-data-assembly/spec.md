## MODIFIED Requirements

### Requirement: dossier-floor-plan-photo

`assembleDossierData` SHALL populate `CaseDossierData.floorPlanPhoto` (type `Uint8Array | null`) by attempting `safeInvoke("get_floor_plan_photo", { case_id })` first. If the IPC call throws or returns null, the function SHALL fall back to reading `caseRow.land_registry_data?.floor_plan_photo?.base64` (string) and decoding it with `atob()` or `Buffer.from(b64, "base64")`. If neither source provides data, `floorPlanPhoto` SHALL be `null`. Failure in either path SHALL NOT throw; `floorPlanPhoto` SHALL silently be null.

#### Scenario: read from IPC

- **GIVEN** a case where `get_floor_plan_photo` IPC returns `{ bytes: [255,216,...], mime: "image/jpeg" }`
- **WHEN** `assembleDossierData` runs
- **THEN** `CaseDossierData.floorPlanPhoto` is a `Uint8Array` of those bytes

#### Scenario: fall back to land_registry_data

- **GIVEN** a case where IPC throws and `land_registry_data.floor_plan_photo.base64` is a valid base64 string
- **WHEN** `assembleDossierData` runs
- **THEN** `CaseDossierData.floorPlanPhoto` is the decoded `Uint8Array`

#### Scenario: no photo available

- **GIVEN** a case where IPC throws and `land_registry_data` has no `floor_plan_photo` key
- **WHEN** `assembleDossierData` runs
- **THEN** `CaseDossierData.floorPlanPhoto` is null and no exception is thrown
