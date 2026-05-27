## 1. Address Lookup Bridge

- [x] 1.1 Replace the address lookup wrapper with the shared Tauri bridge so Desktop calls `land_registry_address_lookup` and browser mode does not silently fall back to mock address data; verify with `src/lib/__tests__/land-registry-api.test.ts`.
- [x] 1.2 Implement Requirement: Address lookup UI trust guard by updating `/cases/new` to accept only trusted lookup candidates for auto-filled section, land number and building number fields; verify mock `0001` data leaves fields blank in `src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx`.
- [x] 1.3 Run local web smoke against `http://127.0.0.1:3000/cases/new` and confirm a normal address shows manual/Desktop guidance instead of auto-completed placeholder data; save screenshot under ignored test artifacts.

## 2. Gates

- [x] 2.1 Run focused unit tests for the bridge and new case page.
- [x] 2.2 Run TypeScript type-check.
- [x] 2.3 Run Spectra analyze and validate for this change before handoff.
