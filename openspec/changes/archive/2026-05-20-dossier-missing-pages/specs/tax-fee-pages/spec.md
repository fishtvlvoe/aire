## ADDED Requirements

### Requirement: tax-fee-pages renders complete Pages 7 and 8 with auto-calculated taxes

The system SHALL implement Page 7 (buyer/seller fee table) and Page 8 (LVT notes) as fully functional React components integrated with `src/lib/tax-calculator.ts`.

#### Scenario: Pages 7-8 appear in DisclosureHtmlPreview with calculated values

- **WHEN** `DisclosureHtmlPreview` renders with `taxInputs` prop containing `contractPrice=1000000, officialLandValue=800000, shareRatio=1.0, buildingCurrentValue=200000, usage="residential"`
- **THEN** Page 7 fee table is visible with `data-testid="fee-stamp-tax"` showing 1800 and Page 8 notes appear in sequence after Page 7
