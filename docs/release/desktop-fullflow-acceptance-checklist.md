# Desktop Fullflow Acceptance Checklist

Date: 2026-05-25
Branch: `feat/desktop-fullflow-r02-cop-parity-clean-v2`

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

- [x] `pnpm test` — 122 files / 645 tests passed.
- [x] `pnpm type-check` — passed.
- [x] `pnpm build` — passed.
- [x] Playwright `product-auth-functional-flow.spec.ts` — passed.
- [x] Playwright `product-ui-demo-alignment.spec.ts` — passed.
- [x] Playwright `aire-disclosure-registry-ux.spec.ts` — passed.
- [x] Playwright `candidate-parcel-options-presurvey.spec.ts` — passed.
- [x] Playwright `complete-presurvey-property-sheet-flow.spec.ts` — passed.

## Desktop Evidence

- [x] macOS Tauri build completed.
- [x] macOS app bundle created: `src-tauri/target/release/bundle/macos/AIRE.app`
- [x] macOS DMG created: `src-tauri/target/release/bundle/dmg/AIRE_0.1.0_aarch64.dmg`
- [x] macOS launch smoke process observed.
- [x] macOS launch screenshot: `artifacts/smoke/macos/desktop-fullflow-r02-cop-parity-clean-v2-launch.png`
- [ ] Windows installer build from this exact commit.
- [ ] Windows VM/physical install and launch smoke from this exact commit.
- [ ] Windows fullflow PDF export evidence from this exact commit.

## Required Before Release Gate Can Be Marked Complete

- [ ] Run `spectra analyze desktop-fullflow-r02-cop-parity --json`.
- [ ] Run `spectra validate desktop-fullflow-r02-cop-parity`.
- [ ] Run `spectra analyze desktop-fullflow-release-acceptance-gate --json`.
- [ ] Run `spectra validate desktop-fullflow-release-acceptance-gate`.
- [ ] Reduce all Critical and Warning findings to 0.
- [ ] Attach Windows installer/smoke evidence from VM, physical machine, or CI for this commit.
