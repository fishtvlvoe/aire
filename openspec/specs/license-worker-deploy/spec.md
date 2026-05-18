# license-worker-deploy Specification

## Purpose

TBD - created by archiving change 'aire-opcos-me-license'. Update Purpose after archive.

## Requirements

### Requirement: Worker deployed to aire.opcos.me via Wrangler

The Cloudflare Worker SHALL be deployable with `wrangler deploy` from the `cloudflare-worker/` directory. `wrangler.toml` SHALL define the worker name, KV namespace binding `LICENSES`, and route `aire.opcos.me/*`.

#### Scenario: Local dev test passes before deploy

- **GIVEN** `wrangler dev` is running
- **WHEN** `POST http://localhost:8787/api/license/activate` with a pre-seeded inactive key
- **THEN** HTTP 200 is returned (see license-worker-activate scenarios)


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
### Requirement: KV namespace named LICENSES is bound

The `wrangler.toml` SHALL include a `[[kv_namespaces]]` binding with `binding = "LICENSES"` and a valid `id` from `wrangler kv:namespace create LICENSES`.

#### Scenario: Worker can read and write LICENSES KV

- **GIVEN** A KV namespace created and bound as `LICENSES`
- **WHEN** The worker handler calls `env.LICENSES.get("license:KEY")` and `env.LICENSES.put(...)`
- **THEN** Reads and writes succeed without runtime errors

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