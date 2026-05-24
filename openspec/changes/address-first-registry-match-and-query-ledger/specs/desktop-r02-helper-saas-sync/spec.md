## ADDED Requirements

### Requirement: Desktop helper SHALL execute R02 discovery from the user's local environment

When cloud access to EasyMap R02 is unavailable or blocked, AIRE SHALL perform R02 discovery through the Mac/Windows desktop App or helper using the user's local browser/WebView context. The helper SHALL return structured candidate JSON to AIRE without executing paid COP calls.

#### Scenario: Desktop helper returns R02 building data

- **WHEN** the user submits `台南市東區裕農路288巷17號8樓之1` from AIRE desktop
- **AND** the helper opens EasyMap R02 in a local browser/WebView context
- **THEN** the helper SHALL extract available administrative district, land office, section, land number, building number, building area, floor count, floor label, completion date, main use, source URL, parser version, and raw summary
- **AND** the query run SHALL record `adapter = easymap_r02_desktop`
- **AND** the query run SHALL have `totalCostCents = 0`
- **AND** the helper SHALL NOT call any paid COP endpoint during this discovery step

#### Scenario: R02 blocks cloud discovery but desktop helper can continue

- **WHEN** the SaaS resolver receives an EasyMap R02 access-denied or unavailable response
- **THEN** the SaaS UI SHALL show that desktop helper discovery is required
- **AND** the failed cloud attempt SHALL be recorded as a zero-cost query run with error code `r02_cloud_access_denied`
- **AND** the desktop helper SHALL be able to attach a later candidate result to the same case

### Requirement: Desktop helper SHALL sync confirmed registry matches to SaaS

The desktop App SHALL sync R02 candidate results, user confirmation state, cache metadata, and query-run identifiers to the AIRE SaaS case. SaaS SHALL treat synced desktop discovery as candidate data until a user confirms the registry match.

#### Scenario: Confirmed desktop candidate is available in SaaS

- **GIVEN** the desktop helper has resolved a candidate with office, section, land number, and building number
- **WHEN** the user confirms the candidate in desktop or SaaS
- **THEN** SaaS SHALL persist the confirmed registry key, source run id, adapter, confirmation user, confirmation timestamp, and candidate JSON
- **AND** SaaS SHALL enable formal COP query actions for that confirmed run
- **AND** repeated SaaS access to the same registry key SHALL use cache metadata before any paid COP call

#### Scenario: Candidate sync without confirmation stays reference only

- **WHEN** the desktop helper syncs one or more candidates without user confirmation
- **THEN** SaaS SHALL show the candidates as pre-survey reference data
- **AND** SaaS SHALL block formal COP calls and formal disclosure PDF generation until confirmation is completed

##### Example: unconfirmed villa candidate

| Field | Expected |
| ----- | -------- |
| inputAddress | 台南市永康區勝利街 2 巷 92 弄 13 號 |
| adapter | easymap_r02_desktop |
| confirmationStatus | candidate_unconfirmed |
| formalCopEnabled | false |
| formalPdfEnabled | false |
| totalCostCents | 0 |

### Requirement: Desktop helper SHALL preserve diagnostics for support and iteration

Every desktop R02 discovery attempt SHALL preserve user-visible diagnostics in the product UI, including JSON payloads, cost summary, adapter name, parser version, cache status, and redacted error logs.

#### Scenario: DOM extraction fails after an R02 page change

- **WHEN** the desktop helper cannot extract required fields from the R02 page
- **THEN** the run SHALL be saved with status `r02_parse_failed`
- **AND** the run detail SHALL include parser version, missing selectors or field names, source URL, redacted raw summary, and next action `manual_registry_key_required`
- **AND** the Settings query-record UI SHALL display the failed run without requiring local file access or AI inspection

### Requirement: Mac and Windows desktop deliverables SHALL be verified before handoff

The R02 helper release SHALL include explicit macOS and Windows verification evidence before customer testing handoff is allowed.

#### Scenario: Desktop helper build and smoke tests pass

- **WHEN** the release verification runs
- **THEN** macOS SHALL pass Tauri dev or build smoke verification for the R02 helper path
- **AND** Windows SHALL pass a native runner, VM, or CI installer smoke verification for the R02 helper path
- **AND** the verification artifacts SHALL include at least one fixture run, one failed/blocked R02 diagnostic run, and one SaaS sync confirmation run
