# template-rendering Specification

## Purpose

TBD - created by archiving change 'html-template-system'. Update Purpose after archive.

## Requirements

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

<!-- @trace
source: html-template-system
updated: 2026-05-08
code:
  - src/app/listings/[id]/documents/page.tsx
  - src/lib/license/server-verify.ts
  - src/app/api/documents/export-pdf/route.ts
  - src/app/admin/users/page.tsx
  - src/components/forms/FieldVisitForm.tsx
  - src/components/AdminBreadcrumb.tsx
  - src/app/api/documents/preview/route.ts
  - src/app/admin/layout.tsx
  - src/lib/db/index.ts
  - design-system/AIRE/pages/admin.md
  - src/app/admin/templates/page.tsx
  - src/app/listings/page.tsx
  - src/components/Sidebar.tsx
  - src/app/api/admin/doc-flags/route.ts
  - src/lib/branding/color-schemes.ts
  - src/components/LogoUploader.tsx
  - src/app/api/auth/[...nextauth]/route.ts
  - src/lib/auth/vendor.ts
  - package.json
  - src/app/admin/features/page.tsx
  - src/app/api/license/init/route.ts
  - src/app/api/admin/users/route.ts
  - src/components/UpdateChecker.tsx
  - migrations/005_vendor_account.sql
  - src/app/api/admin/templates/[id]/route.ts
  - src/components/ColorSchemeSelector.tsx
  - src/app/api/admin/templates/route.ts
  - src/lib/template-engine.ts
  - src/app/api/me/route.ts
  - design-system/AIRE/MASTER.md
  - src/lib/db/schema.ts
  - src/components/TemplatePreview.tsx
  - src/app/api/admin/templates/logo/route.ts
tests:
  - src/lib/auth/__tests__/vendor.test.ts
-->