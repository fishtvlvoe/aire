## ADDED Requirements

### Requirement: Query nearby amenities via Tauri IPC

The system SHALL provide a Tauri IPC command `query_nearby_amenities` that accepts latitude, longitude, and radius, then queries Overpass API (OpenStreetMap) for positive amenities: schools, hospitals, parks, subway/MRT stations, and markets. No API key required.

#### Scenario: Successful amenity query

- **WHEN** the IPC command is invoked with `{ lat: 25.033, lng: 121.565, radius_m: 1000 }`
- **THEN** the system SHALL return a JSON array of Amenity objects `[{name, category, distance_m, address}]` sorted by distance ascending

#### Scenario: No amenities found within radius

- **WHEN** no matching amenities exist within the specified radius
- **THEN** the system SHALL return an empty array `[]`

#### Scenario: Network failure

- **WHEN** the HTTP request to Overpass API times out (30 second timeout) or returns non-200
- **THEN** the system SHALL return an empty array and log the error with status code

#### Scenario: Overpass API rate limited

- **WHEN** Overpass API returns HTTP 429 (Too Many Requests)
- **THEN** the system SHALL return an empty array and log a warning (not crash)

### Requirement: Amenity categories mapping to OSM tags

The system SHALL query Overpass API with the following OSM tag mappings:
- 學校 → `amenity=school`, `amenity=university`
- 醫院 → `amenity=hospital`
- 公園 → `leisure=park`
- 捷運 → `station=subway`, `railway=station` with `network~"捷運"`
- 市場 → `amenity=marketplace`, `shop=supermarket`

#### Scenario: Category mapping produces correct Overpass query

- **WHEN** the system builds the Overpass QL query
- **THEN** the query SHALL include all OSM tags listed above within the specified radius
