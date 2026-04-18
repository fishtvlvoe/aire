## ADDED Requirements

### Requirement: Listings support hard delete via DELETE API

The system SHALL expose an endpoint to hard delete a listing by id, removing the row from the `listings` table without soft-delete semantics.

#### Scenario: Delete existing listing

- **WHEN** a client sends `DELETE /api/listings/{id}` for an existing listing id
- **THEN** the system SHALL execute `DELETE FROM listings WHERE id = ?`
- **AND** the system SHALL return HTTP 200 with an empty or `{ success: true }` body
- **AND** subsequent `GET /api/listings/{id}` requests SHALL return HTTP 404

#### Scenario: Delete non-existent listing

- **WHEN** a client sends `DELETE /api/listings/{id}` for an id that does not exist
- **THEN** the system SHALL return HTTP 404 with body `{ error: "not found" }`

#### Scenario: Delete listing with foreign key references

- **WHEN** a client deletes a listing that has related rows in other tables via foreign keys
- **THEN** the system SHALL cascade the delete to related rows OR return HTTP 409 with a descriptive error
- **AND** the chosen behavior SHALL be consistent and documented in the implementation comments

### Requirement: Listing status remains unchanged when middle-stage fields are edited after documents are generated

The `listing.status` field SHALL NOT be automatically downgraded when a user edits `field_visit_data` or `supplementary_data` after `status` has reached `documents-ready`.

#### Scenario: Edit field_visit_data on documents-ready listing

- **WHEN** a user navigates to `/listings/{id}/fill` for a listing with status `documents-ready` and updates a field via the existing field-visit form save flow
- **THEN** the system SHALL persist the updated `field_visit_data`
- **AND** the system SHALL keep `listing.status` equal to `documents-ready`
- **AND** the `generated_documents` column SHALL remain unchanged
