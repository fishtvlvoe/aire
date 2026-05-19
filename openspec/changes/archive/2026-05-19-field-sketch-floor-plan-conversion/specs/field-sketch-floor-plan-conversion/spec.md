## ADDED Requirements

### Requirement: Field sketch entry is attached to the existing floor plan field
The system SHALL expose field sketch capture from the residential disclosure attachments tab next to the existing `attachment_floor_plan` field, without requiring the field agent to operate a floor planning tool.

#### Scenario: sketch option appears beside floor plan attachment field
- **WHEN** an assistant opens the residential disclosure form attachments tab
- **THEN** the system displays a floor plan sketch panel next to the `附建物平面圖` field with upload, convert, review, and approval controls

#### Scenario: no professional tool required
- **WHEN** a field agent returns with a pencil sketch photo
- **THEN** the assistant can upload that image directly without opening Magicplan, Homestyler, or another drawing application

### Requirement: Original field sketch evidence is preserved
The system SHALL preserve the original uploaded field sketch image as immutable evidence and SHALL link every converted floor plan output back to that original sketch.

#### Scenario: original sketch is uploaded
- **WHEN** an assistant uploads a hand-drawn sketch photo for a case
- **THEN** the system stores the original image, records uploader, upload timestamp in Asia/Taipei, file hash, source type `field_sketch`, and case identifier

#### Scenario: converted output keeps evidence link
- **WHEN** the system creates a cleaned floor plan from a field sketch
- **THEN** the converted output record references the original sketch record and displays both images in the review screen

#### Scenario: original sketch cannot be overwritten
- **WHEN** a user uploads a revised sketch for the same case
- **THEN** the system creates a new original sketch version and retains the previous original sketch version

### Requirement: AI extraction creates a structured draft only
The system SHALL use AI vision extraction only to create a structured draft from the sketch and SHALL NOT use an AI-generated image as the approved final floor plan.

#### Scenario: sketch is sent for AI extraction
- **WHEN** an assistant requests conversion for a field sketch
- **THEN** the system extracts rooms, labels, rough dimensions, door/window marks, balcony, kitchen, bathrooms, adjacency, and uncertain items into structured JSON

#### Scenario: extraction confidence is low
- **WHEN** the AI extraction contains unreadable labels, missing room count, or contradictory adjacency
- **THEN** the system marks the draft as needing manual correction and blocks approval until the uncertain items are resolved

#### Scenario: AI generated picture is not final
- **WHEN** an AI service returns an illustrative generated image
- **THEN** the system treats that image as a preview only and prevents it from becoming the approved PDF floor plan asset

### Requirement: Clean floor plan is rendered deterministically
The system SHALL render the final clean floor plan from reviewed structured data using a deterministic renderer so the final image is traceable to confirmed fields.

#### Scenario: reviewed structured draft is rendered
- **WHEN** the assistant confirms room list, adjacency, openings, and labels
- **THEN** the system renders a clean black-and-white floor plan image from the structured data and records renderer version

#### Scenario: dimensions are absent
- **WHEN** the confirmed structured data has no verified dimensions
- **THEN** the system renders the floor plan without numeric scale claims and labels it as not-to-scale

#### Scenario: dimensions are verified
- **WHEN** the confirmed structured data includes dimensions copied from the sketch or manually entered by the assistant
- **THEN** the system displays those dimensions as provided values and records their source as field sketch or manual confirmation

### Requirement: Human confirmation gates legal output
The system SHALL require human confirmation before any converted sketch floor plan can be used in a disclosure PDF.

#### Scenario: checklist is incomplete
- **WHEN** room count, kitchen location, bathroom location, balcony location, entrance, or uncertainty confirmation is incomplete
- **THEN** the system blocks approval and lists the missing confirmation items

#### Scenario: assistant approves converted floor plan
- **WHEN** an authorized assistant confirms the checklist and approves the converted floor plan
- **THEN** the system records approver, approval timestamp in Asia/Taipei, source sketch version, final renderer output version, and approval statement

#### Scenario: approval is revoked
- **WHEN** a user rejects or revokes an approved converted floor plan
- **THEN** the system removes that floor plan from future PDF output while preserving the original sketch and conversion record

### Requirement: Disclosure PDF includes source and limitation statement
The system SHALL include source and limitation text when a converted field sketch floor plan appears in the disclosure PDF.

#### Scenario: approved converted sketch is included
- **WHEN** a case has an approved converted field sketch floor plan and the assistant generates the disclosure PDF
- **THEN** the PDF includes the clean floor plan image with source label `現場手稿整理圖` and a limitation statement

#### Scenario: limitation statement appears
- **WHEN** the PDF includes a converted field sketch floor plan
- **THEN** the PDF states that the drawing is organized from field sketch information for layout reference and that legal area, rights scope, and official records follow land registry and title documents

#### Scenario: no approved converted sketch exists
- **WHEN** a case has uploaded sketches but no approved converted floor plan
- **THEN** the PDF excludes the converted floor plan page and generation still succeeds

### Requirement: Conversion audit trail is available for dispute review
The system SHALL retain a conversion audit trail containing original sketch, extracted draft, manual edits, approval checklist, final rendered image, model metadata when AI is used, and PDF inclusion history.

#### Scenario: audit trail opened
- **WHEN** a manager opens the floor plan conversion history for a case
- **THEN** the system shows original sketch versions, extracted JSON versions, manual edits, approvals, and final output versions in chronological order

#### Scenario: AI model metadata recorded
- **WHEN** AI extraction is used for a sketch
- **THEN** the system records provider, model identifier, request timestamp, prompt template version, and response fingerprint without exposing private API keys

#### Scenario: PDF output history recorded
- **WHEN** a PDF is generated with a converted field sketch floor plan
- **THEN** the system records which approved floor plan version was included in that PDF generation event
