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

### Decision: Discovery result schema (TS + Rust)

把 Implementation Contract 的 discovery shape 正式化為共用型別。TS 與 Rust 一一對應，改一邊必須同步另一邊。

```ts
export type DiscoveryStatus = "candidate_found" | "manual_required" | "confirmed" | "error";
export type DiscoverySource = "cop_address" | "nlsc_cad" | "dev_fixture" | "manual";

export interface DiscoveryCandidate {
  sectionName: string;
  sectionCode: string;
  landNumber: string;
  buildingNumber?: string;     // land-only case 可空
  source: DiscoverySource;
  confidence?: number;
  trustedForPdf: boolean;       // dev_fixture / nlsc_cad 一律 false
}

export interface DiscoveryError {
  source: DiscoverySource;
  code: string;                 // address_discovery_unavailable | public_cadastral_denied | cop_address_no_match | ...
  message: string;
  httpStatus?: number;
  rawSummary?: string;
}

export interface DiscoveryResult {
  status: DiscoveryStatus;
  source: DiscoverySource;
  trustedForPdf: boolean;
  candidates: DiscoveryCandidate[];
  errors: DiscoveryError[];
  totalCostCents: 0;            // discovery 永遠 0
}
```

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveryResult {
    pub status: DiscoveryStatus,        // candidate_found | manual_required | confirmed | error
    pub source: DiscoverySource,        // cop_address | nlsc_cad | dev_fixture | manual
    pub trusted_for_pdf: bool,
    pub candidates: Vec<DiscoveryCandidate>,
    pub errors: Vec<DiscoveryError>,
    pub total_cost_cents: i64,          // discovery 恆 0
}
```

漸進策略：新增 `land_registry_address_discover() -> DiscoveryResult` 包既有 `land_registry_address_lookup`（回 `Vec<ParcelInfo>`），映射為 candidates + 包狀態/錯誤，不破壞既有簽名。

### Decision: dev_fixture vs trusted_for_pdf semantics

`trusted_for_pdf` 是唯一可信判準，禁止用 `source` 字串判 trusted。`dev_fixture` 僅供本機 E2E，`trustedForPdf` 永遠 false，仍須走 confirm，formal pull 仍要 confirmed key。`nlsc_cad` 候選預設 untrusted。只有 `source=cop_address` 或 `manual` 經 confirm 且 formal pull 成功回寫的 entry 才 `trustedForPdf=true`。勝利街測試值 `勝利段 / 1043-0002 / 00000000` 是人工流程測試值，非真實建號。

### Decision: Reuse 013 ledger tables for discovery/cache/billing/error

discovery diagnostics、cache hit、billing rows、error log 全部寫入既有 `registry_query_runs` + `registry_query_api_calls`（013 migration），零新 migration。discovery run 用 `confirmation_status="discovery"`、`total_cost_cents=0`；cache hit 用 `cache_hit=1` + `source_run_id`；billing 用 `registry_query_api_calls.cost_cents`（SQLite 為費用 SSOT，記憶體 BillingLog 降為視圖）；error 用 `error_summary_json`。需新欄位才開 migration 014。

### Decision: Two new Rust commands gate formal pull

現況：前端 `formalPullData` / `confirmCaseRegistryMatch` 在 Rust 端無對應 command（只有 mock-backend），Rust 僅有底層 `land_registry_pull_data`。Desktop 端流程斷裂，需新建：

1. `confirm_case_registry_match(case_id, section_name, section_code?, land_no, building_no?, source)`：寫 `cases.land_registry_data.confirmed_registry_match` + `registry_query_runs`(confirmed)。building case 必須有 building_no，land-only 允許空。
2. `land_registry_formal_pull_data(case_id, api_ids)`：(a) 讀 confirmed_registry_match，無 → 回 `registry_match_required`, cost=0, 不打 API；(b) 查 cache，有 → cache hit run；(c) 委派既有 `land_registry_pull_data`；(d) 寫 query run + api_calls；(e) 成功回寫 case entries。raw address / dev_fixture / unconfirmed 一律 (a) 擋下。

### Decision: Prove PDF uses saved JSON only

`assemble-dossier-data.ts` 已只讀 `cases.land_registry_data` 經 `extractTrustedOfficialRegistryData()` 過濾，不觸發查詢。鎖死方式：(1) spy 包住 COP/pullData 斷言 PDF 組裝 paid call=0；(2) E2E formal pull 後 billing 筆數 N → 產 PDF → 仍 N；(3) candidate-only 時顯示 pre-survey 警告，正式欄位不 trusted。

### Open assumptions (pending Fish review)

以下 3 項已採推測值，不阻塞 Wave 0–2；Wave 3 起若未推翻，依推測值執行：

1. Rust command 走「新建 2 個」（推測：是，design/tasks/mock 都已這形狀）。
2. 勝利街測試建號 `00000000` 占位可接受（推測：可，已標非真實謄本）。
3. billing 以 `registry_query_api_calls` 為 SSOT、記憶體 BillingLog 降為視圖（推測：是，記憶體重啟丟失）。

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
