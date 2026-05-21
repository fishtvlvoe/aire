## Context

Fish provided screenshots from the MOI portal showing one failed service run with `COP309` and a separate query summary showing `回傳資料筆數 27`, `成功次數 28`, `失敗次數 37`, and `累計未付款 27.00 元` for the period around 2026/05/18 to 2026/05/21. The visible failing service message says the target service failed because the input county/city range was not open for query. The immediate product issue is that AIRE/OPCOS users cannot audit which MOI calls succeeded, which failed, which calls were billable, and why the official unpaid amount differs from expected application-side records.

## Goals / Non-Goals

**Goals:**

- Capture every MOI API call outcome, including failures such as `COP309`.
- Show customer/admin totals that match MOI portal concepts: return row count, success count, failure count, and unpaid amount.
- Keep a pricing table for MOI service codes, starting with `MOI_API_005` and `MOI_API_037`.
- Make failed non-billable calls visible without adding them to billable cost.

**Non-Goals:**

- No payment collection or invoice automation.
- No upload of case PDFs, owner personal data, or full property dossiers to OPCOS.
- No broad rewrite of land registry query flows.

## Decisions

### Decision: Store an append-only local usage ledger before dashboard aggregation

AIRE desktop SHALL write one immutable ledger row per MOI API attempt, then derive dashboard totals from ledger rows. This avoids losing failed attempts and lets customer support compare AIRE state with MOI portal records.

Alternatives Considered:

- Aggregate only daily totals: rejected because it hides which API failed and why.
- Store only successful calls: rejected because the observed issue is mainly success/failure and fee mismatch.

### Decision: Use a service pricing table separate from call records

AIRE SHALL keep a service-code pricing table so unit prices and billable failure rules are auditable. `MOI_API_005` and `MOI_API_037` SHALL be seeded first because they were observed in the reported workflow.

Alternatives Considered:

- Hardcode prices inside API client functions: rejected because it is hard to audit and update.
- Ask users to reconcile fees manually from MOI portal only: rejected because AIRE should explain customer-facing costs.

## Implementation Contract

### Usage ledger behavior

- Each MOI API attempt creates a ledger row with service code, status, error code, message summary, return rows, startedAt, finishedAt, billable flag, and charged amount.
- `COP309` failures are recorded as failed attempts with return rows `0` and non-billable amount unless MOI documentation proves otherwise.
- Ledger rows SHALL NOT include owner personal data, complete property address, PDF content, or raw dossier payloads.

### Cost audit dashboard behavior

- Dashboard filters by date range, service code, status, and history/request id.
- Dashboard displays return row count, success count, failure count, success/failure percentage, and unpaid amount.
- The unpaid amount is derived from billable ledger rows and service pricing table.

### Verification targets

- Unit tests cover successful call ledger row, failed `COP309` row, pricing table lookup, and total calculation.
- UI tests cover date/service/status filtering and summary cards.
- A manual QA checklist compares one AIRE date range with MOI portal screenshots.

## Risks / Trade-offs

- [Risk] MOI billing rules differ by service and failure type → Mitigation: keep billable rule per service code and mark unknown rules as explicit pricing gaps.
- [Risk] Logs may accidentally store personal data → Mitigation: ledger schema only stores service metadata and sanitized error summaries.
- [Risk] Totals may not match MOI if MOI charges asynchronously → Mitigation: display calculation timestamp and raw ledger rows used for totals.

## Migration Plan

1. Add local ledger and pricing table migrations.
2. Instrument MOI API client calls.
3. Add dashboard summaries and filters.
4. Verify against the captured MOI screenshots.

Rollback strategy:

- If dashboard aggregation is wrong, keep ledger capture enabled and hide the summary cards until formulas are corrected.
