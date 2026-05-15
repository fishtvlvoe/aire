# realtor-license-verification Specification

## Purpose

Verify the realtor license number entered into the disclosure form against the official Ministry of the Interior registry via OPCOS proxy, display a three-state UI (verified / not found / expired), cache results for 7 days, and warn but never block the user.

## ADDED Requirements

### Requirement: System SHALL verify license number via OPCOS proxy with 500ms debounce

The system SHALL invoke the OPCOS verification endpoint (`GET /v1/realtor-license/{license_number}`) after a 500ms debounce from the last keystroke on the license number input field. The system SHALL NOT invoke the endpoint on every keystroke.

#### Scenario: Rapid typing only triggers one API call after debounce

- **WHEN** the user types a 10-character license number with each keystroke 100ms apart
- **THEN** the OPCOS verification API is invoked exactly once at 1500ms after the first keystroke (500ms after the last keystroke)

#### Scenario: Slow typing still respects debounce window

- **WHEN** the user types a license number with each keystroke 600ms apart
- **THEN** the OPCOS API is invoked after each keystroke (because 600ms > 500ms debounce window)

### Requirement: System SHALL render three-state UI for verification result

The system SHALL display one of three states next to the license number input field after verification: ✓ "已驗證" (verified), ✗ "證號不存在" (not_found), ⚠ "證號已過期" (expired). The states SHALL use OPCOS unified colors (success / error / warning) and lucide-react icons (CheckCircle / XCircle / AlertTriangle).

#### Scenario: Verified license shows success state

- **WHEN** OPCOS returns `{ status: 'verified', expires_at: '2030-01-01' }`
- **THEN** the UI displays the CheckCircle icon in OPCOS success color AND the text "✓ 已驗證" next to the input field

#### Scenario: Non-existent license shows error state

- **WHEN** OPCOS returns `{ status: 'not_found' }`
- **THEN** the UI displays the XCircle icon in OPCOS error color AND the text "✗ 證號不存在"

#### Scenario: Expired license shows warning state

- **WHEN** OPCOS returns `{ status: 'expired', expires_at: '2024-01-01' }`
- **THEN** the UI displays the AlertTriangle icon in OPCOS warning color AND the text "⚠ 證號已過期"

### Requirement: Verification failure SHALL NOT block form submission or PDF generation

The system SHALL treat all verification states (including failures and warnings) as advisory. The user SHALL be able to submit the form and generate the PDF regardless of verification result.

#### Scenario: Submit succeeds with expired license

- **WHEN** the license shows "⚠ 證號已過期" and the user clicks "Generate PDF"
- **THEN** the PDF generation proceeds without error AND the resulting PDF still contains the license number entered by the user

#### Scenario: Submit succeeds when verification is offline

- **WHEN** OPCOS is unreachable and verification returns "⚠ 離線中、無法驗證" and the user submits
- **THEN** form submission succeeds AND PDF generation proceeds

### Requirement: System SHALL cache verification results for 7 days

The system SHALL persist verification results in the SQLite `realtor_licenses` table with columns `license_number`, `status`, `verified_at`, `cache_expires_at`. The `cache_expires_at` SHALL be `verified_at + 7 days`. Subsequent verifications for the same license number within the cache window SHALL return the cached result without calling OPCOS.

#### Scenario: Cache hit within 7-day window skips OPCOS call

- **WHEN** a license was verified at `2026-05-14T10:00:00Z` and the same license is queried again at `2026-05-15T10:00:00Z`
- **THEN** the IPC returns the cached status without invoking the OPCOS endpoint AND `cache_expires_at` remains `2026-05-21T10:00:00Z`

#### Scenario: Cache miss after 7 days triggers new OPCOS call

- **WHEN** a license was verified at `2026-05-01T10:00:00Z` and the same license is queried at `2026-05-09T10:00:00Z` (8 days later)
- **THEN** the IPC invokes OPCOS fresh AND updates `verified_at` and `cache_expires_at` in the row

### Requirement: Offline verification SHALL show last-known result with date

The system SHALL detect OPCOS unreachability and SHALL fall back to the cached value if present. The UI SHALL annotate the result with "（最後驗證日期 YYYY-MM-DD，目前離線中）".

#### Scenario: Offline with cache shows last-known result

- **WHEN** the license has a cached result from `2026-05-01` (verified) and OPCOS is unreachable today (`2026-05-14`)
- **THEN** the UI displays "✓ 已驗證（最後驗證日期 2026-05-01，目前離線中）"

#### Scenario: Offline without cache shows offline-only state

- **WHEN** OPCOS is unreachable AND no cache exists for the license
- **THEN** the UI displays "⚠ 離線中、無法驗證" with the AlertTriangle icon

### Requirement: Verification request SHALL timeout after 3 seconds

The system SHALL abort the OPCOS request after 3 seconds and SHALL display the offline state ("⚠ 驗證逾時") without blocking the user.

#### Scenario: Slow OPCOS response triggers timeout

- **WHEN** OPCOS takes longer than 3000ms to respond
- **THEN** the request is aborted AND the UI displays "⚠ 驗證逾時" AND no cache row is written for this attempt

### Requirement: System SHALL expose `verify_realtor_license` IPC command

The system SHALL provide the Tauri IPC `verify_realtor_license(license_number: String) -> Result<LicenseVerificationResult, RealtorLicenseError>` where `LicenseVerificationResult` is `{ status, verified_at, source: 'cache' | 'fresh' | 'offline' }`.

#### Scenario: Fresh verification returns source 'fresh'

- **WHEN** the IPC is called and OPCOS is reachable AND no cache exists
- **THEN** the returned `LicenseVerificationResult.source == 'fresh'`

#### Scenario: Cache hit returns source 'cache'

- **WHEN** the IPC is called and a non-expired cache row exists
- **THEN** the returned `LicenseVerificationResult.source == 'cache'`
