## ADDED Requirements

### Requirement: A single typed error enum SHALL cover all land registry failure modes
The crate SHALL expose `LandRegistryError` (built with `thiserror`) whose variants cover at minimum: `Network`, `AuthFailed`, `InsufficientBalance`, `FieldSchemaChanged`, `DiskFull`, `GracePeriodExpired`, `MigrationFailed`, `TimeSkew`, and `Internal`. Every public function in `land_registry::*` SHALL surface failures using this enum.

#### Scenario: Network timeout produces typed error
- **WHEN** an HTTP call times out
- **THEN** the caller SHALL receive `LandRegistryError::Network` with the underlying `reqwest::Error` source attached

#### Scenario: Platform 4xx with balance code produces typed error
- **WHEN** the platform responds with a JSON body indicating insufficient balance
- **THEN** the caller SHALL receive `LandRegistryError::InsufficientBalance` containing the platform's error message
- **AND** SHALL NOT be lumped into a generic `Network` or `Internal` variant

### Requirement: Errors SHALL carry actionable context, never bare strings
Every variant SHALL carry the data the UI layer needs to render an actionable message (HTTP status, available bytes, parcel ID, etc.). The crate SHALL NOT emit `String` errors that lose structure.

#### Scenario: `DiskFull` carries available bytes
- **WHEN** the disk guard rejects a write
- **THEN** the produced `LandRegistryError::DiskFull` SHALL include the observed available bytes as a `u64` field
