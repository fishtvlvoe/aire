## ADDED Requirements

### Requirement: NLSC CAD fallback SHALL be observable and permission-safe

The system SHALL support a minimal NLSC CAD fallback probe for address-to-land/building discovery using CAD_009 AddressQueryLand and CAD_011 CadasLandInfo. The fallback SHALL be observable, source-tagged, and permission-safe.

#### Scenario: CAD_009 permission denied is blocked, not empty

- **GIVEN** the NLSC CAD_009 endpoint returns HTTP 404 with body `PERMISSION DENIED`
- **WHEN** address lookup attempts NLSC CAD fallback
- **THEN** the system reports a blocked state `nlsc_permission_denied`
- **AND** the system does not report the address as successfully resolved
- **AND** the system does not write NLSC data into formal PDF trusted data

#### Scenario: CAD_009 returns land candidates

- **GIVEN** CAD_009 returns XML with one or more `<addressItem>` entries
- **WHEN** the system parses the response
- **THEN** each candidate contains office, section, land number, source address content, and location when available
- **AND** each candidate is tagged `source = "nlsc_cad"`
- **AND** each candidate is tagged `trustedForPdf = false`

#### Scenario: CAD_011 returns building candidates

- **GIVEN** CAD_011 returns JSON with `buildList` and `ownerType`
- **WHEN** the system parses the response
- **THEN** the result includes building number candidates and owner type summary
- **AND** the result is tagged `source = "nlsc_cad"`
- **AND** the result is tagged `trustedForPdf = false`

#### Scenario: COP remains primary

- **GIVEN** COP address lookup returns one or more official parcel results
- **WHEN** the user looks up an address
- **THEN** the system returns COP results first
- **AND** the system does not call NLSC CAD fallback for that request

#### Scenario: No official source is available

- **GIVEN** COP address lookup is unavailable or unauthorized
- **AND** NLSC CAD fallback is permission denied
- **WHEN** the user looks up an address
- **THEN** the system prompts for supplement or manual confirmation
- **AND** the system does not use public candidates as formal registry data
