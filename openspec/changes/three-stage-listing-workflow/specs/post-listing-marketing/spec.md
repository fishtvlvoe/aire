## ADDED Requirements

### Requirement: Short-video script generation

The system SHALL generate a short-video script for each listing. The script SHALL be formatted as a spoken narration suitable for a 45-second short-form video (Shorts/Reels/TikTok). The script SHALL highlight the property's key selling points and end with a call-to-action directing viewers to the full property video or Facebook post.

#### Scenario: Script is generated alongside other documents

- **WHEN** document generation completes successfully
- **THEN** the system SHALL include a short-video script in the output
- **AND** the script SHALL be displayed as plain text with a "Copy" button

#### Scenario: Script length is appropriate for short-form video

- **WHEN** the short-video script is generated
- **THEN** the script SHALL be between 100 and 150 Chinese characters (approximately 45 seconds of spoken content at a natural pace)

#### Scenario: Script ends with a call-to-action

- **WHEN** the short-video script is generated
- **THEN** the final sentence SHALL direct viewers to a follow-up action (e.g., visit the YouTube channel, check the Facebook post for details, or contact the agent)

### Requirement: Three-platform referral flow guidance

The system SHALL display a referral flow reminder alongside the marketing outputs, explaining the intended cross-platform flow: short video (Shorts/Reels/TikTok) → full property video (YouTube) → detailed listing post (Facebook). This guidance is static text displayed in the UI, not generated content.

#### Scenario: Referral flow guidance is shown after document generation

- **WHEN** document generation completes and the marketing outputs tab is displayed
- **THEN** the system SHALL display a static referral flow diagram or text block explaining the three-platform flow

### Requirement: Regenerate individual documents

The system SHALL allow the secretary or agent to regenerate any individual document without regenerating all five. Regeneration SHALL use the same listing data already saved in the record.

#### Scenario: Agent regenerates a single document

- **WHEN** an agent clicks "Regenerate" on a specific document (e.g., 591 listing text)
- **THEN** the system SHALL call Claude API with the saved listing data and regenerate only that document
- **AND** the system SHALL replace the previous version of that document with the new output
- **AND** the system SHALL NOT modify any other documents in the record
