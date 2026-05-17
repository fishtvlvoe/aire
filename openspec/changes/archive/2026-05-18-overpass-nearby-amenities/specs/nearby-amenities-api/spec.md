## MODIFIED Requirements

### Requirement: Query nearby amenities via Tauri IPC

The system SHALL provide a TypeScript module queryNearbyAmenities that accepts latitude, longitude, and radius in meters, then queries Overpass API (OpenStreetMap) for positive amenities: schools, hospitals, parks, subway/MRT stations, and markets. No API key required. The function SHALL return a Promise resolving to an array of NearbyAmenity objects with fields name (string), category (string), distanceM (number), and address (string), sorted by distanceM ascending.

When the HTTP request to Overpass API times out (30 second timeout) or returns non-200, the function SHALL return an empty array and log the error to console.warn.

When Overpass API returns HTTP 429, the function SHALL return an empty array and log a warning (not throw).

When no matching amenities exist within the specified radius, the function SHALL return an empty array.

#### Scenario: Successful amenity query

- **WHEN** queryNearbyAmenities is called with lat 25.033, lng 121.565, radiusM 1000
- **THEN** the function SHALL return an array of NearbyAmenity objects sorted by distanceM ascending, each with non-empty name and category fields

#### Scenario: Network failure returns empty array

- **WHEN** the HTTP request to overpass-api.de fails or times out after 30 seconds
- **THEN** the function SHALL return an empty array and log the error via console.warn

#### Scenario: Rate limited returns empty array

- **WHEN** Overpass API returns HTTP 429
- **THEN** the function SHALL return an empty array and log a warning via console.warn

### Requirement: Amenity categories mapping to OSM tags

The queryNearbyAmenities function SHALL query Overpass API with the following OSM tag mappings:
- 學校: amenity=school, amenity=university
- 醫院: amenity=hospital
- 公園: leisure=park
- 捷運: station=subway, railway=station with name containing MRT or 捷運
- 市場: amenity=marketplace, shop=supermarket

#### Scenario: Category mapping produces correct Overpass QL query

- **WHEN** the function builds the Overpass QL query for radiusM 1000 around lat 25.033 lng 121.565
- **THEN** the query SHALL include all OSM tags listed above as node and way queries within the specified radius
