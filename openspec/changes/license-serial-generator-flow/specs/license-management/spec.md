## ADDED Requirements

### Requirement: Consultant handoff uses pre-created serials

The system SHALL support on-site delivery workflow where consultant pre-generates serials and hands one serial to the customer during installation.

#### Scenario: On-site activation with handed serial

- **WHEN** consultant provides one pre-created serial and customer enters it in setup flow
- **THEN** setup flow SHALL call `POST /api/license/activate` and continue only on HTTP 200
- **THEN** system SHALL block access when activation response is not successful

##### Example: handoff flow outcome

| Activation API result | Setup result |
| --- | --- |
| `200 {"ok":true}` | continue to next setup step |
| `403 {"reason":"license_inactive"}` | show activation error and stay on setup page |
| `404 {"reason":"license_not_found"}` | show invalid serial error and stay on setup page |

### Requirement: License generation CLI uses create API

The system SHALL provide a CLI command that requests serial creation from `POST /api/license/create` instead of generating unsigned local placeholders.

#### Scenario: Generate 10 serial keys for delivery batch

- **WHEN** operator runs `tsx scripts/generate-license.ts --count 10 --expires 2026-12-31T15:59:59.000Z --output ./output/license-batch.csv`
- **THEN** CLI SHALL call `POST /api/license/create` with admin token
- **THEN** CLI SHALL output exactly 10 serial keys to the output file

#### Scenario: Reject missing admin token in CLI

- **WHEN** operator runs generation CLI without `LICENSE_ADMIN_TOKEN`
- **THEN** CLI SHALL exit with code `1` and print `LICENSE_ADMIN_TOKEN is required`
