# license-worker-verify Specification

## Purpose

TBD - created by archiving change 'aire-opcos-me-license'. Update Purpose after archive.

## Requirements

### Requirement: Verify returns active status for valid device

The Worker endpoint `POST /api/license/verify` SHALL, when the KV record exists with `status: "active"` and the requesting `device_id` matches, return HTTP 200 with `{ "status": "active", "valid_until": null, "last_verified_at": "<ISO timestamp>" }`.

#### Scenario: Verify an active license from correct device

- **GIVEN** KV contains `license:TESTKEY` = `{ "status": "active", "device_id": "dev-001" }`
- **WHEN** `POST /api/license/verify` with `{ "license_key": "TESTKEY", "device_id": "dev-001" }`
- **THEN** HTTP 200, body `{ "status": "active", "valid_until": null, "last_verified_at": "<ISO 8601 string>" }`


<!-- @trace
source: aire-opcos-me-license
updated: 2026-05-18
code:
  - cloudflare-worker/.wrangler/state/v3/kv/miniflare-KVNamespaceObject/metadata.sqlite-wal
  - cloudflare-worker/.wrangler/state/v3/kv/miniflare-KVNamespaceObject/metadata.sqlite-shm
  - cloudflare-worker/src/index.ts
  - cloudflare-worker/package.json
  - src-tauri/build.rs
  - cloudflare-worker/.wrangler/state/v3/cache/miniflare-CacheObject/metadata.sqlite-shm
  - cloudflare-worker/wrangler.toml
  - cloudflare-worker/.wrangler/state/v3/kv/miniflare-KVNamespaceObject/eeed5a80fd33f459c3423ee01ec52aa0dc4f301e20606a58b8eb7bde19f2c951.sqlite-shm
  - cloudflare-worker/src/types.ts
  - cloudflare-worker/.wrangler/state/v3/cache/miniflare-CacheObject/metadata.sqlite-wal
  - cloudflare-worker/.wrangler/state/v3/kv/REPLACE_WITH_KV_ID/blobs/3566842bfc172d6aa8cf5aac012536014df539e675fc8ae36cef2c355ed8ea340000019e3b75d7ff
  - cloudflare-worker/.wrangler/state/v3/kv/miniflare-KVNamespaceObject/eeed5a80fd33f459c3423ee01ec52aa0dc4f301e20606a58b8eb7bde19f2c951.sqlite-wal
  - cloudflare-worker/src/handlers/verify.ts
  - cloudflare-worker/src/handlers/activate.ts
  - cloudflare-worker/tsconfig.json
  - cloudflare-worker/DEPLOY.md
-->

---
### Requirement: Device mismatch returns 403

When the KV record exists with `status: "active"` but the requesting `device_id` does NOT match, the endpoint SHALL return HTTP 403 with body `{ "error": "device_mismatch" }`.

#### Scenario: Wrong device verifies

- **GIVEN** KV contains `license:TESTKEY` = `{ "status": "active", "device_id": "dev-001" }`
- **WHEN** `POST /api/license/verify` with `{ "license_key": "TESTKEY", "device_id": "wrong-device" }`
- **THEN** HTTP 403, body `{ "error": "device_mismatch" }`


<!-- @trace
source: aire-opcos-me-license
updated: 2026-05-18
code:
  - cloudflare-worker/.wrangler/state/v3/kv/miniflare-KVNamespaceObject/metadata.sqlite-wal
  - cloudflare-worker/.wrangler/state/v3/kv/miniflare-KVNamespaceObject/metadata.sqlite-shm
  - cloudflare-worker/src/index.ts
  - cloudflare-worker/package.json
  - src-tauri/build.rs
  - cloudflare-worker/.wrangler/state/v3/cache/miniflare-CacheObject/metadata.sqlite-shm
  - cloudflare-worker/wrangler.toml
  - cloudflare-worker/.wrangler/state/v3/kv/miniflare-KVNamespaceObject/eeed5a80fd33f459c3423ee01ec52aa0dc4f301e20606a58b8eb7bde19f2c951.sqlite-shm
  - cloudflare-worker/src/types.ts
  - cloudflare-worker/.wrangler/state/v3/cache/miniflare-CacheObject/metadata.sqlite-wal
  - cloudflare-worker/.wrangler/state/v3/kv/REPLACE_WITH_KV_ID/blobs/3566842bfc172d6aa8cf5aac012536014df539e675fc8ae36cef2c355ed8ea340000019e3b75d7ff
  - cloudflare-worker/.wrangler/state/v3/kv/miniflare-KVNamespaceObject/eeed5a80fd33f459c3423ee01ec52aa0dc4f301e20606a58b8eb7bde19f2c951.sqlite-wal
  - cloudflare-worker/src/handlers/verify.ts
  - cloudflare-worker/src/handlers/activate.ts
  - cloudflare-worker/tsconfig.json
  - cloudflare-worker/DEPLOY.md
-->

---
### Requirement: Non-active license returns 404

When the KV key does not exist or `status` is not `"active"`, the endpoint SHALL return HTTP 404 with body `{ "error": "invalid_license" }`.

#### Scenario: Verify an inactive license

- **GIVEN** KV contains `license:TESTKEY` = `{ "status": "inactive" }`
- **WHEN** `POST /api/license/verify` with `{ "license_key": "TESTKEY", "device_id": "dev-001" }`
- **THEN** HTTP 404, body `{ "error": "invalid_license" }`

<!-- @trace
source: aire-opcos-me-license
updated: 2026-05-18
code:
  - cloudflare-worker/.wrangler/state/v3/kv/miniflare-KVNamespaceObject/metadata.sqlite-wal
  - cloudflare-worker/.wrangler/state/v3/kv/miniflare-KVNamespaceObject/metadata.sqlite-shm
  - cloudflare-worker/src/index.ts
  - cloudflare-worker/package.json
  - src-tauri/build.rs
  - cloudflare-worker/.wrangler/state/v3/cache/miniflare-CacheObject/metadata.sqlite-shm
  - cloudflare-worker/wrangler.toml
  - cloudflare-worker/.wrangler/state/v3/kv/miniflare-KVNamespaceObject/eeed5a80fd33f459c3423ee01ec52aa0dc4f301e20606a58b8eb7bde19f2c951.sqlite-shm
  - cloudflare-worker/src/types.ts
  - cloudflare-worker/.wrangler/state/v3/cache/miniflare-CacheObject/metadata.sqlite-wal
  - cloudflare-worker/.wrangler/state/v3/kv/REPLACE_WITH_KV_ID/blobs/3566842bfc172d6aa8cf5aac012536014df539e675fc8ae36cef2c355ed8ea340000019e3b75d7ff
  - cloudflare-worker/.wrangler/state/v3/kv/miniflare-KVNamespaceObject/eeed5a80fd33f459c3423ee01ec52aa0dc4f301e20606a58b8eb7bde19f2c951.sqlite-wal
  - cloudflare-worker/src/handlers/verify.ts
  - cloudflare-worker/src/handlers/activate.ts
  - cloudflare-worker/tsconfig.json
  - cloudflare-worker/DEPLOY.md
-->