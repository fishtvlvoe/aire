## ADDED Requirements

### Requirement: Address-to-parcel results SHALL be consistent across runtimes

The address-to-parcel lookup SHALL return identical ParcelInfo results regardless of whether it is invoked from the local Web runtime or the Desktop App runtime, because both SHALL resolve through the same registry-discovery-contract source of truth.

#### Scenario: Consistent ParcelInfo across Web and Desktop

- **WHEN** a property address is looked up from the Web runtime and from the Desktop runtime
- **THEN** the returned ParcelInfo list SHALL be identical in count and field values
- **AND** each ParcelInfo SHALL contain parcel_id, address, lot_number, and building_number
