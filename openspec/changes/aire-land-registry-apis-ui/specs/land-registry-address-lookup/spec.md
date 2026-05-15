## ADDED Requirements

### Requirement: Address-to-parcel lookup

The system SHALL accept a property address string and return zero or more ParcelInfo results. Each ParcelInfo SHALL contain parcel_id, address, lot_number, and building_number. The system SHALL normalize the input address (trim whitespace, normalize full-width to half-width) before the API call. When multiple parcels match, the system SHALL return all matches sorted by parcel_id. When no parcels match, the system SHALL return an empty list (not an error).

#### Scenario: Successful lookup returns parcel info

- **WHEN** a configured user calls address lookup with a valid address
- **THEN** the system returns matching ParcelInfo list sorted by parcel_id

##### Example: Single match

- **GIVEN** API key is configured and sandbox is reachable
- **WHEN** address is "台北市大安區和平東路一段100號"
- **THEN** result contains ParcelInfo with parcel_id "0301-0001", lot_number "0301", building_number "0001"

#### Scenario: No match returns empty list

- **WHEN** a configured user calls address lookup with a non-existent address
- **THEN** the system returns an empty list, not an error

##### Example: Non-existent address

- **GIVEN** API key is configured
- **WHEN** address is "不存在的地址XYZ"
- **THEN** result is an empty list

### Requirement: API key guard

The system SHALL reject address lookup when no API key is configured, raising LandRegistryError::ApiKeyNotConfigured.

#### Scenario: Missing API key blocks lookup

- **WHEN** no API key is stored in OS keychain and user calls address lookup
- **THEN** the system raises ApiKeyNotConfigured error

### Requirement: Cache integration

The lookup result SHALL be cached via land-registry-cache with composite key (normalized_address, query_date). Subsequent lookups for the same address on the same day SHALL return cached results without API call.

#### Scenario: Cache hit avoids duplicate API call

- **WHEN** the same address is looked up twice on the same day
- **THEN** the second call returns cached result and no HTTP request is made

### Requirement: Address normalization

The system SHALL normalize input addresses: trim leading/trailing whitespace, convert full-width digits and letters to half-width, and collapse multiple spaces into one.

#### Scenario: Full-width input normalized

- **WHEN** address contains full-width characters like "１００號"
- **THEN** the system normalizes to "100號" before API call
