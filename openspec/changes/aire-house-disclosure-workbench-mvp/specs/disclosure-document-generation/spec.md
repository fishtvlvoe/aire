## ADDED Requirements

### Requirement: Fixed template preview and PDF stay consistent
The fixed-template disclosure preview and downloaded PDF SHALL be generated from the same Page Contract data and SHALL preserve blank writable fields.

#### Scenario: preview and export after supplement
- **WHEN** a user saves supplement data and opens the disclosure preview
- **THEN** the preview SHALL render from the updated Page Contract
- **THEN** the downloaded PDF SHALL render the same values and blank fields

##### Example: supplement value appears in both outputs
- **GIVEN** `building_energy_efficiency_condition` is manually set to `未提供`
- **WHEN** the user previews and downloads the PDF
- **THEN** both outputs show `未提供` in the same disclosure field

#### Scenario: blank field export
- **WHEN** a fixed-template field has no registry/API/manual value
- **THEN** the preview SHALL show the field as blank or writable space
- **THEN** the PDF SHALL NOT output `待補`

##### Example: missing solar equipment status
- **GIVEN** `solar_photovoltaic_equipment_status` is empty
- **WHEN** the user exports the PDF
- **THEN** the field is left blank for handwritten completion
