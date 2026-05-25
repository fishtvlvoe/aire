# AIRE Desktop Smoke Report

- Date: 2026-05-25
- Branch: `feat/desktop-fullflow-r02-cop-parity-clean-v2`
- Scope: `desktop-fullflow-r02-cop-parity`

## Local Validation

- `pnpm test` passed: 122 files / 645 tests.
- `pnpm type-check` passed.
- `pnpm build` passed.
- Playwright passed:
  - `product-auth-functional-flow.spec.ts`
  - `product-ui-demo-alignment.spec.ts`
  - `aire-disclosure-registry-ux.spec.ts`
  - `candidate-parcel-options-presurvey.spec.ts`
  - `complete-presurvey-property-sheet-flow.spec.ts`

## macOS Desktop Build

- `pnpm tauri:build` passed.
- App bundle: `src-tauri/target/release/bundle/macos/AIRE.app`
- DMG: `src-tauri/target/release/bundle/dmg/AIRE_0.1.0_aarch64.dmg`
- App executable: `src-tauri/target/release/bundle/macos/AIRE.app/Contents/MacOS/aire`

## macOS Launch Smoke

- Started with `open src-tauri/target/release/bundle/macos/AIRE.app`.
- Process observed:
  - `/Users/fishtv/Development/products/AIRE/src-tauri/target/release/bundle/macos/AIRE.app/Contents/MacOS/aire`
- Screenshot:
  - `artifacts/smoke/macos/desktop-fullflow-r02-cop-parity-clean-v2-launch.png`

## Windows Status

Windows installer/fullflow smoke has not been run in this macOS session. Release gate remains open until Windows CI/VM/physical-machine evidence exists for this commit.
