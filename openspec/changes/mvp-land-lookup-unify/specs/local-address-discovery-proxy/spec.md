## ADDED Requirements

### Requirement: Web and Desktop SHALL share a unified discovery contract

Local Web (via the same-origin discovery proxy) and the Desktop App (via the `land_registry_address_lookup` IPC command) SHALL return the same DiscoveryResult shape, defined as the single source of truth by registry-discovery-contract. The result SHALL contain status, source, candidates (ParcelInfo array), errors, normalized address, and totalCostCents. The two runtimes SHALL NOT diverge into separate query implementations.

#### Scenario: Same address yields identical result across Web and Desktop

- **WHEN** the same property address is queried through the local Web proxy and through the Desktop IPC command
- **THEN** both SHALL return DiscoveryResult values with identical candidates matching on parcel_id, lot_number, and building_number
- **AND** both SHALL report the same status and source

#### Scenario: No coverage yields manual_required not an error

- **WHEN** address discovery finds no matching parcel
- **THEN** the result SHALL set status to manual_required with an empty candidates list
- **AND** the system SHALL NOT throw an error or silently drop the request
