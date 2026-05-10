## ADDED Requirements

### Requirement: API request body validation
Every API route that performs data mutation (POST, PATCH, PUT) SHALL validate the request body against a Zod schema before processing.

#### Scenario: Valid listing creation
- **WHEN** a POST request is made to /api/listings with valid data
- **THEN** the system SHALL parse the body using the listing schema
- **THEN** processing SHALL proceed with status 201

#### Scenario: Invalid listing data rejected
- **WHEN** a POST request is made with missing required fields or invalid types
- **THEN** the system SHALL return 400 Bad Request
- **THEN** the response body SHALL contain specific error details

##### Example: Missing property type
- **GIVEN** a request body { "address": "Test" } (missing propertyType)
- **WHEN** POST /api/listings
- **THEN** status 400
- **THEN** response contains ["propertyType is required"]
