# land-registry-address-lookup Specification

## MODIFIED Requirements

### Requirement: Address-to-parcel lookup

The system SHALL accept a property address string and return zero or more ParcelInfo results. Each ParcelInfo SHALL contain parcel_id, address, lot_number, and building_number. When multiple parcels match, the system SHALL return all matches sorted by parcel_id. When no parcels match, the system SHALL return an empty list (not an error).

When calling the MOI/COP address lookup endpoint, the system SHALL send the normalized full address including city/county in the `ADDRESS` request field, and SHALL derive `CITY` from that same full address.

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

#### Scenario: Request payload keeps city in ADDRESS

- **GIVEN** API key is configured
- **WHEN** address lookup is called for "台南市東區裕農路288巷17號8樓之1"
- **THEN** the upstream MOI/COP request payload SHALL include `CITY = "D"`
- **AND** the upstream MOI/COP request payload SHALL include `ADDRESS = "台南市東區裕農路288巷17號8樓之1"`
- **AND** the implementation SHALL NOT strip the city/county prefix from the `ADDRESS` field
