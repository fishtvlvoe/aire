## ADDED Requirements

### Requirement: Time-synced "now" SHALL be derived from a trusted source, not the wall clock
The crate SHALL maintain a clock offset measured against OPCOS server time (parsed from the `Date` response header on any successful OPCOS call) or, as fallback, an NTP pool. All TTL comparisons in cache, JWT expiry, OPCOS grace period, and audit logging SHALL use `now() + offset` rather than the raw system clock.

#### Scenario: Offset captured from OPCOS response
- **GIVEN** OPCOS responds with `Date: Tue, 14 Jan 2026 12:00:00 GMT` while the local clock reads `12:30:00 GMT`
- **WHEN** the time-sync module observes the response
- **THEN** the module SHALL persist `offset_ms = -1_800_000` (local is 30 minutes ahead)
- **AND** subsequent `synced_now()` calls SHALL return `system_now() + offset_ms`

#### Scenario: OPCOS unreachable, NTP fallback succeeds
- **WHEN** OPCOS is unreachable for the entire startup phase
- **THEN** the module SHALL query an NTP pool (e.g. `pool.ntp.org`) to compute the offset
- **AND** SHALL record the source as `ntp` in `time_sync_state.source`

### Requirement: Time-sync failure SHALL NOT block App startup
If both OPCOS and NTP are unreachable at startup, the crate SHALL keep using the last persisted offset and SHALL flag `synced` as `false` so the UI in another change can surface a warning. App startup SHALL continue.

#### Scenario: Both sources offline, App still starts
- **WHEN** OPCOS and NTP are both unreachable
- **THEN** the App SHALL still start using the most recently persisted offset
- **AND** the time-sync state SHALL expose `is_synced() == false`
