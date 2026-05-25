# AIRE Desktop Smoke Report

- Date: 2026-05-25
- Branch: `feat/desktop-fullflow-r02-cop-parity-clean-v2`
- Base commit requested: `60272627`
- Implementation commit: `70c7917b`

## 1) Local validation (macOS)

### Build and test

- `pnpm vitest run 'src/components/__tests__/PullParcelDataButton.test.tsx' 'src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx' 'src/app/(dashboard)/settings/__tests__/page.test.tsx' 'src/lib/__tests__/mock-backend.test.ts'` passed.
- `spectra analyze desktop-fullflow-r02-cop-parity --json` passed with `0 Critical / 0 Warning` and Suggestions only.
- `spectra validate desktop-fullflow-r02-cop-parity` passed.
- `pnpm playwright test e2e/smoke.spec.ts --reporter=line` passed.
- `pnpm playwright test e2e/complete-presurvey-property-sheet-flow.spec.ts --reporter=line` passed.
- `pnpm build` passed.
- `pnpm tauri:build` passed.

### macOS packaging artifacts

- App bundle: `src-tauri/target/release/bundle/macos/AIRE.app`
- DMG: `src-tauri/target/release/bundle/dmg/AIRE_0.1.0_aarch64.dmg`

### macOS launch smoke

- Verified binary type: arm64 Mach-O executable.
- Launched app using `open .../AIRE.app`.
- Verified process up (`.../AIRE.app/Contents/MacOS/aire`).
- Captured launch screenshot:
  - `artifacts/smoke/macos/launch.png`

## 2) Windows CI validation

- Workflow: `Tauri Release` (`.github/workflows/release.yml`)
- Run URL: <https://github.com/fishtvlvoe/aire/actions/runs/26385943003>
- Result: `success`
- Job: `build (windows-latest, windows-x64)` completed successfully.
- Job metadata snapshot:
  - `artifacts/smoke/windows-ci-run-26385943003.json`

## 2a) Windows CI installer smoke validation

- Workflow: `Tauri Release` (`.github/workflows/release.yml`)
- Run URL: <https://github.com/fishtvlvoe/aire/actions/runs/26386786309>
- Result: `success`
- Windows job: `build (windows-latest, windows-x64)` completed successfully.
- Successful Windows smoke steps:
  - `Locate Windows installer`
  - `Smoke installed Windows app`
  - `Run complete product fullflow`
  - `Upload Windows smoke evidence`
- Installed executable captured by smoke:
  - `C:\Program Files\AIRE\AIRE.exe`
- Window evidence:
  - process name: `aire`
  - main window title: `AIRE`
  - `windowSeen: true`
- Evidence snapshot files:
  - `artifacts/smoke/windows-install-smoke-run-26386786309.json`
  - `artifacts/smoke/windows-install-smoke-artifacts-26386786309.json`
  - `artifacts/smoke/windows-ci-download/artifacts/smoke/windows-vm/install.log`
  - `artifacts/smoke/windows-ci-download/artifacts/smoke/windows-vm/process.json`
  - `artifacts/smoke/windows-ci-download/artifacts/smoke/windows-vm/window.json`
  - `artifacts/smoke/windows-ci-download/artifacts/smoke/windows-vm/launch.png`
  - `artifacts/smoke/windows-ci-download/e2e/results/playwright-report/index.html`
  - `artifacts/smoke/windows-ci-download/e2e/results/results.json`

## 3) Release artifacts (macOS + Windows)

- Release snapshot:
  - `artifacts/smoke/release-aire-v0.1.0.json`
- Draft release URL:
  - <https://github.com/fishtvlvoe/aire/releases/tag/untagged-12254794a1d9f4ade079>
- Uploaded assets include:
  - `AIRE_0.1.0_aarch64.dmg`
  - `AIRE_0.1.0_x64-setup.exe`
  - `AIRE_0.1.0_x64_en-US.msi`
  - `AIRE_aarch64.app.tar.gz`

## 4) Scope/gap note

- This run completed macOS local smoke and Windows CI packaging smoke.
- Windows CI/VM installer smoke is complete through GitHub-hosted `windows-latest`.
- Separate human-operated physical Windows UAT can be added later, but is not required for this CI installer smoke acceptance.
