# license-worker-activate Specification

## Purpose

TBD - created by archiving change 'aire-opcos-me-license'. Update Purpose after archive.

## Requirements

### Requirement: First-time activation binds device to license

The Worker endpoint `POST /api/license/activate` SHALL, when the KV record for the license key exists with `status: "inactive"`, update the record to `status: "active"` with the provided `device_id`, `device_name`, `os_version`, and `activated_at` (ISO 8601 timestamp), and return HTTP 200.

#### Scenario: Activate an inactive license key

- **GIVEN** KV contains `license:TESTKEY` = `{ "status": "inactive" }`
- **WHEN** `POST /api/license/activate` with body `{ "license_key": "TESTKEY", "device_id": "dev-001", "device_name": "MacBook", "os_version": "14.0" }`
- **THEN** HTTP 200, body `{ "status": "active", "token": "TESTKEY", "valid_until": null }`
- **AND** KV `license:TESTKEY` contains `{ "status": "active", "device_id": "dev-001" }`


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
### Requirement: Re-activation by same device is idempotent

When the license key is `status: "active"` and the requesting `device_id` matches the stored one, the endpoint SHALL return HTTP 200 without modifying the KV record.

#### Scenario: Same device re-activates

- **GIVEN** KV contains `license:TESTKEY` = `{ "status": "active", "device_id": "dev-001" }`
- **WHEN** `POST /api/license/activate` with `{ "license_key": "TESTKEY", "device_id": "dev-001", ... }`
- **THEN** HTTP 200, body `{ "status": "active", "token": "TESTKEY", "valid_until": null }`


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
### Requirement: Different device returns 409

When the license key is `status: "active"` and the requesting `device_id` does NOT match, the endpoint SHALL return HTTP 409 with body `{ "error": "device_locked" }`.

#### Scenario: Second device tries to activate a locked key

- **GIVEN** KV contains `license:TESTKEY` = `{ "status": "active", "device_id": "dev-001" }`
- **WHEN** `POST /api/license/activate` with `{ "license_key": "TESTKEY", "device_id": "other-device", ... }`
- **THEN** HTTP 409, body `{ "error": "device_locked" }`


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
### Requirement: Unknown or revoked key returns 404

When the KV key does not exist or `status` is `"revoked"`, the endpoint SHALL return HTTP 404 with body `{ "error": "invalid_license" }`.

#### Scenario: Activate a non-existent key

- **GIVEN** KV has no entry for `license:UNKNOWN`
- **WHEN** `POST /api/license/activate` with `{ "license_key": "UNKNOWN", ... }`
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