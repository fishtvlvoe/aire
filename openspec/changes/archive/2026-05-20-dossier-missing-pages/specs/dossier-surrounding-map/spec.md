## ADDED Requirements

### Requirement: Surrounding facilities map renders from address

The system SHALL render an interactive map attachment showing nearby facilities (schools, hospitals, transit, markets) within a 1km radius of the case address, using OSM Nominatim for geocoding and Overpass API for facility queries.

#### Scenario: Map loads successfully from valid address

- **GIVEN** a case with address "台北市大安區和平東路一段 100 號"
- **WHEN** `DossierSurroundingMap` mounts
- **THEN** within 5 seconds the component calls `geocodeAddress` to get lat/lng, then calls `fetchAmenities` with radius=1000m, and renders a Leaflet map container with `data-testid="surrounding-map-container"` visible

#### Scenario: Geocoding failure shows error message

- **GIVEN** geocodeAddress throws `MapGeocodingError`
- **WHEN** `DossierSurroundingMap` mounts
- **THEN** the component renders the message "地圖載入失敗，請確認地址" instead of the map container

#### Scenario: Amenities query failure shows partial result

- **GIVEN** geocodeAddress succeeds but fetchAmenities throws `MapAmenitiesError`
- **THEN** the map container still renders (showing location), and an informational message "周遭設施查詢失敗" is shown below the map

### Requirement: map-api module wraps geocoding and facility queries

The system SHALL provide `src/lib/map-api.ts` with two exported async functions:

1. `geocodeAddress(address: string): Promise<{lat: number; lng: number}>` — calls Nominatim API with `countrycodes=tw`; throws `MapGeocodingError` if result is empty or fetch fails
2. `fetchAmenities(lat: number, lng: number, radiusM: number): Promise<Amenity[]>` — calls Overpass API; throws `MapAmenitiesError` on failure

#### Example: Amenity structure
```
interface Amenity {
  id: number;
  type: "school" | "hospital" | "transit" | "market" | "other";
  name: string;
  lat: number;
  lng: number;
}
```
