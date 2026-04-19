## ADDED Requirements

### Requirement: Pre-commission lookup UI accepts owner + address/parcel input

The system SHALL provide a dedicated UI page for agents to initiate a new listing by entering owner contact information and property identifier.

#### Scenario: Agent starts new listing from phone call
- **WHEN** agent navigates to `/pre-commission/new`
- **THEN** form SHALL accept: owner name, owner phone, address (optional), parcel number (optional)
- **AND** at least one of (address, parcel number) SHALL be required
- **AND** submit button SHALL be disabled until validation passes

#### Scenario: Both address and parcel provided
- **WHEN** agent enters both address and parcel number
- **THEN** system SHALL cross-validate via public data API
- **AND** flag mismatch if the parcel doesn't match the address

### Requirement: System auto-populates public data when available

When parcel number or address is provided, the system SHALL attempt to fetch public data and pre-fill basic fields.

#### Scenario: Parcel number triggers public data lookup
- **WHEN** agent enters a valid parcel number (e.g., `下營區十六甲段2195`)
- **THEN** system SHALL attempt to fetch: deed (謄本), cadastral map (地籍圖), zoning (使用分區), recent transactions (實價登錄)
- **AND** display loading indicator per data source
- **AND** auto-fill: 地段/地號/面積/使用分區/公告地價/公告現值

#### Scenario: Public data source unavailable
- **WHEN** a public data source fails (network error, site down, site changed)
- **THEN** system SHALL log the failure with source name
- **AND** keep the corresponding field empty for secretary to fill manually
- **AND** NOT block the workflow

### Requirement: Manual paste mode for unavailable sources

For public data sources not yet automated, the system SHALL provide a manual paste area for secretary to input raw data.

#### Scenario: Secretary pastes deed content manually
- **WHEN** automatic deed lookup fails
- **THEN** UI SHALL show a `<textarea>` labeled "貼上謄本內容"
- **AND** on paste, system SHALL use LLM (Codex) to extract structured fields
- **AND** populate the parsed result into listing fields

### Requirement: Pre-commission state transitions to field-visit

Once pre-commission data is collected (auto + manual), listing SHALL advance to field-visit state for the agent to fill on-site survey.

#### Scenario: Transition to field visit
- **GIVEN** listing in `pre-commission` state with minimum required fields populated
- **WHEN** agent clicks "進入現場勘查"
- **THEN** listing state SHALL transition to `field-visit`
- **AND** agent SHALL be redirected to `/listings/[id]/fill`
