## ADDED Requirements

### Requirement: license-init-handles-vendor-credentials

The license init API handler SHALL check the License Server response for a `vendorCredentials` field. When present, it SHALL call `provisionVendorAccount()` to create or update the vendor account before proceeding with the normal license activation flow.

#### Scenario: license init with vendor credentials

- **WHEN** the License Server responds with `{ valid: true, features: [...], vendorCredentials: { username, passwordHash, displayName } }`
- **THEN** the license init API calls `provisionVendorAccount()` with the vendor credentials, then continues to write the license cache and return success to the client

#### Scenario: license init without vendor credentials

- **WHEN** the License Server responds with `{ valid: true, features: [...] }` without `vendorCredentials`
- **THEN** the license init API proceeds normally without creating any vendor account
