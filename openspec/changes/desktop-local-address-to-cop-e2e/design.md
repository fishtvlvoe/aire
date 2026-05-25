## Context

Current live evidence:

- `cargo test --manifest-path src-tauri/Cargo.toml --test cop_api_live -- --ignored --nocapture` succeeded and wrote `/tmp/criterion2-cop-live.json`; known registry key formal COP pull works.
- NLSC/便民 `AddressQueryLand` for 勝利街 and 裕農路 returned `PERMISSION DENIED` from this environment.
- `cop_api_yunong_live` reported `address_to_parcel count=0`; COP address lookup did not produce registry keys for the tested address.
- Browser `localhost:1420` currently rejects `addressLookup()` outside Tauri, so local Web cannot perform real address discovery.

The product therefore has a partial backend capability but not a completed customer workflow. The correction is to make each stage explicit, saved, and testable instead of treating address lookup, manual confirmation, and formal COP pull as one opaque action.

## Goals / Non-Goals

**Goals:**

- Make local Web and Desktop App share the same domain state for discovery, confirmation, formal query, cache, billing, errors, and saved JSON.
- Let Fish test locally without burning unnecessary COP fees.
- Preserve product safety: no fake success, no unconfirmed paid pull, no PDF-time paid pull.
- Produce handoff and evidence files that another Agent can use to continue SR planning or validation.

**Non-Goals:**

- Do not guarantee external NLSC availability.
- Do not fabricate real 勝利街 building numbers.
- Do not unblock App packaging until local Web and App E2E both pass.

## Decisions

### Decision: Split discovery from formal COP pull

Address discovery returns candidates, failure diagnostics, or manual-required state. It never means formal transcript data. Formal COP pull requires a confirmed registry key.

### Decision: Local Web gets a safe dev path, not fake success

Development browser mode may use explicit dev fixtures for E2E only, but fixture results must be marked `dev_fixture_candidate` and `trusted_for_pdf=false`. Unknown addresses must remain manual-required.

### Decision: Every failed external source is product-visible in records

If COP address lookup returns 0 or NLSC returns `PERMISSION_DENIED`, the customer UI shows a readable manual-completion message, while query records preserve source, status, error code/message, and raw diagnostic summary.

### Decision: Fee guard is part of acceptance

A successful formal pull must write billing rows. A repeated formal pull for the same confirmed key must be cache hit with zero additional cost and `sourceRunId` pointing at the original run.

### Decision: App packaging waits

Desktop App packaging and Windows/macOS acceptance cannot be considered complete until this change proves the address-to-COP flow on local Web and Desktop App.

## Implementation Contract

- Introduce a discovery result shape equivalent to:
  - `status`: `candidate_found | manual_required | confirmed | error`
  - `source`: `cop_address | nlsc_cad | dev_fixture | manual`
  - `trustedForPdf`: boolean
  - `candidates`: section name/code, land number, optional building number, source, confidence, diagnostic state
  - `errors`: source, code, message, http status, raw summary
  - `totalCostCents`: always 0 for discovery
- `/cases/new` shall save discovery attempts before case creation when possible, and shall save `confirmed_registry_match` on case creation.
- `confirm_case_registry_match` shall persist confirmed key state and unblock formal pull.
- `land_registry_formal_pull_data` shall reject raw address and unconfirmed candidate data with `registry_match_required` and zero cost.
- PDF assembly shall read saved formal JSON first; if only candidate/dev/manual data exists, it may show pre-survey reference data with mandatory warning but must not populate formal transcript fields as trusted.

## Risks / Trade-offs

- [Risk] External discovery sources may remain unavailable. Mitigation: product records manual-required diagnostics and allows confirmed manual key input.
- [Risk] Dev fixtures may be mistaken for production. Mitigation: fixture source is explicit, trustedForPdf false, and formal pull still requires confirmation.
- [Risk] Live tests cost money. Mitigation: cache-first tests, known parcel fixtures, and fee assertions are mandatory.

## Rollback Plan

If discovery changes destabilize case creation, keep manual-confirmed registry key creation and formal pull gate active, but disable automatic address discovery behind a dev flag. Never roll back to mock placeholder auto-success.
