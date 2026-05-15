# disclosure-form-land (delta)

## ADDED Requirements

### Requirement: Land form SHALL include realtor license verification field

The system SHALL add the same `RealtorLicenseField` component (as defined for residential) to the land disclosure form. The field SHALL behave identically to the residential version, using the same `realtor-license-verification` capability.

#### Scenario: License field appears in land form

- **WHEN** the user opens the land disclosure form for a case
- **THEN** the form contains a labeled field "經紀人證號" with a text input AND inline space for the verification state indicator

#### Scenario: Land form verification reuses residential implementation

- **WHEN** the same `RealtorLicenseField` component is mounted in both residential and land forms
- **THEN** both forms invoke the same `verify_realtor_license` IPC with identical 500ms debounce behavior AND both forms display the identical three-state UI

### Requirement: Land form license state SHALL persist with case draft

The system SHALL save the verification state alongside the land case draft using the same autosave mechanism described for the residential form, ensuring symmetric behavior between the two form types.

#### Scenario: Reopening land case preserves verification state

- **WHEN** a land case has been saved with a verified license and the user reopens the form
- **THEN** the verification state indicator shows the previously stored state immediately AND the cache freshness check still runs

##### Example: Land draft round-trip

- **GIVEN** a land case `L0001` saved with `licenseNumber: "ABC123"`, `licenseStatus: "verified"`, `licenseVerifiedAt: "2026-05-14T10:00:00Z"`
- **WHEN** the user closes the form and reopens it at `2026-05-15T10:00:00Z` (1 day later, within 7-day cache window)
- **THEN** on the initial render the field shows "✓ 已驗證" within 100ms (before any IPC call returns) AND the IPC `verify_realtor_license("ABC123")` is invoked AND returns `source: "cache"` (because the 7-day cache window is not yet expired)
