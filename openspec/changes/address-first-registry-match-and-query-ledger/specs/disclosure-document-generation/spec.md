## ADDED Requirements

### Requirement: Formal disclosure SHALL require confirmed registry match

The system SHALL generate formal disclosure documents only when the case has confirmed address, office, section, land number, and required building number for building cases. The internal endpoint `POST /api/cases/{caseId}/disclosure/generate` SHALL return HTTP 200 when the registry match is confirmed and HTTP 409 with `registry_match_required` when confirmation is missing.

#### Scenario: Building case without building number is blocked

- **WHEN** a building case has address, section, and land number but no confirmed building number
- **THEN** `POST /api/cases/{caseId}/disclosure/generate` SHALL return HTTP 409
- **AND** the response SHALL include error code `registry_match_required`

#### Scenario: Confirmed building case generates formal disclosure

- **WHEN** a building case has confirmed address, office, section, land number, building number, and COP formal JSON
- **THEN** `POST /api/cases/{caseId}/disclosure/generate` SHALL return HTTP 200
- **AND** the generated disclosure SHALL use COP formal JSON for registry-backed fields

#### Scenario: Confirmed land-only case generates land disclosure

- **WHEN** a land-only case has confirmed office, section, land number, and COP formal JSON
- **THEN** `POST /api/cases/{caseId}/disclosure/generate` SHALL return HTTP 200
- **AND** the generated disclosure SHALL use the land document variant

### Requirement: Candidate data SHALL generate pre-survey reference only

The system SHALL allow candidate registry data to produce pre-survey reference output, but SHALL label it as reference and SHALL NOT allow it to be exported as a formal disclosure document.

#### Scenario: Candidate data creates reference output

- **WHEN** a case has candidate land or building data and no confirmed registry match
- **THEN** the system SHALL generate a pre-survey reference output
- **AND** every candidate-derived registry field SHALL be labeled `參考資料，尚未對標確認`
- **AND** formal disclosure PDF export SHALL remain disabled

### Requirement: Disclosure generation SHALL use stored query JSON

The system SHALL assemble disclosure data from stored query run JSON after confirmation. It SHALL NOT call COP during document generation unless the user has already confirmed explicit refresh in the registry query flow.

#### Scenario: Generate disclosure from stored JSON

- **WHEN** a confirmed case has stored COP JSON in a registry query run
- **THEN** disclosure generation SHALL read stored JSON
- **AND** disclosure generation SHALL NOT create any paid COP API call

##### Example: Yunong stored JSON generation

- **GIVEN** case `case-yunong-001` is linked to run `run-yunong-001` with building number `00204000` and COP building area `83.61`
- **WHEN** disclosure generation runs
- **THEN** the disclosure SHALL show building number `00204000` and building area `83.61`
- **AND** billing log paid call count SHALL remain unchanged

#### Scenario: Missing stored JSON is blocked

- **WHEN** a confirmed case has no stored COP JSON
- **THEN** `POST /api/cases/{caseId}/disclosure/generate` SHALL return HTTP 409
- **AND** the response SHALL include error code `cop_json_required`
