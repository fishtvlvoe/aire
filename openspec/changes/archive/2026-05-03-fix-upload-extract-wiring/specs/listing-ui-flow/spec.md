## ADDED Requirements

### Requirement: Photo and document tab uploads wire through to attachments API

The 照片/文件 tab inside the fill-form page SHALL trigger a real upload to `/api/listings/{listingId}/attachments` immediately after the user selects a file. The upload SHALL be fire-and-forget and SHALL NOT block UI navigation across the three-tab layout.

#### Scenario: Selecting a transcript PDF in the photo/document tab uploads to server

- **WHEN** user selects a `.pdf` file in the 照片/文件 tab of the fill-form page
- **THEN** the UI SHALL POST the file to `/api/listings/{listingId}/attachments` with `type: 'transcript'`
- **THEN** the user SHALL be able to navigate between tabs without waiting for upload completion

#### Scenario: Upload failure does not interrupt fill-form flow

- **WHEN** the attachments API returns 4xx/5xx after a tab upload
- **THEN** the user SHALL NOT see a blocking error dialog
- **THEN** the failure SHALL be logged via `console.error`
