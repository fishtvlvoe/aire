## ADDED Requirements

### Requirement: Supplementary form accessible via independent route

The supplementary form SHALL be accessible at /listings/[id]/supplement as a standalone page, no longer embedded within the listing creation flow.

#### Scenario: Standalone page rendering

- **WHEN** user navigates to /listings/5/supplement
- **THEN** the full supplementary form SHALL render with all fields for listing #5
- **THEN** a "返回列表" navigation link SHALL be present

#### Scenario: Form submission returns to list

- **WHEN** user completes and saves the supplementary form
- **THEN** user SHALL be redirected back to the listings page

##### Example: Redirect after save

- **GIVEN** user is on /listings/5/supplement
- **WHEN** user fills all fields and clicks "儲存"
- **THEN** browser SHALL navigate to /listings
