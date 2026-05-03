## ADDED Requirements

### Requirement: listingId propagation to upload component

FieldVisitForm SHALL receive `listingId` as a prop and pass it to PhotoUploadClassifier. When `listingId` is present, PhotoUploadClassifier SHALL POST the selected file to `/api/listings/{listingId}/attachments` immediately after file selection (fire-and-forget). When `listingId` is undefined, the upload SHALL be silently skipped.

#### Scenario: Upload wires through to server when listingId provided

- **WHEN** user selects a PDF file in FieldVisitForm rendered with a valid `listingId`
- **THEN** PhotoUploadClassifier SHALL POST to `/api/listings/{listingId}/attachments` with `type: 'transcript'`
- **THEN** the existing extract pipeline SHALL be triggered server-side
- **THEN** no error SHALL be shown to the user regardless of upload outcome

#### Scenario: Upload silently skipped when listingId absent

- **WHEN** user selects a file in FieldVisitForm rendered without `listingId`
- **THEN** no HTTP request SHALL be made
- **THEN** UI SHALL continue to function as before

## ADDED Requirements

### Requirement: File category mapping for attachment type

PhotoUploadClassifier SHALL map selected file MIME type to the `type` field sent to the attachments API:

| File MIME / Extension | Sent `type` |
|----------------------|-------------|
| `application/pdf` | `transcript` |
| `image/*` | `market_research` |
| Unknown | `transcript` (fallback) |

#### Scenario: PDF mapped to transcript type

- **WHEN** user selects a `.pdf` file
- **THEN** POST body SHALL include `type: 'transcript'`

#### Scenario: Image mapped to market_research type

- **WHEN** user selects an `image/*` file
- **THEN** POST body SHALL include `type: 'market_research'`
