# location-map-api Specification

## Purpose

TBD - created by archiving change 'disclosure-smart-draft'. Update Purpose after archive.

## Requirements

### Requirement: Fetch static location map via Tauri IPC

The system SHALL provide a Tauri IPC command `fetch_location_map` that generates a PNG image by downloading and compositing OpenStreetMap tiles, then adding a red marker at the property coordinate. No API key required.

#### Scenario: Successful map generation

- **WHEN** `fetch_location_map` is called with `{ lat: 25.033, lng: 121.565, zoom: 16, size: "600x400" }`
- **THEN** the system SHALL return PNG bytes (Vec<u8>) of the composited map with a red circle marker at the center

#### Scenario: Network error fetching tiles

- **WHEN** the HTTP request to tile.openstreetmap.org fails or times out (30 second timeout)
- **THEN** the system SHALL return empty Vec<u8> and log the error

#### Scenario: Invalid coordinates

- **WHEN** lat or lng is outside valid range (-90 to 90 / -180 to 180)
- **THEN** the system SHALL return empty Vec<u8> and log a validation error

---
### Requirement: OSM attribution

The system SHALL include "© OpenStreetMap contributors" attribution text rendered at the bottom of the generated map image.

#### Scenario: Attribution present in output

- **WHEN** a map image is successfully generated
- **THEN** the PNG image SHALL contain attribution text at the bottom-right corner
