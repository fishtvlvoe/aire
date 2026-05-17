## ADDED Requirements

### Requirement: Render life amenities page

The system SHALL render a "周遭設施" (Life Amenities) page in the PDF for both land and building type cases. The page SHALL display a table of nearby positive amenities with columns: category (類別), name (名稱), distance (距離), and address (地址).

#### Scenario: Amenities page with auto-filled data

- **WHEN** CaseDossierData contains nearbyAmenities with entries
- **THEN** the PDF SHALL render a table grouped by category (學校/醫院/公園/捷運/市場) with each amenity as a row

#### Scenario: Amenities page with no data

- **WHEN** nearbyAmenities is empty or null
- **THEN** the PDF SHALL render the page with empty table and note "尚未查詢周邊設施"

#### Scenario: Both land and building versions include amenities

- **WHEN** generating PDF for either land or building type
- **THEN** the life amenities page SHALL be included in both versions
