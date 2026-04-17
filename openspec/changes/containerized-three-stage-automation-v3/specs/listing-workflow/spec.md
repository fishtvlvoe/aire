## ADDED Requirements

### Requirement: Listing state machine supports pre-commission stage

The listing workflow SHALL add a new initial state `pre-commission` before `draft` to represent the pre-signing data-collection phase.

#### Scenario: New listing starts in pre-commission
- **WHEN** agent creates a new listing via `/pre-commission/new`
- **THEN** listing state SHALL be `pre-commission`
- **AND** only owner contact and property identifier fields SHALL be required

#### Scenario: State progression
- **WHEN** listing advances through the workflow
- **THEN** state SHALL transition in order: `pre-commission` → `field-visit` → `field-visit-complete` → `ready-for-generation` → `documents-ready`
- **AND** each transition SHALL require the prior state's required fields to be filled

### Requirement: Workflow rejects invalid transitions

The state machine SHALL prevent skipping states.

#### Scenario: Cannot skip to documents-ready
- **WHEN** code attempts to transition a listing from `pre-commission` directly to `documents-ready`
- **THEN** transition SHALL be rejected with error `invalid-state-transition`
- **AND** listing state SHALL remain unchanged
