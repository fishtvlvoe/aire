## ADDED Requirements

### Requirement: Worker deployed to aire.opcos.me via Wrangler

The Cloudflare Worker SHALL be deployable with `wrangler deploy` from the `cloudflare-worker/` directory. `wrangler.toml` SHALL define the worker name, KV namespace binding `LICENSES`, and route `aire.opcos.me/*`.

#### Scenario: Local dev test passes before deploy

- **GIVEN** `wrangler dev` is running
- **WHEN** `POST http://localhost:8787/api/license/activate` with a pre-seeded inactive key
- **THEN** HTTP 200 is returned (see license-worker-activate scenarios)

### Requirement: KV namespace named LICENSES is bound

The `wrangler.toml` SHALL include a `[[kv_namespaces]]` binding with `binding = "LICENSES"` and a valid `id` from `wrangler kv:namespace create LICENSES`.

#### Scenario: Worker can read and write LICENSES KV

- **GIVEN** A KV namespace created and bound as `LICENSES`
- **WHEN** The worker handler calls `env.LICENSES.get("license:KEY")` and `env.LICENSES.put(...)`
- **THEN** Reads and writes succeed without runtime errors
