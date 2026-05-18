# land-registry-errors (delta)

## ADDED Requirements

### Requirement: AuthFailed surfaces when COP token acquisition returns non-2xx
The system SHALL surface `LandRegistryError::AuthFailed` when the COP token endpoint (`GET /cp/getToken`) returns a non-2xx HTTP status or when the response body cannot be parsed as `{"access_token": string, "expires_in": number}`. The error SHALL include the raw response body in `response_body` for diagnostics.

Previously this failure mode was silent — a stub `get_token()` returned an empty token, causing downstream COP API calls to silently use Basic auth (succeeding in sandbox, failing with COP311 in production).

#### Scenario: Token endpoint returns 401
- **GIVEN** `LAND_REGISTRY_TOKEN_ENDPOINT` is set to a valid URL
- **WHEN** the token endpoint returns HTTP 401
- **THEN** the caller SHALL receive `LandRegistryError::AuthFailed { message: "token request failed: 401", response_body: "<raw body>" }`
- **AND** no downstream COP business API call SHALL be made

#### Scenario: Token endpoint returns malformed JSON
- **GIVEN** the token endpoint returns HTTP 200 with body `"not json"`
- **WHEN** the response is parsed
- **THEN** the caller SHALL receive `LandRegistryError::AuthFailed { message: "token response parse failed", response_body: "not json" }`

## ADDED Requirements

### Requirement: Empty token_endpoint preserves Basic auth for sandbox compatibility
When `ApiCredentials.token_endpoint` is an empty string, the system SHALL use `Authorization: Basic base64(client_id:secret)` directly for all COP API calls without attempting token acquisition. This preserves backward compatibility for unit tests and sandbox environments that accept Basic auth.

#### Scenario: Empty token_endpoint uses Basic auth
- **GIVEN** `StaticApiKeyProvider::configured(client_id, secret)` is used (token_endpoint empty)
- **WHEN** a COP API call is made
- **THEN** the Authorization header SHALL be `Basic base64(client_id:secret)`
- **AND** no token endpoint call SHALL be made
