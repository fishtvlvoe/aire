## ADDED Requirements

### Requirement: Expanded ALLOWED_TYPES for OCR document uploads

The attachments API SHALL accept the following additional `type` values for OCR-relevant document categories:

| New Type | Description |
|----------|-------------|
| `transcript` | 謄本（地籍/建物登記） |
| `title-deed` | 權狀 |
| `contract` | 合約 |
| `cadastral-map` | 地籍圖 |

#### Scenario: Transcript upload accepted

- **WHEN** client POSTs to `/api/listings/{id}/attachments` with `type: 'transcript'`
- **THEN** server SHALL return 200 and store the attachment
- **THEN** server SHALL trigger the extract pipeline for that attachment

#### Scenario: Unknown type still rejected

- **WHEN** client POSTs with `type: 'unknown_type'`
- **THEN** server SHALL return 400
