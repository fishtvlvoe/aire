# legal-clauses-sync Specification

## Purpose

Sync three central Taiwan real-estate-related laws (不動產經紀業管理條例 / 消費者保護法相關條款 / 公平交易法相關條款) from OPCOS cloud proxy into a local SQLite cache, support offline rendering, and refresh on app start plus every 7 days.

## ADDED Requirements

### Requirement: System SHALL sync three central laws from OPCOS proxy

The system SHALL fetch exactly three central laws (`real-estate-broker-act`, `consumer-protection-relevant`, `fair-trade-relevant`) from `OPCOS_LEGAL_CLAUSES_ENDPOINT` and persist them in the SQLite `legal_clauses` table with `law_id`, `title`, `content_markdown`, `version_date`, `fetched_at`, `source_url` columns.

#### Scenario: First-run sync populates all three laws

- **WHEN** the app starts for the first time and `OPCOS_LEGAL_CLAUSES_ENDPOINT` is reachable
- **THEN** `SELECT law_id FROM legal_clauses ORDER BY law_id` returns exactly `['consumer-protection-relevant', 'fair-trade-relevant', 'real-estate-broker-act']`

#### Scenario: Each law row has required metadata

- **WHEN** the first sync completes
- **THEN** every row in `legal_clauses` has non-null `title`, `content_markdown`, `version_date` (ISO 8601), `fetched_at` (ISO 8601), `source_url` (HTTPS URL string)

### Requirement: Sync SHALL trigger on app start and every 7 days

The system SHALL check the OPCOS version endpoint (`GET /v1/legal-clauses/version`) on every app start AND every 7 days via `tokio-cron-scheduler`. If the OPCOS-reported version is newer than the local version, the system SHALL fetch the changed laws and update the cache.

#### Scenario: App start with newer version triggers fetch

- **WHEN** the app starts AND OPCOS returns `latest_version: '2026-05-15'` while local cache has version `'2026-04-01'`
- **THEN** the system fetches the updated laws and updates `legal_clauses.version_date` for the changed `law_id` rows

#### Scenario: 7-day scheduler triggers check

- **WHEN** 7 days have elapsed since the last sync check (verified via test time travel mock)
- **THEN** the `tokio-cron-scheduler` callback invokes the version check exactly once

### Requirement: Offline mode SHALL fall back to local cache

The system SHALL detect OPCOS unreachability (network error, 5xx, timeout > 5s) and SHALL fall back to the existing local cache without erroring out. The UI SHALL surface a non-blocking banner "⚠ 法規同步失敗，使用 N 天前版本".

#### Scenario: Network error falls back gracefully

- **WHEN** the sync fetch fails with a network error (no internet) and local cache has data
- **THEN** `sync_legal_clauses()` returns `Ok(SyncResult::FallbackToCache)` and the UI banner shows "⚠ 法規同步失敗，使用 N 天前版本" (where N is days since `MAX(fetched_at)`)

#### Scenario: Empty cache on first launch with no network shows different message

- **WHEN** the first sync fails AND `legal_clauses` table is empty
- **THEN** the UI banner shows "⚠ 無法連線取得法規資料，PDF 法規告知頁將為空白；請聯網後重試" and `sync_legal_clauses()` returns `Ok(SyncResult::EmptyCacheNoNetwork)`

### Requirement: Sync SHALL not block the UI

The system SHALL run the sync operation in a background async task and SHALL NOT block the main UI thread during fetch or SQLite write. PDF rendering SHALL proceed using whatever cache is available at the moment of render trigger.

#### Scenario: Sync runs without blocking UI render

- **WHEN** sync is in progress AND user clicks "Generate PDF"
- **THEN** the PDF render completes using the current cache (whether old or new) AND the sync continues in background

### Requirement: System SHALL expose `sync_legal_clauses` and `get_legal_clause` IPC commands

The system SHALL provide Tauri IPC commands:
- `sync_legal_clauses() -> Result<SyncResult, LegalClausesError>` for manual sync trigger (e.g., from settings page)
- `get_legal_clause(law_id) -> Result<LegalClause, LegalClausesError>` for PDF rendering to fetch a specific law

#### Scenario: get_legal_clause returns LegalClause struct

- **WHEN** the IPC `get_legal_clause('real-estate-broker-act')` is invoked AND the law exists in cache
- **THEN** the response is `Ok({ law_id, title, content_markdown, version_date, fetched_at, source_url })`

#### Scenario: get_legal_clause for missing law returns typed error

- **WHEN** `get_legal_clause('non-existent-law-id')` is invoked
- **THEN** the response is `Err(LegalClausesError::LawNotFound)`

### Requirement: SQLite writes SHALL be atomic per law

The system SHALL write each law row in a separate SQLite transaction with `INSERT OR REPLACE`. Partial sync failures (e.g., 2 of 3 laws succeed) SHALL leave the successfully-fetched rows in cache (not rollback all).

#### Scenario: Partial sync preserves successful rows

- **WHEN** the sync of `real-estate-broker-act` succeeds, then network drops, then `consumer-protection-relevant` fetch fails
- **THEN** `SELECT law_id FROM legal_clauses` returns `['real-estate-broker-act']` AND the next sync retry resumes from `consumer-protection-relevant`
