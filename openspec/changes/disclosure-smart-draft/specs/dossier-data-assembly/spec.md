## MODIFIED Requirements

### Requirement: Assemble dossier data from all sources

The system SHALL assemble CaseDossierData by calling all available API sources in parallel and mapping results to the unified data interface. The interface SHALL be extended with the following nested optional objects:
- `cover: CoverData` — full cover page fields (物件名稱, 編號, 承辦人, 經紀人, 公司資訊)
- `propertySheet: PropertySheetData` — property data sheet fields per type
- `buildingAreaBreakdown: { main, auxiliary, common, parking }` — area in 坪
- `transactionHistory: TransactionRecord[]` — from real price API
- `nearbyAmenities: AmenityRecord[]` — from Google Maps Places API
- `taxCalculation: TaxResult | null` — from tax calculator (requires totalPrice input)
- `surveyData: LandSurveyData | BuildingSurveyData | null` — from saved draft
- `streetViewImage: Uint8Array | null` — from Google Street View API
- `locationMapImage: Uint8Array | null` — from Google Maps Static API

#### Scenario: Full assembly with all APIs available

- **WHEN** all APIs respond successfully and totalPrice is provided
- **THEN** CaseDossierData SHALL contain populated values for all nested objects

#### Scenario: Graceful degradation when APIs fail

- **WHEN** Google Maps APIs fail (key missing or network error)
- **THEN** nearbyAmenities SHALL be empty array, streetViewImage and locationMapImage SHALL be null, and the PDF SHALL still generate without those sections (no crash)

#### Scenario: Draft mode without total price

- **WHEN** totalPrice is not yet provided by the user
- **THEN** taxCalculation SHALL be null and tax-related pages SHALL render with blank values
