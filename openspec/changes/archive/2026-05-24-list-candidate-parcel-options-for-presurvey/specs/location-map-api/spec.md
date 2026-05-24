## ADDED Requirements

### Requirement: Map images use candidate coordinates when address geocoding fails

The system SHALL use candidate or external-reference coordinates to generate location and aerial images when direct address geocoding returns no result. Coordinate provenance SHALL be recorded in the dossier data.

#### Scenario: Address geocoding returns empty results

- **WHEN** address geocoding returns an empty result for `台南市東區裕農路288巷17號8樓之1`
- **AND** the candidate reference contains coordinate `22.986314,120.22908`
- **THEN** the system uses that coordinate to request the location map and aerial photo
- **AND** the dossier records coordinate_source `candidate_reference`

#### Scenario: No coordinate source exists

- **WHEN** address geocoding fails and no candidate coordinate exists
- **THEN** the PDF image pages render blank frames with a missing-coordinate reason
- **AND** the system does not display a generic placeholder as if it were the property image

##### Example: Missing all coordinate sources

- **GIVEN** address `台南市東區裕農路288巷17號8樓之1`
- **AND** address geocoding returns no result
- **AND** `coordinate_source` is absent from `land_registry_data`
- **WHEN** the PDF is exported
- **THEN** the location map page displays `缺少座標，待補位置圖`
- **AND** `pdfimages -list` does not contain a fake placeholder image for that page
