## ADDED Requirements

### Requirement: Zod validation on all mutating routes

Every API route that performs INSERT, UPDATE, or DELETE SHALL validate the request body with a Zod schema before processing.

#### Scenario: Valid request body

- **WHEN** a POST/PATCH request has a body matching the route's Zod schema
- **THEN** the route processes the request normally

#### Scenario: Invalid request body

- **WHEN** a POST/PATCH request has a body that fails Zod validation
- **THEN** the route returns 400 with `{ error: "Validation failed", code: "VALIDATION_ERROR", details: [...] }`

##### Example: Missing required field

- **GIVEN** POST /api/listings with body `{ "address": "台北市" }` (missing property_type)
- **WHEN** the Zod schema requires property_type
- **THEN** response is 400 with details containing `{ path: ["property_type"], message: "Required" }`

### Requirement: Consistent error format

All validation errors SHALL return the same JSON structure: `{ error: string, code: string, details: ZodIssue[] }`.

#### Scenario: Multiple validation errors

- **WHEN** a request body has two invalid fields (e.g., missing property_type and invalid email format)
- **THEN** the response includes both issues in the details array

##### Example: Multiple errors

- **GIVEN** POST /api/admin/users with body `{ "role": "agent" }` (missing email and password)
- **WHEN** Zod validation runs
- **THEN** response is 400 with `{ error: "Validation failed", code: "VALIDATION_ERROR", details: [{ path: ["email"], message: "Required" }, { path: ["password"], message: "Required" }] }`
