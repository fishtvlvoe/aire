# registry-autofill-review-ux Specification

## Purpose

Defines the UI/UX contract for reviewing registry autofill results, field gaps, source evidence, and MOI usage costs before producing disclosure documents.

## ADDED Requirements

### Requirement: Registry autofill review UX SHALL provide a review workspace for field status, source, gap, and cost

The system SHALL provide a registry autofill review workspace for disclosure editors.

The workspace SHALL prioritize dense operational work over marketing-style presentation. It SHALL include a field navigation area, editable disclosure form area, source/gap detail area, cost summary, and supplement checklist.

Each matrix-backed field SHALL expose its value, status label, source service code when available, last lookup time when available, fee impact when available, and next action.

#### Scenario: Desktop review workspace shows all core regions

- **GIVEN** a townhouse case has registry lookup results and manual-required fields
- **WHEN** the user opens the review workspace at 1440px width
- **THEN** the field navigation area SHALL be visible
- **AND** the editable disclosure form area SHALL be visible
- **AND** the source/gap detail area SHALL be visible
- **AND** the cost summary and supplement checklist SHALL be visible without overlapping text

#### Scenario: Field selection updates source and gap details

- **GIVEN** a land restriction field has status `integration_gap`
- **WHEN** the user selects that field in the review workspace
- **THEN** the source/gap detail area SHALL show the missing service code
- **AND** the next action SHALL indicate that API integration is required before autofill can complete

### Requirement: Registry autofill review UX SHALL define accessible interaction states

The UI SHALL provide visible states for loading, success, empty, error, partial result, manual required, mapping gap, integration gap, and not supported.

All inputs SHALL have accessible labels, keyboard focus SHALL be visible, primary touch targets SHALL be at least 44 by 44 CSS pixels, and actions SHALL provide feedback after click.

The UI SHALL support desktop 1440px, compact desktop 1024px, and tablet 768px layouts without text overlap.

#### Scenario: API lookup shows loading then domain failure

- **GIVEN** the user starts a MOI lookup for a service that returns `COP309`
- **WHEN** the lookup is in progress
- **THEN** the action control SHALL show a loading state
- **WHEN** the response is classified as `domain_failure`
- **THEN** the UI SHALL show an error state with code `COP309`
- **AND** the fee display SHALL show zero charge unless the cost policy marks the failure billable

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
