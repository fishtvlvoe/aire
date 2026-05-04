## ADDED Requirements

### Requirement: Three-state completeness calculation for list icon

The supplementary field completeness module SHALL provide a three-state status value for use in the listing list icon display.

#### Scenario: Calculate status for list icon

- **WHEN** system evaluates supplementary completeness for a listing
- **THEN** it SHALL return one of three states: "missing" (has unfilled required fields), "complete" (all required fields filled), or "not-started" (listing in draft status)

##### Example: State determination

| Listing Status | Required Fields Filled | Result |
|---|---|---|
| draft | 0/5 | not-started |
| in-progress | 3/5 | missing |
| in-progress | 5/5 | complete |
| completed | 4/5 | missing |
| completed | 5/5 | complete |
