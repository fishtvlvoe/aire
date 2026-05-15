## ADDED Requirements

### Requirement: Batch queue SHALL split requests into chunks of at most 25 items
The land registry batch dispatcher SHALL split any input slice longer than 25 items into chunks of size 25, where the final chunk SHALL contain the remainder when the total is not a multiple of 25. The dispatcher SHALL issue one upstream call per chunk. This matches the platform's documented batch ceiling.

#### Scenario: 50 items become exactly two upstream calls
- **GIVEN** the caller invokes `batch::dispatch` with 50 query items
- **WHEN** the dispatcher runs
- **THEN** the dispatcher SHALL issue exactly two upstream calls
- **AND** the first call body SHALL contain items 1-25 and the second SHALL contain items 26-50

#### Scenario: 27 items become two calls (25 + 2)
- **GIVEN** the caller invokes `batch::dispatch` with 27 items
- **WHEN** the dispatcher runs
- **THEN** the dispatcher SHALL issue exactly two upstream calls of sizes 25 and 2 respectively

### Requirement: Batch results SHALL preserve original input order
The dispatcher SHALL return a `Vec<Result<Value, LandRegistryError>>` whose order matches the input slice, so callers can correlate results back to inputs by index.

#### Scenario: Results map back to input positions
- **WHEN** `batch::dispatch(items)` returns results
- **THEN** `results[i]` SHALL correspond to `items[i]` for every `i`
- **AND** a failure in one chunk SHALL NOT shift indexes of items in other chunks
