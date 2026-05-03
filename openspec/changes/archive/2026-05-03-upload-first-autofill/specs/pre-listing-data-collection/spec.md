## MODIFIED Requirements

### Requirement: Two-part listing record

The system SHALL store each property listing as a single record with two clearly separated data sections: "field-visit data" (filled by agent) and "supplementary data" (filled by secretary). Each section SHALL have its own completion status.

**Added in upload-first-autofill change**: A third section "extracted data" (auto-populated by OCR pipeline) SHALL be maintained alongside the two human-authored sections. The creation flow SHALL sequence upload → OCR extraction → auto-fill before agent review, moving file upload from a late step to the first step of the workflow. Upload SHALL remain optional — agents without documents SHALL be able to skip upload and proceed to manual field entry.

#### Scenario: Record status transitions

- **WHEN** a new listing is created
- **THEN** the record status SHALL be "draft"
- **WHEN** the agent submits the field-visit section
- **THEN** the record status SHALL become "field-visit-complete"
- **WHEN** the secretary submits the supplementary section
- **THEN** the record status SHALL become "ready-for-generation"
- **WHEN** documents have been generated successfully
- **THEN** the record status SHALL become "documents-ready"

#### Scenario: Upload-first creation flow with OCR auto-fill

- **WHEN** an agent creates a new listing via `/listings/new`
- **THEN** the system SHALL redirect to `/listings/{id}/fill` with the chapter navigation starting at the `照片/文件` tab
- **WHEN** the agent uploads one or more documents (transcript / title-deed / contract / photos)
- **THEN** the system SHALL asynchronously trigger OCR extraction and write results to `extracted_data`
- **WHEN** the agent proceeds to subsequent chapters
- **THEN** fields populated from `extracted_data.merged_fields` SHALL render with green provenance badges
- **AND** record status SHALL remain `draft` until agent explicitly submits the field-visit section

#### Scenario: Skip upload for manual entry

- **WHEN** an agent without any source documents clicks `跳過，全部手動輸入` on the upload chapter
- **THEN** the system SHALL navigate to the `基本資料` chapter with all fields empty
- **AND** record status SHALL remain `draft`
- **AND** the agent SHALL complete the listing via manual entry only (no OCR involvement)
