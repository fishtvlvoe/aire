# disclosure-form-residential (delta)

## ADDED Requirements

### Requirement: Residential form SHALL include realtor license verification field

The system SHALL add a `RealtorLicenseField` component to the residential disclosure form. The field SHALL accept a license number text input, trigger verification via the `realtor-license-verification` capability after 500ms debounce, and display the three-state UI inline next to the input.

#### Scenario: License field appears in residential form

- **WHEN** the user opens the residential disclosure form for a case
- **THEN** the form contains a labeled field "經紀人證號" with a text input AND inline space for the verification state indicator

#### Scenario: Entering a license number triggers verification

- **WHEN** the user types a 10-character license number into the field
- **THEN** after 500ms of no further keystrokes, the verification IPC `verify_realtor_license` is invoked exactly once AND the state indicator updates to one of the three states

### Requirement: License verification state SHALL be persisted with the case draft

The system SHALL save the last known verification state alongside the case data in the existing draft autosave mechanism so that reopening the form preserves the displayed state without re-querying.

#### Scenario: Reopening form preserves verification state

- **WHEN** a case has been saved with license "ABC123" verified and the user reopens the form
- **THEN** the field shows "✓ 已驗證" immediately on load without calling the verification IPC AND a refresh-on-focus check still runs (per cache TTL rules)
