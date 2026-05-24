## ADDED Requirements

### Requirement: Address lookup returns candidate parcel options

The system SHALL preserve every candidate land parcel and building parcel discovered from address lookup, public references, coordinates, or downstream probes. Each candidate option SHALL include candidate_id, parcel_type, section_code, section_name, parcel_number, normalized_parcel_id, source, confidence_label, official_status, and warnings.

#### Scenario: Multiple candidates are returned for one address

- **WHEN** the address lookup pipeline processes an address that maps to one land candidate and four building candidates
- **THEN** the system returns all five candidate options in one response
- **AND** each candidate option is marked official_status `candidate_unconfirmed`

##### Example: Yunong road candidate set

- **GIVEN** address `台南市東區裕農路288巷17號8樓之1`
- **WHEN** public references provide land `DC-1556-00700000` and buildings `DC-1556-00165000`, `DC-1556-00167000`, `DC-1556-00229000`, `DC-1556-00230000`
- **THEN** the candidate list contains exactly those five normalized parcel ids

#### Scenario: Official address service is not authorized

- **WHEN** the official address-to-parcel service returns COP317 for a valid address
- **THEN** the system records official_status `official_lookup_unavailable`
- **AND** the system preserves public or coordinate candidates for pre-survey use
- **AND** the system surfaces the COP code and message in the source diagnostics

### Requirement: Candidate options are comparable before confirmation

The system SHALL allow callers to request comparable candidate summaries for all candidate building and land parcels associated with a case. Candidate summaries SHALL include any retrieved registry fields, empty field list, query cost, query status, and provenance tier.

#### Scenario: Candidate summaries contain available registry values

- **WHEN** candidate parcel probes return building registry values for two candidate buildings
- **THEN** the system exposes both summaries without selecting one automatically
- **AND** the summaries include available area, main building area, legal use, construction date, floor, and age fields when present

##### Example: Two candidates with comparable summary fields

- **GIVEN** candidate `DC-1556-00165000` has registered area `31.25坪`, main building area `23.10坪`, legal use `住家用`, and construction date `083/10/18`
- **AND** candidate `DC-1556-00167000` has registered area `30.90坪`, main building area `22.80坪`, legal use `住家用`, and construction date `083/10/18`
- **WHEN** the candidate summary endpoint returns results
- **THEN** both candidate summaries include those comparable fields
- **AND** neither candidate is auto-confirmed

#### Scenario: Candidate probe fails for one option

- **WHEN** one candidate returns COP312 and another candidate returns usable registry data
- **THEN** the failed candidate remains in the candidate list with query_status `failed`
- **AND** the usable candidate remains available with query_status `candidate_data_available`
