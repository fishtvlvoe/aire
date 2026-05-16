## ADDED Requirements

### Requirement: real-price-section-on-case-detail

The case detail page (`/cases/:id`) SHALL include a dedicated "實價登錄" section below the existing 地政資料 section. The section SHALL mount the `RealPricePanel` component.

#### Scenario: Real price section visible on case detail page

WHEN a user navigates to any case detail page
THEN a section titled "實價登錄參考" SHALL be visible below the 地政資料 section

##### Example:
- URL: http://localhost:3000/cases/TEST-001
- Expected: page contains a section with heading "實價登錄參考" and a "查實價登錄" button
