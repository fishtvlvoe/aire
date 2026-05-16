# land-disclosure-section-four

## Purpose

Define the field layout and rendering rules for Section Four (四、目前管理與使用情況) of the land disclosure PDF, aligned with the 105-year government-mandated format.

## ADDED Requirements

### Requirement: LandPages SHALL render Section Four with all government-mandated fields

The system SHALL render a PDF page titled "四、目前管理與使用情況" within `LandPages` containing the following fields in order:

1. 出租情形 (`currentRentalStatus?: string`) — current rental/lease status
2. 占用情形 (`currentOccupation?: string`) — occupation or encroachment status
3. 共有物分管情形 (`sharedManagement?: string`) — co-ownership management arrangement
4. 既成道路 (`existingRoad?: string`) — whether existing roads cross the land
5. 其他使用情況 (`otherUsageStatus?: string`) — any other usage conditions

Each field SHALL be rendered using `PdfFieldTable`. When the corresponding `CaseDossierData` field is `undefined`, `null`, or empty string, the value cell SHALL display "待補" in muted text color.

#### Scenario: Section Four renders with rental data

- **WHEN** `PdfDocument` renders with `propertyType: 'land'` and `currentRentalStatus: '已出租，月租 NT$15,000'`
- **THEN** the Section Four page SHALL display "已出租，月租 NT$15,000" for 出租情形

#### Scenario: Section Four renders with all fields undefined

- **WHEN** `PdfDocument` renders with `propertyType: 'land'` and no Section Four fields populated
- **THEN** the Section Four page SHALL render without errors AND all value cells SHALL display "待補"
