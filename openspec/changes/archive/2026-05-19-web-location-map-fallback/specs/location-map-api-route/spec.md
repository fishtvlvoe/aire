## ADDED Requirements

### Requirement: Location map API route

The system SHALL expose `GET /api/location-map` that accepts `lat` and `lng` query params, calls `fetchStaticMap()`, and returns a PNG image.

#### Scenario: Valid coordinates

- **GIVEN** a valid lat in [-90,90] and lng in [-180,180]
- **WHEN** `GET /api/location-map?lat=25.04&lng=121.51` is called
- **THEN** the response SHALL be HTTP 200 with Content-Type `image/png` and body length > 1000 bytes

#### Scenario: Invalid coordinates

- **GIVEN** lat=999 or missing params
- **WHEN** the route receives the request
- **THEN** the response SHALL be HTTP 400 with JSON `{"error":"invalid coordinates"}`

#### Scenario: Upstream failure

- **GIVEN** `fetchStaticMap` returns an empty Uint8Array
- **WHEN** the route processes the request
- **THEN** the response SHALL be HTTP 502 with JSON `{"error":"map fetch failed"}`
