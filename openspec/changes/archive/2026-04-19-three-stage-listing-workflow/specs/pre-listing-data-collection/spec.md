## ADDED Requirements

### Requirement: Field-visit form by property type

The system SHALL provide a structured field-visit form for agents to fill in during on-site inspection. The form SHALL display different fields based on property type (residential or farmland). All fields SHALL be accessible from a mobile browser without installing a native app.

#### Scenario: Agent opens form for residential property

- **WHEN** an agent creates a new listing and selects property type "residential"
- **THEN** the system SHALL display the residential field-visit checklist including: address, asking price, floor area (ping), age of building, layout (rooms/halls/bathrooms), floor number, total floors, parking space, and on-site condition notes

#### Scenario: Agent opens form for farmland property

- **WHEN** an agent creates a new listing and selects property type "farmland"
- **THEN** the system SHALL display the farmland field-visit checklist including: address, land area (ping), land category, irrigation access, road frontage, and on-site condition notes

#### Scenario: Agent saves partial field-visit data

- **WHEN** an agent fills in some fields and saves without completing all required fields
- **THEN** the system SHALL save the record with status "field-visit-incomplete" and SHALL NOT allow document generation to be triggered

### Requirement: Secretary supplementary data entry

The system SHALL provide a second data-entry section for the secretary to fill in after the agent's field visit. This section SHALL be accessible from a desktop browser. Document generation SHALL NOT be triggered until both sections are marked complete.

#### Scenario: Secretary completes supplementary data

- **WHEN** a secretary fills in all supplementary fields (land registration transcript summary, cadastral map reference, land use zoning, and mortgage/lien status) and submits
- **THEN** the system SHALL update the record status to "ready-for-generation" and SHALL enable the "Generate Documents" button

#### Scenario: Secretary attempts to generate documents before field-visit data is complete

- **WHEN** a secretary clicks "Generate Documents" but the agent's field-visit section is incomplete
- **THEN** the system SHALL display an error message listing which field-visit fields are missing and SHALL NOT call the document generation API

### Requirement: Two-part listing record

The system SHALL store each property listing as a single record with two clearly separated data sections: "field-visit data" (filled by agent) and "supplementary data" (filled by secretary). Each section SHALL have its own completion status.

#### Scenario: Record status transitions

- **WHEN** a new listing is created
- **THEN** the record status SHALL be "draft"
- **WHEN** the agent submits the field-visit section
- **THEN** the record status SHALL become "field-visit-complete"
- **WHEN** the secretary submits the supplementary section
- **THEN** the record status SHALL become "ready-for-generation"
- **WHEN** documents have been generated successfully
- **THEN** the record status SHALL become "documents-ready"
