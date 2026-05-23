## ADDED Requirements

### Requirement: Dossier assembly supports candidate pre-survey data

The system SHALL assemble a pre-survey dossier from candidate parcel data when trusted registry data is unavailable. Candidate data SHALL be included only with provenance tier `candidate_unconfirmed`, source labels, and confirmation warnings.

#### Scenario: Candidate building data fills pre-survey fields

- **WHEN** a case has no trusted building registry data but has candidate building summaries with area and construction fields
- **THEN** dossier assembly fills the property sheet with candidate values
- **AND** the dossier includes a warning that the selected candidate requires owner or title confirmation

##### Example: Selected candidate fills Yunong property sheet

- **GIVEN** selected building candidate `DC-1556-00165000`
- **AND** the candidate summary contains registered area `31.25坪`, main building area `23.10坪`, legal use `住家用`, construction date `083/10/18`, and floor `8樓之1`
- **WHEN** `assembleDossierData()` builds the pre-survey dossier
- **THEN** the property sheet contains those values
- **AND** the value source is labeled `候選資料，待屋主/權狀確認`

#### Scenario: Trusted data overrides candidate data

- **WHEN** a case has trusted registry data and candidate registry data for the same field
- **THEN** dossier assembly uses the trusted registry value
- **AND** the candidate value remains available only in candidate comparison metadata

##### Example: Official registry area overrides candidate area

- **GIVEN** trusted registry registered area is `32.80坪`
- **AND** candidate registered area is `31.25坪`
- **WHEN** `assembleDossierData()` resolves `propertySheet.registeredArea`
- **THEN** the resolved field is `32.80坪`
- **AND** the candidate value remains available in `candidate_options.summary_fields`

### Requirement: Candidate confirmation promotes one option

The system SHALL support one selected candidate per parcel type as `selected_candidate` before formal confirmation and one confirmed parcel per parcel type as `confirmed`. A confirmed parcel SHALL be treated as the case parcel for future formal pull attempts.

#### Scenario: User selects a temporary candidate

- **WHEN** the user marks building candidate `DC-1556-00165000` as temporary selected candidate
- **THEN** dossier assembly uses that candidate for pre-survey output
- **AND** the output remains marked as candidate_unconfirmed

#### Scenario: User confirms a candidate

- **WHEN** the user confirms building candidate `DC-1556-00165000` using owner-provided title information
- **THEN** dossier assembly records the candidate as confirmed
- **AND** future formal registry pull attempts use `DC-1556-00165000`

### Requirement: Dossier assembly supports vertical unit reference estimates

The system SHALL assemble reference estimates from same-building units with the same unit suffix when the target address cannot be mapped to one confirmed building number. Reference estimates SHALL be marked with provenance tier `inferred_reference`, confidence level, source unit list, and warning text `推測資料，非登記資料`.

#### Scenario: Same suffix units produce a reference estimate

- **WHEN** the target address is `17號8樓之1`
- **AND** candidate data contains same-building units `3樓之1`, `5樓之1`, and `7樓之1` with matching registered area and main building area
- **THEN** dossier assembly estimates the target registered area and main building area from those same-suffix units
- **AND** the dossier records confidence level `high`
- **AND** the dossier lists the source units used for the estimate

##### Example: High confidence vertical stack estimate

- **GIVEN** `3樓之1`, `5樓之1`, and `7樓之1` all have registered area `31.25坪` and main building area `23.10坪`
- **WHEN** the target unit is `8樓之1`
- **THEN** the reference estimate for `8樓之1` is registered area `31.25坪` and main building area `23.10坪`
- **AND** the estimate label is `推測資料，非登記資料`

#### Scenario: Conflicting same suffix units lower confidence

- **WHEN** same-suffix unit data contains different registered areas beyond the configured tolerance
- **THEN** dossier assembly records confidence level `low`
- **AND** the PDF SHALL show the candidate values as a range instead of a single estimated value
