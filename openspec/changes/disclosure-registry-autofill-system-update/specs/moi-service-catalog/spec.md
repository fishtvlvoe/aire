# moi-service-catalog Specification

## Purpose

Defines a local audited catalog of COP/MOI services, pricing policies, access eligibility, documentation references, and implementation priority.

## ADDED Requirements

### Requirement: Catalog SHALL represent scraped COP/MOI service metadata

The system SHALL maintain a MOI service catalog derived from the scraped artifacts under `docs/cop-scrape`.

Each catalog entry SHALL include service code, display name, source document reference, access eligibility, implementation priority, price policy, unit price when known, and pricing evidence.

Allowed implementation priority values SHALL be `required`, `fallback`, `free_enrichment`, `billing_only`, `restricted`, and `defer`.

Allowed price policy values SHALL be `free`, `auth_free`, `price_by_row`, `price_by_location`, `price_by_duration`, `restricted`, and `unknown`.

#### Scenario: Paid row-based service is cataloged

- **GIVEN** a scraped service has a MOI service code and row-based user price
- **WHEN** the catalog is built
- **THEN** the catalog entry SHALL preserve the service code
- **AND** `price_policy` SHALL be `price_by_row`
- **AND** the unit price and source document reference SHALL be present

#### Scenario: Restricted service is cataloged but not callable by normal users

- **GIVEN** a scraped service is marked as government-only or otherwise restricted
- **WHEN** the catalog is built
- **THEN** the catalog entry SHALL use `implementation_priority = restricted`
- **AND** `price_policy = restricted`
- **AND** normal user workflows SHALL NOT schedule that service for automatic lookup

### Requirement: Catalog SHALL drive implementation coverage decisions

The system SHALL use the catalog to classify whether each matrix service dependency is integrated, missing, fallback-only, free enrichment, restricted, or deferred.

Unknown pricing SHALL block production billing for that service until the price policy is resolved.

#### Scenario: Unknown price blocks billable usage

- **GIVEN** a service catalog entry has `price_policy = unknown`
- **WHEN** a workflow attempts to calculate customer-billable usage for that service
- **THEN** the calculator SHALL mark the amount as not billable
- **AND** the ledger record SHALL identify that pricing is unresolved

#### Scenario: Free enrichment service does not increase unpaid amount

- **GIVEN** a service catalog entry has `price_policy = free`
- **WHEN** the service returns a successful payload
- **THEN** the calculated billable amount SHALL be 0
- **AND** the usage ledger SHALL still record the service call for auditability
