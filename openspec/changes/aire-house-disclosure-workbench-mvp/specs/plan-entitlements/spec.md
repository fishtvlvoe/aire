## ADDED Requirements

### Requirement: Advanced automation controls use SaaS entitlement
Automation controls SHALL use SaaS entitlement data to decide whether a feature is visible, enabled, or upgrade-gated.

#### Scenario: Basic plan user
- **WHEN** a Basic user opens the disclosure workbench
- **THEN** manual uploads and manual supplement fields SHALL remain available
- **THEN** automatic real-price, nearby-market, cadastral-map, aerial-photo, street-view, and floor-plan-processing API controls SHALL be disabled or upgrade-gated

##### Example: Basic can upload but cannot auto-generate
- **GIVEN** the entitlement plan is `basic`
- **WHEN** the user opens the image/map section
- **THEN** `選擇圖片` remains enabled
- **THEN** `自動產生空拍圖` is upgrade-gated

#### Scenario: plan upgrade
- **WHEN** a user's entitlement payload changes from Basic to Pro or Advanced
- **THEN** the corresponding automation controls SHALL become available without manual back-office toggling by AIRE staff

##### Example: Pro unlocks nearby market
- **GIVEN** the user was on `basic`
- **WHEN** the entitlement payload changes to `pro`
- **THEN** nearby-market and real-price controls become available
