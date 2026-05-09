## ADDED Requirements

### Requirement: Owner-scoped listing access

The system SHALL enforce listing ownership checks on all listing-scoped API routes.

#### Scenario: Agent accesses own listing

- **WHEN** agent A calls any listing-scoped route with a listing owned by agent A
- **THEN** the request is allowed

#### Scenario: Agent accesses another agent's listing

- **WHEN** agent A calls any listing-scoped route with a listing owned by agent B
- **THEN** the request returns 403 Forbidden

#### Scenario: Admin accesses any listing

- **WHEN** an admin user calls any listing-scoped route
- **THEN** the request is allowed regardless of listing owner

#### Scenario: Unauthenticated access

- **WHEN** an unauthenticated request calls any listing-scoped route
- **THEN** the request returns 401 Unauthorized

### Requirement: Internal fetch carries auth

When a route triggers an internal API call (e.g., void fetch for OCR after upload), the request SHALL include the current user's auth credentials.

#### Scenario: Attachment upload triggers OCR

- **WHEN** an agent uploads an attachment and the system triggers OCR extraction via internal fetch
- **THEN** the internal fetch includes the auth cookie/header so the extract route accepts it
