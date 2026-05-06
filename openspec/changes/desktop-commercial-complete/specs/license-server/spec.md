## ADDED Requirements

### Requirement: License generation CLI
The system SHALL provide scripts/generate-license.ts that accepts --company and --expires arguments. The script SHALL call the License Server API to create a new license record and output the generated serial key to stdout. The script SHALL validate that --expires is a valid ISO 8601 date in the future.

#### Scenario: Generate license successfully
- **WHEN** running tsx scripts/generate-license.ts --company "建安不動產" --expires "2027-12-31"
- **THEN** the script SHALL create a license record via the License Server API
- **THEN** the script SHALL print the generated serial key to stdout and exit with code 0

#### Scenario: Invalid expiry date
- **WHEN** running the script with --expires set to a past date
- **THEN** the script SHALL print an error message and exit with code 1
