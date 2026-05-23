## ADDED Requirements

### Requirement: Property data sheet supports pre-owner-talk reference values

The property data sheet SHALL display available pre-owner-talk reference values for land, building, market, map, and amenity data before formal title confirmation. Candidate and inferred values SHALL include source labels; unavailable formal-rights fields SHALL remain blank.

#### Scenario: Talk-before-listing PDF contains usable property facts

- **WHEN** a case has candidate or inferred reference values for land and building fields
- **THEN** the property data sheet displays land section, land number, zoning, land area, ownership ratio, share area, building coverage, floor area ratio, registered area, main area, auxiliary area, common area, parking area, legal use, material, completion date, age, floor, and ownership scope when available
- **AND** every candidate or inferred value includes its source label

##### Example: Yunong reference fields render

- **GIVEN** selected candidate `DC-1556-00165000` has registered area `31.25坪`, main area `23.10坪`, auxiliary area `2.10坪`, common area `6.05坪`, parking area `0.00坪`, legal use `住家用`, material `鋼筋混凝土造`, completion date `083/10/18`, floor `8樓之1`, and ownership scope `全部 1/1`
- **WHEN** the property data sheet renders
- **THEN** those values appear in the PDF text
- **AND** each value is labeled `候選資料，待屋主/權狀確認`

#### Scenario: Unknown formal-right fields stay writable

- **WHEN** acquisition date or formal rights fields have no reliable source
- **THEN** the property data sheet renders those fields as blank values
- **AND** the PDF does not insert explanatory waiting text into those blank rows

##### Example: Acquisition date stays blank

- **GIVEN** no trusted ownership registry, title certificate, or manual supplement contains acquisition date
- **WHEN** the property data sheet renders `取得日期`
- **THEN** the row value is blank
- **AND** the row value does not contain `尚待正式謄本或屋主權狀確認`

### Requirement: Candidate comparison summarizes reference fields

The candidate comparison section SHALL summarize enough fields for a salesperson to discuss the property before owner commitment. Building candidate rows SHALL include area breakdown, legal use, material, construction date, floor, and ownership scope when available.

#### Scenario: Candidate row includes area breakdown

- **WHEN** candidate `DC-1556-00165000` has registered area, main area, auxiliary area, common area, parking area, legal use, material, completion date, floor, and ownership scope
- **THEN** the candidate comparison row includes all of those values
- **AND** no value is hidden merely because the candidate is unconfirmed
