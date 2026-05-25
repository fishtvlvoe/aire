# AIRE Desktop Smoke Report

- Date: 2026-05-25
- Branch: `feat/desktop-fullflow-r02-cop-parity-clean-v2`
- Scope: `desktop-fullflow-r02-cop-parity`

## Local Validation

- `pnpm test` passed: 122 files / 646 tests.
- `pnpm type-check` passed.
- `pnpm build` passed.
- Playwright passed:
  - `product-auth-functional-flow.spec.ts`
  - `product-ui-demo-alignment.spec.ts`
  - `aire-disclosure-registry-ux.spec.ts`
  - `candidate-parcel-options-presurvey.spec.ts`
  - `complete-presurvey-property-sheet-flow.spec.ts`
  - route regression set after static-export fix:
    - `product-auth-functional-flow.spec.ts`
    - `product-ui-demo-alignment.spec.ts`
    - `product-navigation-ia.spec.ts`
    - `full-product-flow-ia-ux-acceptance.spec.ts`
- Spectra:
  - `spectra analyze desktop-fullflow-r02-cop-parity --json`: Critical 0 / Warning 0, 14 Suggestions.
  - `spectra validate desktop-fullflow-r02-cop-parity`: valid.
  - `spectra analyze desktop-fullflow-release-acceptance-gate --json`: Critical 0 / Warning 0 / Suggestions 0.
  - `spectra validate desktop-fullflow-release-acceptance-gate`: valid.

## macOS Desktop Build

- `pnpm tauri:build` passed.
- App bundle: `src-tauri/target/release/bundle/macos/AIRE.app`
- DMG: `src-tauri/target/release/bundle/dmg/AIRE_0.1.1_aarch64.dmg`
- App executable: `src-tauri/target/release/bundle/macos/AIRE.app/Contents/MacOS/aire`
- Installed app: `/Applications/AIRE.app` (`AIRE 0.1.1`)
- Previous installed app preserved at `/Applications/AIRE-0.1.0-old-20260525-162121.app`

## macOS App Fullflow Smoke

- Started with `open /Applications/AIRE.app`.
- Process observed:
  - `/Applications/AIRE.app/Contents/MacOS/aire`
- Confirmed window title: `AIRE 0.1.1`
- Confirmed login/session guard no longer loops back to `/login`.
- Confirmed address-first case creation from `/cases/new`:
  - Address: `宜蘭縣五結鄉協和村親河路二段1號`
  - Auto-filled: section `0001`, land number `0001`, building number `0001`
  - Created case: `ef362bae-31f5-43ad-a8cd-e053c166996d`
- Confirmed case row opens workbench via static-export safe route:
  - `tauri://localhost/cases/_?caseId=ef362bae-31f5-43ad-a8cd-e053c166996d`
- Confirmed PDF preview route:
  - `tauri://localhost/cases/_/preview?caseId=ef362bae-31f5-43ad-a8cd-e053c166996d`
- Confirmed PDF export:
  - App wrote `/Users/fishtv/Documents/ef362bae-說明書.pdf`
  - Copied artifact: `artifacts/smoke/macos/desktop-fullflow-r02-cop-parity-0.1.1-export.pdf`
  - File check: `PDF document, version 1.3, 18 pages`
- Screenshot:
  - `artifacts/smoke/macos/desktop-fullflow-r02-cop-parity-clean-v2-launch.png`
  - `artifacts/smoke/macos/desktop-fullflow-r02-cop-parity-0.1.1-pdf-preview.png`

## Windows Status

Windows installer/fullflow smoke has not been run in this macOS session. Release gate remains open until Windows CI/VM/physical-machine evidence exists for this commit.
