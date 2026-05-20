## ADDED Requirements

### Requirement: location-map-api integrates Nominatim geocoding and Overpass facility queries

The system SHALL provide `src/lib/map-api.ts` with two exported async functions: `geocodeAddress` (calls OSM Nominatim) and `fetchAmenities` (calls Overpass API), with structured error types and no API key required.

#### Scenario: geocodeAddress returns coordinates for valid Taiwan address

- **GIVEN** address = "台北市大安區和平東路一段100號"
- **WHEN** `geocodeAddress` is called
- **THEN** returns `{lat, lng}` where lat ≈ 25.02 (±0.5) and lng ≈ 121.54 (±0.5)

#### Scenario: geocodeAddress throws MapGeocodingError for empty address

- **GIVEN** address = "" (empty string)
- **WHEN** `geocodeAddress` is called
- **THEN** throws `MapGeocodingError` with a non-empty `message` field

#### Scenario: fetchAmenities returns typed Amenity array

- **GIVEN** lat=25.02, lng=121.54, radiusM=1000
- **WHEN** `fetchAmenities` is called with mocked Overpass response
- **THEN** returns an array of `Amenity` objects each with `{id, type, name, lat, lng}` fields where `type` is one of "school" | "hospital" | "transit" | "market" | "other"

#### Scenario: fetchAmenities throws MapAmenitiesError on network failure

- **GIVEN** fetch throws a network error
- **WHEN** `fetchAmenities` is called
- **THEN** throws `MapAmenitiesError` with a non-empty `message`
