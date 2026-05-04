## ADDED Requirements

### Requirement: Login requires valid license as precondition

The authentication flow SHALL verify license validity before allowing login.

#### Scenario: License invalid at login time

- **WHEN** user attempts to login but the license is invalid or expired
- **THEN** system SHALL display "授權已失效，請聯繫管理員" and block login

#### Scenario: License valid proceeds to auth

- **WHEN** user attempts to login and license verification passes
- **THEN** normal username/password authentication SHALL proceed

##### Example: Valid license login flow

- **GIVEN** license LIC-001 is active and not expired, client IP is within allowed CIDR
- **WHEN** user enters email "agent@realty.com" and password on the login page
- **THEN** system SHALL verify license first (pass) → then authenticate credentials → redirect to /listings
