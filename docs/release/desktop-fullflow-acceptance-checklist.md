# Desktop Fullflow Acceptance Checklist

Date: 2026-05-25
Branch: `feat/desktop-fullflow-r02-cop-parity-clean-v2`
Commit: `9453d12657a48399483c04eec16adc1a2a978bfa`

## Current Gate

- [ ] `desktop-local-address-to-cop-e2e` is the current release gate.
- [ ] Local Web on `localhost:1420` proves address discovery, `registry_pending`, manual confirmation, formal COP, local DB persistence, cache hit, error records, fee records, and PDF from saved data.
- [ ] Mac Desktop App repeats the same flow after SaaS AIRE authorization-code login.
- [ ] Windows evidence is collected only after Local Web and Mac App parity pass.
- [ ] Auto-update remains out of scope until this SR passes.
- [ ] Completion evidence includes Playwright artifacts, saved query JSON, fees, cache hit, `sourceRunId`, readable error log, PDF artifact, and local DB evidence.

The historical checklist below is retained for traceability only. It does not complete `desktop-local-address-to-cop-e2e`.

## desktop-fullflow-r02-cop-parity

- [x] `/cases/new` is the only customer-facing address lookup entry.
- [x] Address input auto-fills or asks the user to confirm section, land number and building number.
- [x] Formal lookup is blocked before confirmed registry fields.
- [x] Customer workflow hides R02, 便民系統, COP, API, Helper, adapter, parser, payload and JSON.
- [x] Query records are audit-only: search, cost, cache, source run, error and expandable management details.
- [x] System Settings shows plan, trial, license and customer registry-account status.
- [x] Formal query cache hit creates zero-cost run with `sourceRunId`.
- [x] Property survey, supplements, HTML preview and PDF assembly use saved registry data.
- [x] PDF assembly no longer starts a paid registry pull.
- [x] SaaS parity is not claimed for this release.

## Automated Evidence

- [x] `pnpm test` — 123 files / 653 tests passed.
- [x] `pnpm type-check` — passed.
- [x] `pnpm build` — passed.
- [x] `pnpm tauri:build` — passed for macOS `0.1.1`.
- [x] Playwright `product-auth-functional-flow.spec.ts` — passed.
- [x] Playwright `product-ui-demo-alignment.spec.ts` — passed.
- [x] Playwright `aire-disclosure-registry-ux.spec.ts` — passed.
- [x] Playwright `candidate-parcel-options-presurvey.spec.ts` — passed.
- [x] Playwright `complete-presurvey-property-sheet-flow.spec.ts` — passed.
- [x] Playwright `desktop-auth-credential-fulfillment-smoke.spec.ts` — passed (bootstrap login, relaunch session restore, logout clear).
- [x] Playwright route regression set — `product-auth-functional-flow`, `product-ui-demo-alignment`, `product-navigation-ia`, `full-product-flow-ia-ux-acceptance` passed after static-export route fix.

## Desktop Evidence

- [x] macOS Tauri build completed.
- [x] macOS app bundle created: `src-tauri/target/release/bundle/macos/AIRE.app`
- [x] macOS DMG created: `src-tauri/target/release/bundle/dmg/AIRE_0.1.1_aarch64.dmg`
- [x] macOS installed app replaced at `/Applications/AIRE.app` with version `0.1.1`.
- [x] Old installed app preserved at `/Applications/AIRE-0.1.0-old-20260525-162121.app`.
- [x] macOS launch smoke process observed.
- [x] macOS launch screenshot: `artifacts/smoke/macos/desktop-fullflow-r02-cop-parity-clean-v2-launch.png`
- [x] macOS fullflow smoke: login, address-first case creation, workbench, PDF preview and PDF export.
- [x] macOS PDF preview screenshot: `artifacts/smoke/macos/desktop-fullflow-r02-cop-parity-0.1.1-pdf-preview.png`
- [x] macOS PDF artifact: `artifacts/smoke/macos/desktop-fullflow-r02-cop-parity-0.1.1-export.pdf`
- [x] Windows installer build from this exact commit.
- [x] Windows CI release run (commit `9453d12657a48399483c04eec16adc1a2a978bfa`): `https://github.com/fishtvlvoe/aire/actions/runs/26398171467`
- [x] Windows installer artifacts:
  - `AIRE_0.1.3_x64_en-US.msi`
  - `AIRE_0.1.3_x64-setup.exe`
- [x] Windows VM install and launch smoke from the GitHub Actions installer artifact.
- [ ] Windows fullflow PDF export evidence from this exact commit.

## Required Before Release Gate Can Be Marked Complete

- [x] Run `spectra analyze desktop-fullflow-r02-cop-parity --json`.
- [x] Run `spectra validate desktop-fullflow-r02-cop-parity`.
- [x] Run `spectra analyze desktop-fullflow-release-acceptance-gate --json`.
- [x] Run `spectra validate desktop-fullflow-release-acceptance-gate`.
- [x] Reduce all Critical and Warning findings to 0.
- [ ] Attach Windows install + launch + fullflow smoke evidence from VM or physical machine for this commit.

## desktop-local-address-to-cop-e2e Current Checklist — 2026-05-27

- [x] Local Web on `localhost:1420` proves registry pending creation after discovery failure.
- [x] Local Web proves manual registry completion can proceed to formal import.
- [x] Local Web proves formal import writes saved data before PDF preview.
- [x] Local Web proves cache hit creates zero-cost run with `sourceRunId`.
- [x] Local Web proves paid resolver is explicit, candidate-only, and separately logged.
- [x] Local Web fee records are object-oriented and drillable.
- [x] Local Web live discovery matrix is saved with zero-cost evidence.
- [x] PDF preview/export reads saved data and does not start a paid query.
- [x] macOS Desktop App wrapper launches with debug-only memory keyring and repeats the same source-of-truth workflow through `localhost:3000` E2E.
- [x] Windows UTM runtime install/launch is partially verified: `artifacts/smoke/windows/aire-windows-installed-launch-login-20260527.png`.
- [x] Windows GitHub Actions runtime smoke passed for the current branch: installer silent install + `AIRE 0.1.3` process/window observed in run `26518763313`.
- [x] Windows installer trust gate is automated in CI and produces metadata; latest run `26518763313` records `signing.status=unsigned`, `releaseStatus=internal-only`.
- [ ] Windows customer release requires Azure Artifact Signing secrets and valid publisher verification before the installer can be marked customer-release-ready.
- [ ] Windows fullflow still needs auth inside the installed Windows app, address-to-COP smoke, and PDF preview/export evidence.
