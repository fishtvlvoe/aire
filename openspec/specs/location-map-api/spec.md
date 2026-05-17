# location-map-api Specification

## Purpose

TBD - created by archiving change 'disclosure-smart-draft'. Update Purpose after archive.

## Requirements

### Requirement: Fetch static location map via Tauri IPC

The system SHALL provide a TypeScript function fetchStaticMap that generates a PNG image by downloading OpenStreetMap tiles from tile.openstreetmap.org at zoom level 16, compositing them into a single image, and adding a red circle marker at the property coordinate. No API key required. The function SHALL accept lat, lng, zoom (default 16), and size (width x height in pixels, default 600x400). The function SHALL return a Promise resolving to Uint8Array of PNG bytes. When the HTTP request to tile.openstreetmap.org fails or times out (30 second timeout), the function SHALL return an empty Uint8Array and log the error via console.warn. When lat or lng is outside valid range (-90 to 90 for lat, -180 to 180 for lng), the function SHALL return an empty Uint8Array and log a validation error.

#### Scenario: Successful map generation

- **WHEN** fetchStaticMap is called with lat 25.033 and lng 121.565 and zoom 16 and width 600 and height 400
- **THEN** the function SHALL return a Uint8Array of PNG bytes with length greater than 1000

#### Scenario: Network error returns empty array

- **WHEN** the HTTP request to tile.openstreetmap.org fails or times out after 30 seconds
- **THEN** the function SHALL return an empty Uint8Array and log the error via console.warn

#### Scenario: Invalid coordinates

- **WHEN** lat is 999 or lng is 999
- **THEN** the function SHALL return an empty Uint8Array and log a validation error via console.warn

---
### Requirement: OSM attribution

The generated map image SHALL include the text OpenStreetMap contributors rendered at the bottom-right corner of the image.

#### Scenario: Attribution present in output

- **WHEN** a map image is successfully generated
- **THEN** the PNG image SHALL contain attribution text at the bottom-right corner
