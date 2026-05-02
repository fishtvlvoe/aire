## ADDED Requirements

### Requirement: OCR field mapping covers legal and financial fields

The system SHALL map OCR-extracted fields to form keys for all legally significant fields. The mapping in `field-mapping.ts` SHALL include at minimum:

- `announced_land_value` → stored in `extracted_data.fields.announced_land_value`
- `rights_range` → stored in `extracted_data.fields.rights_range`
- `land_section` → stored in `extracted_data.fields.land_section`
- `floor_total` → mapped to form key `floor_count`
- `building_area` → mapped to form key `building_area`

Fields that have no corresponding form schema entry (such as `announced_land_value` and `rights_range`) SHALL remain in `extracted_data` and SHALL NOT be written to `field_visit_data`. These fields SHALL be accessible to the document generator via the `extracted_data` data source.

#### Scenario: Transcript uploaded with complete legal fields

- **WHEN** a transcript PDF is uploaded and OCR parsing succeeds
- **THEN** the system SHALL extract `announced_land_value`, `rights_range`, and `land_section` from the parsed result
- **THEN** these values SHALL be persisted in `listing.extracted_data` with their confidence scores

#### Scenario: Transcript uploaded with partial legal fields

- **WHEN** a transcript PDF is uploaded but OCR confidence for `rights_range` is below 0.5
- **THEN** the field SHALL still be stored in `extracted_data` with the low confidence score
- **THEN** the document generator SHALL include the value annotated as `(OCR讀取，請確認)`

#### Scenario: Floor count mapped to form field

- **WHEN** OCR extracts `stories` from the transcript
- **THEN** the system SHALL map it to `floor_total` in the form autofill
- **THEN** the field-visit form SHALL pre-populate the total floors field with the extracted value

##### Example: OCR field mapping coverage

| OCR raw key | Mapped form key | Stored in |
|-------------|-----------------|-----------|
| `stories` | `floor_count` | field_visit_data |
| `building_area` | `building_area` | field_visit_data |
| `land_area` | `land_area` | field_visit_data |
| `announced_land_value` | (no form key) | extracted_data only |
| `rights_range` | (no form key) | extracted_data only |
| `land_section` | `land_section` | field_visit_data |
| `year_built` | `year_built` | field_visit_data |
