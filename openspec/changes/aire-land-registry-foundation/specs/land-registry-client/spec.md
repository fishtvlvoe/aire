## ADDED Requirements

### Requirement: HTTP client SHALL obtain JWT bearer tokens via Basic Auth
The land registry HTTP client SHALL fetch a JWT access token from the platform token endpoint using HTTP Basic Auth with the configured Client ID and Secret Code. The HTTP method SHALL match the official C# reference implementation (currently `GET`).

#### Scenario: Successful token retrieval
- **WHEN** the client has no cached token or its cached token is expired
- **THEN** the client SHALL issue a request to `LAND_REGISTRY_TOKEN_ENDPOINT` with header `Authorization: Basic base64(CLIENT_ID:CLIENT_SECRET)`
- **AND** SHALL parse the JSON response body into `{access_token, expires_in, token_type}`
- **AND** SHALL cache the token in memory

#### Scenario: Token endpoint returns non-2xx
- **WHEN** the token endpoint returns 4xx or 5xx
- **THEN** the client SHALL surface a `LandRegistryError::AuthFailed` carrying HTTP status and response body
- **AND** SHALL NOT retry beyond the global retry budget for token requests

### Requirement: Client SHALL detect JWT expiry by parsing the `exp` claim
The client SHALL decide whether to refresh the cached token by base64url-decoding the JWT payload segment and comparing its `exp` claim against the time-synced "now". The client SHALL NOT rely on the wall-clock derived from the original `expires_in` value.

#### Scenario: Cached token is still valid by `exp`
- **WHEN** the cached JWT's `exp` is in the future relative to time-synced now
- **THEN** the client SHALL reuse the cached token without contacting the token endpoint

#### Scenario: Cached token has expired by `exp`
- **WHEN** the cached JWT's `exp` is in the past relative to time-synced now
- **THEN** the client SHALL fetch a fresh token before issuing the business request

### Requirement: Client SHALL send authenticated business calls with TLS 1.2 and JSON
Every business API call SHALL be issued over TLS 1.2 or higher, with `Authorization: Bearer <token>` and `Content-Type: application/json; charset=utf-8`.

#### Scenario: Authenticated POST to business endpoint
- **WHEN** the caller invokes `call_api(method, body)` with a valid endpoint and JSON body
- **THEN** the client SHALL issue a `POST` to `${LAND_REGISTRY_API_BASE_URL}/${method}` with the bearer header and JSON content type
- **AND** SHALL force TLS 1.2 or higher on the underlying HTTPS connection

### Requirement: Client SHALL retry idempotent failures with backoff
The client SHALL retry transient failures (network timeouts, 5xx) up to 3 times with exponential backoff. It SHALL NOT retry 4xx responses other than 401, which SHALL trigger one forced token refresh before retry.

#### Scenario: 5xx triggers retry
- **WHEN** a business call returns HTTP 503
- **THEN** the client SHALL retry up to 3 times with exponentially increasing delay
- **AND** SHALL surface `LandRegistryError::Network` after exhausting retries

#### Scenario: 401 triggers token refresh then single retry
- **WHEN** a business call returns HTTP 401
- **THEN** the client SHALL invalidate the cached token, fetch a new one, and retry the original call exactly once
- **AND** SHALL surface `LandRegistryError::AuthFailed` if the retry also returns 401
