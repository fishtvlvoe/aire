## ADDED Requirements

### Requirement: Template engine merges listing data into HTML template

The template engine SHALL compile an HTML template using Handlebars and render it with merged listing data. The data context SHALL be assembled from four sources: field_visit_data JSON, supplementary_data JSON, pre_commission_data JSON, and listing base fields (property_type, status, created_at, updated_at). All source fields SHALL be flattened into a single context object. If multiple sources contain the same key, field_visit_data takes precedence over supplementary_data, which takes precedence over pre_commission_data.

#### Scenario: Basic variable substitution
- **WHEN** a template contains {{address}} and the listing has address "台北市信義區信義路五段7號"
- **THEN** the rendered HTML SHALL contain "台北市信義區信義路五段7號" in place of {{address}}

##### Example: Multi-source merge precedence
- **GIVEN** field_visit_data has { "address": "現勘地址" }, pre_commission_data has { "address": "委託地址", "owner_name": "王大明" }
- **WHEN** template contains {{address}} and {{owner_name}}
- **THEN** rendered output uses "現勘地址" (field_visit_data wins) and "王大明" (only in pre_commission_data)

#### Scenario: Missing variable renders empty string
- **WHEN** a template contains {{nonexistent_field}} and no data source has this key
- **THEN** the rendered HTML SHALL replace it with an empty string (no error thrown)

#### Scenario: Conditional block rendering
- **WHEN** a template contains {{#if restriction_records}}...{{/if}} and restriction_records has a non-empty value
- **THEN** the content inside the if block SHALL be rendered

#### Scenario: Conditional block with falsy value
- **WHEN** a template contains {{#if restriction_records}}...{{/if}} and restriction_records is null or empty string
- **THEN** the content inside the if block SHALL NOT be rendered
