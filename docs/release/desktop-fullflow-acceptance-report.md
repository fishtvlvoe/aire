# Desktop Fullflow Acceptance Report

Date: 2026-05-25
Branch: `feat/desktop-fullflow-r02-cop-parity-clean-v2`
Commit: `9453d12657a48399483c04eec16adc1a2a978bfa`

## Result

Current status as of 2026-05-26: this report is historical evidence only. The active gate is `desktop-local-address-to-cop-e2e`, which must prove the local Web flow first on `localhost:1420`, then Desktop App parity. The active gate requires evidence for address discovery, `registry_pending`, manual confirmation, formal COP, local DB persistence, cache hit, `sourceRunId`, error logs, fees, PDF artifact, and App parity after SaaS AIRE authorization-code login.

`desktop-fullflow-r02-cop-parity` implementation is functionally validated on web/E2E and macOS Desktop App `0.1.1` fullflow smoke. Windows installer artifacts are now verified from CI on this exact commit. The release gate is still not complete until Windows install/launch/fullflow smoke evidence is collected.

## Implementation Summary

- `/cases/new` now redirects successful login and acts as the address-first workflow entry.
- Address lookup fills section, land number and building number where available; missing fields block case creation and formal lookup.
- Customer-facing copy hides implementation terms in normal workflow.
- Query records show audit/cost/cache/error metadata, with raw details only behind management expansion.
- System Settings centralizes plan, trial, license and registry-account status.
- Formal lookup cache hits record zero cost and preserve `sourceRunId`.
- PDF assembly uses saved trusted registry data and does not start paid lookup during preview/export.
- A separate SR was opened for Desktop auth credential fulfillment and persistent device sessions: `desktop-auth-credential-fulfillment-smoke`.
- macOS installed-app ambiguity was fixed by bumping the package to `0.1.1`; the old `/Applications/AIRE.app` was preserved as `/Applications/AIRE-0.1.0-old-20260525-162121.app`, and `/Applications/AIRE.app` now points to the rebuilt `0.1.1` app.
- Native Desktop auth now uses one auth adapter for login/session guard, avoiding the previous loop back to `/login`.
- Tauri static-export case routes now use `/cases/_?caseId=...` and `/cases/_/preview?caseId=...`, so runtime case IDs work in the installed App.

## Verification

- `pnpm test`: passed, 123 files / 653 tests.
- `pnpm type-check`: passed.
- `pnpm build`: passed.
- `pnpm tauri:build`: passed with Rust warnings only.
- macOS Desktop App `0.1.1` smoke: installed, launched, opened authenticated session, created address-first case, entered workbench, generated PDF preview and exported PDF.
- `E2E_BASE_URL=http://localhost:3000 pnpm exec playwright test e2e/product-auth-functional-flow.spec.ts --reporter=line --timeout=90000`: passed.
- `E2E_BASE_URL=http://localhost:3000 pnpm exec playwright test e2e/product-ui-demo-alignment.spec.ts --reporter=line --timeout=90000`: passed.
- `E2E_BASE_URL=http://localhost:3000 pnpm exec playwright test e2e/aire-disclosure-registry-ux.spec.ts e2e/candidate-parcel-options-presurvey.spec.ts e2e/complete-presurvey-property-sheet-flow.spec.ts --reporter=line --timeout=120000`: passed.
- `E2E_BASE_URL=http://localhost:3000 pnpm exec playwright test e2e/product-auth-functional-flow.spec.ts e2e/product-ui-demo-alignment.spec.ts e2e/product-navigation-ia.spec.ts e2e/full-product-flow-ia-ux-acceptance.spec.ts --reporter=line --timeout=120000`: 12 passed, 1 locator strictness failure fixed.
- `E2E_BASE_URL=http://localhost:3000 pnpm exec playwright test e2e/full-product-flow-ia-ux-acceptance.spec.ts --reporter=line --timeout=120000`: passed.
- `pnpm playwright test e2e/desktop-auth-credential-fulfillment-smoke.spec.ts`: passed (bootstrap code login, relaunch auto-session restore, logout session clear).
- GitHub Actions `Tauri Release` run `26398171467` (head SHA `9453d12657a48399483c04eec16adc1a2a978bfa`): success on `windows-latest` and `macos-latest`.
- `spectra analyze desktop-fullflow-r02-cop-parity --json`: Critical 0 / Warning 0; 14 Suggestions remain for example-level spec clarity.
- `spectra validate desktop-fullflow-r02-cop-parity`: valid.
- `spectra analyze desktop-fullflow-release-acceptance-gate --json`: Critical 0 / Warning 0 / Suggestions 0.
- `spectra validate desktop-fullflow-release-acceptance-gate`: valid.

## Artifacts

- macOS app: `src-tauri/target/release/bundle/macos/AIRE.app`
- macOS DMG: `src-tauri/target/release/bundle/dmg/AIRE_0.1.1_aarch64.dmg`
- Windows MSI artifact (CI): `AIRE_0.1.3_x64_en-US.msi`
- Windows EXE installer artifact (CI): `AIRE_0.1.3_x64-setup.exe`
- CI run URL: `https://github.com/fishtvlvoe/aire/actions/runs/26398171467`
- Draft release URL: `https://github.com/fishtvlvoe/aire/releases/tag/untagged-b25f3aacbbd9b2a05748`
- macOS launch screenshot: `artifacts/smoke/macos/desktop-fullflow-r02-cop-parity-clean-v2-launch.png`
- macOS PDF preview screenshot: `artifacts/smoke/macos/desktop-fullflow-r02-cop-parity-0.1.1-pdf-preview.png`
- macOS PDF artifact: `artifacts/smoke/macos/desktop-fullflow-r02-cop-parity-0.1.1-export.pdf` (`PDF document, version 1.3, 18 pages`)
- Playwright screenshots: `e2e/results/demo-alignment/*.png`
- Playwright navigation screenshots: `e2e/results/navigation-ia/*.png`
- Desktop auth smoke artifacts: `e2e/results/test-artifacts/desktop-auth-credential-fu-*/`
- Playwright report: `e2e/results/playwright-report/index.html`

## Known Gap

Windows install/start/fullflow/PDF evidence has not been executed in this macOS terminal session. CI proves installer build integrity for this commit, but does not replace VM/physical launch and workflow verification. Do not mark the active `desktop-local-address-to-cop-e2e` flow complete and do not start auto-update until Local Web, Mac App parity, and required Windows runtime evidence exist for the current SR.

## desktop-local-address-to-cop-e2e Current Evidence — 2026-05-27

Status: Local Web gate and macOS Desktop App wrapper parity have been re-verified. Windows runtime cannot be executed from this macOS session because no Windows VM/runner is installed; the blocker is recorded with artifact evidence.

### Commands Run

- `pnpm vitest run src/app/'(dashboard)'/cases/new/__tests__/new-case-page.test.tsx src/lib/__tests__/mock-backend.test.ts src/app/'(dashboard)'/settings/__tests__/page.test.tsx --reporter=dot` — passed, 70 tests.
- `pnpm vitest run src/components/__tests__/DemoAlignedWorkbench.test.tsx --reporter=dot` — passed, 15 tests.
- `E2E_BASE_URL=http://localhost:1420 pnpm exec playwright test e2e/local-web-registry-pending-billing.spec.ts --project=chromium-tauri --reporter=line` — passed, 4 tests.
- `AIRE_KEYRING_BACKEND=memory pnpm tauri:dev` — macOS Desktop App launched without macOS Keychain prompt; App loads the same local frontend as the verified Web flow.
- `E2E_BASE_URL=http://localhost:3000 pnpm exec playwright test e2e/local-web-registry-pending-billing.spec.ts --project=chromium-tauri` — passed, 4 tests; Playwright JSON/HTML report updated under `e2e/results/`.
- `cargo test --manifest-path src-tauri/Cargo.toml secrets::tests -- --nocapture` — passed, 7 tests; confirms the debug-only memory keyring switch for E2E/dev.
- Windows runtime probe: this host is macOS ARM64 and has no local Windows VM/runner (`qemu-system-x86_64`, `multipass`, `utmctl`, `VBoxManage`, `vmrun`, and `act` absent). Blocker evidence saved to `artifacts/smoke/windows-runtime-blocker-20260527.json`.

### Evidence Covered

- Registry pending: `台南市永康區勝利街58巷4號` failure path is validated through Playwright with zero-cost discovery failure, pending/manual completion, confirmed registry key, formal import, cache hit, and PDF preview.
- Paid resolver opt-in: `高雄市苓雅區苓雅路二段18巷8弄2號` starts with zero paid runs; resolver is called only after explicit click; resolver creates candidate evidence and a separate 30 元 billing row.
- Billing drilldown: fee records show object type, target, status, transaction id, cost, saved run id, cache/source state, and service rows.
- Live discovery matrix: saved to `artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json`; every scenario recorded `totalCostCents=0` before formal import.
- PDF artifact smoke: `artifacts/smoke/desktop-local-address-to-cop-e2e-imported-fields.pdf` from the imported-fields smoke remains the current PDF field artifact for this SR.
- macOS Desktop App parity screenshot: `artifacts/smoke/macos/desktop-local-address-to-cop-e2e-macos-memory-keyring-parity-20260527.png`.
- Keychain bypass smoke screenshots: `artifacts/smoke/macos/desktop-local-address-to-cop-e2e-memory-keyring-launch-20260527.png` and `artifacts/smoke/macos/desktop-local-address-to-cop-e2e-memory-keyring-app-front-20260527.png`.
- Windows runtime blocker artifact: `artifacts/smoke/windows-runtime-blocker-20260527.json`.
- Playwright artifacts: latest focused run writes traces/screenshots under `e2e/results/test-artifacts/local-web-registry-pending-*`.

### Live Matrix Notes

The live matrix intentionally preserves upstream failures instead of converting them into fake success. In the latest run, Tainan doorplate and Tainan land descriptor returned candidates; Kaohsiung and the multi-building Tainan no-floor query returned readable upstream/manual-required evidence with zero cost. These are valid pre-formal discovery outcomes because no paid resolver or formal import is started automatically.

### Windows Runtime Status

Windows runtime is now partially verified through UTM Windows 11 ARM64. The installer `AIRE_0.1.3_x64-setup.exe` was installed inside VM `AIRE-Windows-11-ARM64`, and the installed Windows app launched to the AIRE 0.1.3 login screen.

- Installer provenance: `artifacts/smoke/windows/installer-provenance-20260527.json`
- Launch evidence: `artifacts/smoke/windows/aire-windows-installed-launch-login-20260527.png`
- Launch evidence metadata: `artifacts/smoke/windows/aire-windows-installed-launch-login-20260527.json`

This is not yet full Windows address-to-COP acceptance. The remaining blocker is authentication inside the installed Windows app: the next concrete step is to enter the existing desktop E2E one-time code `OTC-ADMIN-2026` in the Windows login screen and click `使用一次性登入碼`, then run the address-to-COP/PDF smoke from inside Windows. Computer Use did not continue this step because UTM input capture was trapping the user's mouse.

### GitHub Actions Windows Runtime Smoke — 2026-05-27

Because UTM input capture trapped the user's keyboard and mouse, a non-interactive Windows runtime smoke was added to `release.yml` and run against the existing draft release `aire-v0.1.3`.

- Run: `https://github.com/fishtvlvoe/aire/actions/runs/26511089066`
- Runner: `windows-latest`
- Installer: `AIRE_0.1.3_x64-setup.exe`
- Installer SHA-256: `cda8090a4f2f3a83477b20e6416d7c5734c29f423d493ed4456d7f03e1470c59`
- Installed app path: `C:\Users\runneradmin\AppData\Local\AIRE\AIRE.exe`
- Process observed: `aire`
- Main window title: `AIRE 0.1.3`
- Evidence report: `artifacts/smoke/windows/github-runtime-smoke-26511089066/report.json`
- Evidence screenshot: `artifacts/smoke/windows/github-runtime-smoke-26511089066/aire-windows-runtime-smoke.png`

Result: Windows installer install + app launch smoke passed on GitHub Actions Windows runner. This proves the Windows desktop artifact can install and open without relying on the local UTM UI. It still does not prove the full address-to-COP/PDF flow inside Windows.

### GitHub Actions Windows Runtime Smoke From Current Branch — 2026-05-27

The current branch was rebuilt through `release.yml`; macOS and Windows type-check, unit test, and Tauri packaging passed. The Windows job then silent-installed the freshly built NSIS installer and launched the installed app on `windows-latest`.

- Run: `https://github.com/fishtvlvoe/aire/actions/runs/26513341136`
- Head SHA: `5ef0871e845d6563171a2604779b9ca035e23b29`
- Runner: `windows-latest`
- Installer: `src-tauri\target\release\bundle\nsis\AIRE_0.1.3_x64-setup.exe`
- Installer SHA-256: `d6a4f83b85b0d1431b362b301a39495e2b98b05333ab76b39958aeb8c278ebfb`
- Installed app path: `C:\Users\runneradmin\AppData\Local\AIRE\AIRE.exe`
- Process observed: `aire`
- Main window title: `AIRE 0.1.3`
- Evidence report: `artifacts/smoke/windows/github-runtime-smoke-26513341136/report.json`
- Evidence screenshot: `artifacts/smoke/windows/github-runtime-smoke-26513341136/aire-windows-runtime-smoke.png`

Result: Current branch Windows installer build, install, and launch smoke passed without using the local UTM UI. This is enough to say the Windows app can install and open. It is still not a full Windows address-to-COP/PDF acceptance run.
