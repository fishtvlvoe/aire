# Realtor License Verification

## MODIFIED Requirements

### Requirement: Test Isolation via tauri-bridge Mock

**Status**: Modified

**Previously**: Tests for `RealtorLicenseField` mocked `@tauri-apps/api/core` `invoke` directly.

**Updated**: Tests SHALL mock `@/lib/tauri-bridge` `safeInvoke` instead of the raw Tauri core `invoke`.

**Rationale**: The `RealtorLicenseField` component calls `safeInvoke` from `@/lib/tauri-bridge`, not `invoke` from `@tauri-apps/api/core` directly. Tests that mock the wrong layer receive no mock response and time out.

**Acceptance Criteria**:
- `vi.mock("@/lib/tauri-bridge", ...)` is present in `RealtorLicenseField.test.tsx`
- `safeInvoke` is stubbed to resolve with fixture data
- All 10 RLV tests pass without timeout
