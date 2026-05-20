## MODIFIED Requirements

### Requirement: Web fallback for location map in assembleDossierData

`assembleDossierData` SHALL attempt to obtain `locationMapImage` via a web API route when Tauri IPC is unavailable.

#### Scenario: IPC fails, lat/lng known from registry data

- **GIVEN** `safeInvoke("fetch_location_map")` throws
- **AND** `geoLat` and `geoLng` are available from land/building registry API data
- **WHEN** `assembleDossierData` is called in a web environment
- **THEN** it SHALL call `/api/location-map?lat={geoLat}&lng={geoLng}` and assign the response bytes to `locationMapImage`

#### Scenario: IPC fails, lat/lng unknown, address available

- **GIVEN** `safeInvoke("fetch_location_map")` throws
- **AND** `geoLat`/`geoLng` are undefined
- **AND** `caseRow.address` is non-empty
- **WHEN** `assembleDossierData` is called
- **THEN** it SHALL call `geocodeAddress(caseRow.address)`, then call `/api/location-map`, and assign the result to `locationMapImage`

#### Scenario: All fallbacks fail

- **GIVEN** all IPC, API route, and geocoding attempts fail
- **WHEN** `assembleDossierData` is called
- **THEN** `locationMapImage` SHALL remain `null` with no uncaught exception
