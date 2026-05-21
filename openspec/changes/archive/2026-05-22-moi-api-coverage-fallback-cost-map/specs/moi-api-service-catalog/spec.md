## ADDED Requirements

### Requirement: MOI service catalog is available from scraped COP data

The system SHALL maintain an auditable MOI service catalog derived from `docs/cop-scrape` artifacts. Each catalog entry SHALL include service code, service name, service id when available, official user price description, government price description, eligibility class, pricing model, documentation reference, and source file path.

#### Scenario: Catalog loads all scraped services

- **GIVEN** `docs/cop-scrape/02-服務列表/pricing.json` contains 63 services
- **WHEN** the catalog is generated or loaded
- **THEN** the catalog SHALL include 63 service entries
- **AND** SHALL include MOI API, WFS, and WMS services

#### Scenario: Catalog preserves pricing evidence

- **WHEN** the catalog loads `MOI_API_005地籍建物所有權部資料服務`
- **THEN** the entry SHALL preserve the official user price description `單筆 1 元`
- **AND** SHALL classify the pricing model as `price_by_row`

#### Scenario: Catalog flags restricted services

- **WHEN** the catalog loads a service whose user price description is `僅提供中央機關申請`
- **THEN** the entry SHALL classify eligibility as `restricted`
- **AND** normal AIRE user flows SHALL NOT treat the service as callable by default
