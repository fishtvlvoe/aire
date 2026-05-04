## ADDED Requirements

### Requirement: Listing creation assigns owner

When a new listing is created, the system SHALL automatically set owner_id to the currently authenticated user's id.

#### Scenario: Auto-assign owner on creation

- **WHEN** a logged-in user creates a new listing via POST /api/listings
- **THEN** the listings row SHALL have owner_id set to the authenticated user's id

##### Example: Agent creates listing

- **GIVEN** agent "王小明" (user_id=2) is logged in
- **WHEN** POST /api/listings with body { "address": "信義路100號", "type": "apartment" }
- **THEN** the new listing row SHALL have owner_id=2

### Requirement: All listing API endpoints require authentication

Every listing-related API endpoint (GET, POST, PUT, DELETE on /api/listings/*) SHALL reject unauthenticated requests with 401.

#### Scenario: Unauthenticated request rejected

- **WHEN** a request without a valid session cookie hits any /api/listings endpoint
- **THEN** response SHALL be 401 with body { "error": "未登入" }

##### Example: No session cookie

- **GIVEN** no session cookie in request headers
- **WHEN** GET /api/listings
- **THEN** response SHALL be 401 { "error": "未登入" }
