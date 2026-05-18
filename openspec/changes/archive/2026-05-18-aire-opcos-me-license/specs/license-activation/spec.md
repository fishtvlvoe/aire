## ADDED Requirements

### Requirement: OPCOS API base URL points to production server in release build

In a `cargo build --release` build (or when `AIRE_RELEASE_BUILD=1` is set), the compiled binary SHALL use `https://aire.opcos.me` as the base URL for license API calls. The `build.rs` script SHALL emit `cargo:rustc-env=OPCOS_API_BASE_URL=https://aire.opcos.me` when in release mode.

#### Scenario: Release binary uses aire.opcos.me

- **GIVEN** `cargo build --release` is executed
- **WHEN** The binary is inspected with `strings target/release/aire | grep aire.opcos.me`
- **THEN** At least one match is found
