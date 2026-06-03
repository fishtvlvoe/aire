# CF Worker API Gateway

## R1: Gateway Architecture

The Cloudflare Worker at `aire.opcos.me` MUST serve as the sole API gateway between the browser application and all external APIs.

#### R1-S1: Single entry point

WHEN the browser application needs to call any external API
THEN it MUST send the request to `https://aire.opcos.me/api/{service}/{endpoint}`
AND it MUST NOT directly call any external API domain from the browser

#### R1-S2: CORS headers

WHEN the CF Worker receives a request from the browser application
THEN the response MUST include `Access-Control-Allow-Origin: https://app.aire.tw` (or the configured production domain)
AND `Access-Control-Allow-Methods: GET, POST, OPTIONS`
AND `Access-Control-Allow-Headers: Content-Type, Authorization`

## R2: Credential Security

All sensitive API credentials MUST be stored in Cloudflare Worker environment variables and MUST NOT be exposed to the browser.

#### R2-S1: Environment variable isolation

WHEN a request is processed by the CF Worker
THEN the Worker MUST read credentials from `env.LAND_REGISTRY_CLIENT_ID`, `env.LAND_REGISTRY_CLIENT_SECRET`, and `env.OPCOS_API_TOKEN`
AND these values MUST NEVER appear in HTTP response bodies, headers, or error messages

#### R2-S2: Credential rotation

WHEN an administrator updates a credential in the Cloudflare dashboard
THEN the Worker MUST use the new credential within 60 seconds without requiring code deployment

## R3: Land Registry API Proxy

The CF Worker MUST proxy requests to the Ministry of Interior land registry API (`copapi.moi.gov.tw`).

#### R3-S1: Address lookup proxy

WHEN the browser sends `POST /api/land-registry/address-lookup`
WITH body `{ "address": "...", "section": "...", "lot": "..." }`
AND header `Authorization: Bearer {jwt}`
THEN the Worker MUST authenticate the JWT
AND forward the request to the land registry API with `client_id` and `client_secret` from environment variables
AND return the registry data to the browser
AND if the land registry API returns 401, the Worker MUST return HTTP 502 with body `{ "error": "land_registry_auth_failed" }`

#### R3-S2: Token acquisition

WHEN the Worker proxies a request that requires an OAuth token from the land registry
THEN it MUST first call the token endpoint (`cp/getToken`) using the stored credentials
AND cache the token in-memory for up to 3500 seconds (token lifetime is typically 3600s)
AND reuse the cached token for subsequent requests

#### R3-S3: Request logging

WHEN any land registry request is proxied
THEN the Worker MUST log: timestamp, endpoint, success/failure, and response time
AND it MUST NOT log: client_id, client_secret, request body containing personal data

## R4: Legal Clauses API Proxy

The CF Worker MUST proxy requests to the OPCOS legal clauses API.

#### R4-S1: Sync proxy

WHEN the browser sends `POST /api/legal-clauses/sync`
WITH header `Authorization: Bearer {jwt}`
THEN the Worker MUST authenticate the JWT
AND forward the request to `opcos.aiver.me/v1/legal-clauses/sync`
WITH the `OPCOS_API_TOKEN` as Bearer token
AND return the clause list to the browser

#### R4-S2: Cached response

WHEN the legal clauses API is unreachable
AND the Worker has a cached response from within the last 24 hours
THEN it SHALL return the cached response with HTTP 200 and header `X-Cache: stale`

## R5: Realtor License API Proxy

The CF Worker MUST proxy requests to the OPCOS realtor license verification API.

#### R5-S1: License verification

WHEN the browser sends `POST /api/realtor/verify`
WITH body `{ "license_number": "..." }`
AND header `Authorization: Bearer {jwt}`
THEN the Worker MUST authenticate the JWT
AND forward the request to the OPCOS license verification endpoint
AND return the verification result

## R6: License API — Existing Routes

The existing license activation and verification routes MUST continue to function unchanged.

#### R6-S1: Backward compatibility

WHEN an existing local edition (Node local runtime, or PARKED Tauri build) calls `/api/license/activate` or `/api/license/verify`
THEN the CF Worker MUST continue to process these requests exactly as before
AND the browser edition MUST use the same endpoints with the same request/response format

## R7: Rate Limiting and Abuse Prevention

The CF Worker MUST implement rate limiting to prevent abuse.

#### R7-S1: Per-IP rate limit

WHEN requests from a single IP address exceed 100 requests per minute
THEN the Worker MUST return HTTP 429 with `Retry-After: 60`
AND log the rate limit event

#### R7-S2: Per-license rate limit

WHEN requests authenticated with a single license key exceed 1000 requests per day
THEN the Worker MUST return HTTP 429
AND notify the administrator if the pattern persists for 3 consecutive days

## R8: Error Handling

All errors from downstream APIs MUST be sanitized before returning to the browser.

#### R8-S1: Downstream error sanitization

WHEN a downstream API returns an error
THEN the Worker MUST NOT forward the raw error message or stack trace
AND it MUST return a structured error: `{ "error": "<machine_readable_code>", "message": "<user_friendly_message>" }`
AND it MUST log the full error details internally for debugging
