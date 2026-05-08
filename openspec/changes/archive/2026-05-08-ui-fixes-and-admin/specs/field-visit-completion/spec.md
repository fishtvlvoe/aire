## MODIFIED Requirements

### Requirement: Field visit form counts usage field correctly

The field visit form completion counter SHALL count the usage field as filled when the user has selected a radio option, regardless of which internal form keys store the value. The custom usage renderer MUST synchronize the selected value back to form['usage'] so the completion counter can detect it.

#### Scenario: Usage radio selected updates completion count
- **WHEN** a user selects a usage radio option (e.g., "住宅")
- **THEN** the completion counter SHALL increment filledAll by 1 for the usage field

##### Example: Building type basic info completion
- **GIVEN** a building-type listing with 7 basic info fields, user has filled all 7 including selecting a usage radio option
- **WHEN** the completion counter calculates filledAll for basic info chapter
- **THEN** the display SHALL show "7/7"

#### Scenario: Usage radio not selected
- **WHEN** no usage radio option has been selected
- **THEN** the completion counter SHALL count usage as unfilled (e.g., display "6/7" if other 6 fields are filled)
