# registry-autofill-review-ux Specification

## Purpose

Defines the UI/UX contract for reviewing registry autofill results, field gaps, source evidence, and MOI usage costs before producing disclosure documents.

## ADDED Requirements

### Requirement: Registry autofill review UX SHALL provide a review workspace for field status, source, gap, and cost

The system SHALL provide a registry autofill review workspace for disclosure editors.

The workspace SHALL prioritize dense operational work over marketing-style presentation. It SHALL use a two-column case workspace: a case/chapter navigation area and an editable disclosure field review area.

Each matrix-backed field SHALL expose its value, customer-facing source label, status label, fee impact when available, and supplement action when needed.

The customer-facing workspace SHALL NOT show internal service codes, raw upstream error codes, backend enum names, English plan names, or developer-only source matrix terminology. Internal values such as service code, transaction id, raw MOI code, cost policy, and gap enum SHALL be available only in admin, settings, logs, or audit views.

The workspace SHALL NOT render account-level premium feature settings, static privacy-boundary explanations, or global cost policy panels as persistent side content on every case page.

Account-level upgrade toggles, data-boundary rules, feature entitlement controls, and cost ownership rules SHALL live in settings, admin, or dedicated audit surfaces.

The primary navigation SHALL provide a visible collapse control and a persistent user profile entry. The primary navigation SHALL NOT use a bottom explanatory note or plan-description card for content that belongs in settings.

#### Scenario: Desktop review workspace shows two core regions

- **GIVEN** a townhouse case has registry lookup results and manual-required fields
- **WHEN** the user opens the review workspace at 1440px width
- **THEN** the field navigation area SHALL be visible
- **AND** the editable disclosure form area SHALL be visible
- **AND** the workspace SHALL NOT require a persistent third column for explanations
- **AND** the cost summary and supplement status SHALL be visible without overlapping text
- **AND** the primary navigation SHALL show a collapse control and a user profile entry
- **AND** the primary navigation SHALL NOT show a bottom plan-description note

#### Scenario: Field row uses customer-facing labels

- **GIVEN** a land restriction field has status `integration_gap`
- **WHEN** the user selects that field in the review workspace
- **THEN** the field row SHALL use a customer-facing label such as "待系統補齊" or "需人工提供"
- **AND** the field row SHALL NOT show internal service codes or backend enum names

#### Scenario: Workbench does not show global settings as persistent side content

- **GIVEN** a basic-plan user opens the registry autofill review workspace
- **WHEN** the user selects a disclosure field
- **THEN** the workspace SHALL continue to show only case/chapter navigation and field review
- **AND** the workspace SHALL NOT show global upgrade toggles, static privacy rules, or PDF asset slot configuration
- **AND** those global settings SHALL be available from settings, admin, or dedicated audit pages

#### Scenario: Customer-facing workspace hides MOI service codes

- **GIVEN** a field is backed by an internal MOI service code
- **WHEN** the customer opens the disclosure review workspace
- **THEN** the field source SHALL be rendered as a Traditional Chinese business label such as "建物所有權資料" or "所有權人比對服務"
- **AND** the raw MOI service code SHALL NOT be displayed in the customer workspace
- **AND** the raw service code SHALL remain available in the admin usage audit view

### Requirement: Registry autofill review UX SHALL define accessible interaction states

The UI SHALL provide visible states for loading, success, empty, error, partial result, manual required, mapping gap, integration gap, and not supported.

All inputs SHALL have accessible labels, keyboard focus SHALL be visible, primary touch targets SHALL be at least 44 by 44 CSS pixels, and actions SHALL provide feedback after click.

The UI SHALL support desktop 1440px, compact desktop 1024px, and tablet 768px layouts without text overlap.

#### Scenario: API lookup shows loading then domain failure

- **GIVEN** the user starts a MOI lookup for a service that returns `COP309`
- **WHEN** the lookup is in progress
- **THEN** the action control SHALL show a loading state
- **WHEN** the response is classified as `domain_failure`
- **THEN** the customer-facing UI SHALL show a plain-language query failure state
- **AND** the fee display SHALL show zero charge unless the cost policy marks the failure billable
- **AND** the raw upstream code SHALL be available only in admin logs or usage audit details

#### Scenario: Manual candidate comparison preserves user input

- **GIVEN** a user has manually entered a floor area value
- **AND** registry data returns a different floor area candidate
- **WHEN** the field is selected
- **THEN** the UI SHALL show both the manual value and registry candidate
- **AND** the UI SHALL provide explicit actions to keep the manual value or use the registry value

### Requirement: Registry autofill review UX SHALL provide an auditable MOI usage dashboard

The system SHALL provide a MOI usage audit dashboard for customer/admin review.

The dashboard SHALL include filters for date range, service code, outcome status, and transaction id. It SHALL show total calls, success count, failure count, return rows, unpaid amount, and a row-level table with service code, transaction id, outcome, return rows, billable amount, and error summary.

#### Scenario: Usage dashboard filters domain failures

- **GIVEN** the ledger contains successful calls and `COP309` domain failures
- **WHEN** the user filters outcome status to failure
- **THEN** the table SHALL show the `COP309` records
- **AND** the summary SHALL update failure count and unpaid amount from the filtered records

#### Scenario: Customer can inspect one charged call

- **GIVEN** a row-based service call has `RETURNROWS = 27` and billable amount 27
- **WHEN** the user opens the row detail
- **THEN** the dashboard SHALL show service code, transaction id, return rows, unit price policy, and calculated billable amount
