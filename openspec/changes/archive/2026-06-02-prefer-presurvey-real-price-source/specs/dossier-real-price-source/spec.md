## ADDED Requirements

### Requirement: PDF real price data SHALL come from saved pre-survey records

PDF dossier assembly SHALL use real-price records that were already saved in the case provenance during the free pre-survey flow.

#### Scenario: Saved real-price records are used for PDF

- **GIVEN** a case has `land_registry_data.entries.real_price_query` with saved transaction records
- **WHEN** the system assembles dossier data for PDF preview or export
- **THEN** the dossier SHALL include transaction history from the saved records
- **AND** the system SHALL NOT call a live real-price provider during PDF assembly

#### Scenario: Missing saved real-price records do not trigger live lookup

- **GIVEN** a case has no saved `real_price_query` records
- **WHEN** the system assembles dossier data for PDF preview or export
- **THEN** the dossier SHALL complete with empty transaction history
- **AND** the system SHALL NOT call Twinkle, open data, or any live real-price provider during PDF assembly

### Requirement: Creation-time pre-survey SHALL save obtained real-price records

When the free pre-survey creation flow obtains real-price records, those records SHALL be persisted into case provenance before PDF assembly can use them.

#### Scenario: Creation flow saves free real-price records

- **GIVEN** the user enters an address and the free pre-survey flow obtains real-price records
- **WHEN** the user creates the case
- **THEN** the system SHALL save those records under `land_registry_data.entries.real_price_query`
- **AND** the saved records SHALL be available to PDF assembly without another live query
