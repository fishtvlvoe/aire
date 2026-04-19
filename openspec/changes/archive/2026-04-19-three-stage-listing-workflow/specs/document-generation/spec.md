## ADDED Requirements

### Requirement: Trigger document generation

The system SHALL generate all five documents in a single API call when the secretary clicks "Generate Documents" and the record status is "ready-for-generation". The system SHALL call Claude API with all field-visit and supplementary data as structured input.

#### Scenario: Successful document generation

- **WHEN** a secretary clicks "Generate Documents" on a record with status "ready-for-generation"
- **THEN** the system SHALL call Claude API once with the complete listing data
- **AND** the system SHALL generate all five document contents in the response
- **AND** the system SHALL update record status to "documents-ready"
- **AND** the system SHALL display a success message with links to each document

#### Scenario: Document generation fails due to API error

- **WHEN** the Claude API call fails or times out
- **THEN** the system SHALL display an error message with the failure reason
- **AND** the system SHALL keep record status as "ready-for-generation"
- **AND** the system SHALL allow the secretary to retry

### Requirement: Real estate disclosure document (PDF)

The system SHALL generate a real estate disclosure document in PDF format using the company's standard template. The PDF SHALL include property basic information, land registration summary, mortgage/lien status, land use zoning, and agent contact details.

#### Scenario: PDF is generated and available for download

- **WHEN** document generation completes successfully
- **THEN** the system SHALL make the real estate disclosure PDF available for download via a download button
- **AND** the PDF SHALL render correctly when printed on A4 paper

#### Scenario: PDF includes all required fields

- **WHEN** the PDF is generated
- **THEN** the PDF SHALL include: property address, land area or floor area, asking price, land registration transcript summary, mortgage/lien status, land use zoning, and agent name and contact

### Requirement: Property condition survey form (PDF)

The system SHALL generate a property condition survey form in PDF format using the company's standard template. This document is intended to be printed and given to prospective buyers during property viewings.

#### Scenario: Survey form is generated and available for download

- **WHEN** document generation completes successfully
- **THEN** the system SHALL make the property condition survey PDF available for download
- **AND** the PDF SHALL be formatted for A4 single-page printing

### Requirement: 591 listing text (plain text)

The system SHALL generate a 591 platform listing description as plain text. The content SHALL follow 591 platform conventions and be ready to copy and paste directly.

#### Scenario: 591 text is displayed for copying

- **WHEN** document generation completes successfully
- **THEN** the system SHALL display the 591 listing text in a read-only text area
- **AND** the system SHALL provide a "Copy" button that copies the full text to clipboard

#### Scenario: 591 text does not contain markdown formatting

- **WHEN** the 591 text is generated
- **THEN** the text SHALL NOT contain markdown symbols (**, ##, -, *) that would appear as literal characters on the 591 platform

### Requirement: Sales DM copy (PDF)

The system SHALL generate sales DM copy as a PDF document. The PDF SHALL include property highlights, key selling points, and agent contact information, formatted for both print distribution and digital delivery.

#### Scenario: Sales DM PDF is generated and available for download

- **WHEN** document generation completes successfully
- **THEN** the system SHALL make the sales DM PDF available for download
- **AND** the PDF SHALL be formatted for A4 printing or digital sharing

### Requirement: Social media referral posts (plain text)

The system SHALL generate referral post copy for five platforms: Facebook, Instagram, Threads, TikTok, and YouTube. Each platform's post SHALL respect that platform's character limits and formatting conventions. The posts SHALL be displayed as plain text with individual copy buttons.

#### Scenario: Each platform post is displayed separately

- **WHEN** document generation completes successfully
- **THEN** the system SHALL display five separate plain-text areas, one per platform, each with its own "Copy" button

#### Scenario: Platform character limits are respected

- **WHEN** the social media posts are generated
- **THEN** the Facebook post SHALL NOT exceed 63,206 characters
- **AND** the Threads post SHALL NOT exceed 500 characters
- **AND** the TikTok post SHALL NOT exceed 2,200 characters
- **AND** the Instagram caption SHALL NOT exceed 2,200 characters
- **AND** the YouTube description SHALL NOT exceed 5,000 characters

#### Scenario: Posts do not contain markdown formatting

- **WHEN** any social media post is generated
- **THEN** the text SHALL NOT contain markdown symbols that would appear as literal characters on social platforms
