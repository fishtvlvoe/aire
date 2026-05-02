## ADDED Requirements

### Requirement: License serial key validation

The system SHALL validate a license serial key using Ed25519 asymmetric signature verification via Next.js Middleware on every HTTP request.

**Scenario: Valid license present**
- Given: A license serial key has been activated in the `licenses` SQLite table and current date is before `expires_at` (Asia/Taipei timezone)
- When: Any HTTP request hits Next.js Middleware
- Then: The request proceeds normally

**Scenario: No license activated**
- Given: The `licenses` table is empty
- When: Any HTTP request hits a non-setup path
- Then: Middleware SHALL redirect to `/setup/license` with HTTP 301

**Scenario: Expired license**
- Given: A license key exists but `expires_at` is past current date (Asia/Taipei)
- When: Any HTTP request hits Middleware
- Then: Middleware SHALL redirect to `/setup/license` with HTTP 301

**Scenario: Tampered serial key**
- Given: A serial key string has been modified after issuance
- When: `/api/setup/activate` attempts Ed25519 verification
- Then: API SHALL return HTTP 400 with error code `INVALID_SIGNATURE`

### Requirement: License activation flow

The system SHALL provide `/setup/license` page for entering and activating a serial key. On success, stores serial_key, company_name, expires_at in `licenses` table and redirects to `/login`. If valid license already exists, redirects to homepage.

### Requirement: License payload format

Serial key SHALL be a base64url-encoded Ed25519-signed JSON: `{ company: string, expires: ISO8601 string (Asia/Taipei), version: 1 }`.

### Requirement: Middleware license cache

License DB query result SHALL be cached at module level for 60 seconds TTL to avoid per-request SQLite reads.

### Requirement: License generation CLI

`scripts/generate-license.ts` SHALL accept `--company` and `--expires` CLI arguments and print the signed serial key to stdout.
