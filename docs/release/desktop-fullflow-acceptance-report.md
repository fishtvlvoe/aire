# Desktop Fullflow Acceptance Report

Date: 2026-05-25
Branch: `feat/desktop-fullflow-r02-cop-parity-clean-v2`

## Result

`desktop-fullflow-r02-cop-parity` implementation is functionally validated on web/E2E and macOS Desktop App `0.1.1` fullflow smoke. The release gate is not complete until Windows installer and fullflow smoke evidence is collected for this commit.

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

- `pnpm test`: passed, 122 files / 646 tests.
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
- `spectra analyze desktop-fullflow-r02-cop-parity --json`: Critical 0 / Warning 0; 14 Suggestions remain for example-level spec clarity.
- `spectra validate desktop-fullflow-r02-cop-parity`: valid.
- `spectra analyze desktop-fullflow-release-acceptance-gate --json`: Critical 0 / Warning 0 / Suggestions 0.
- `spectra validate desktop-fullflow-release-acceptance-gate`: valid.

## Artifacts

- macOS app: `src-tauri/target/release/bundle/macos/AIRE.app`
- macOS DMG: `src-tauri/target/release/bundle/dmg/AIRE_0.1.1_aarch64.dmg`
- macOS launch screenshot: `artifacts/smoke/macos/desktop-fullflow-r02-cop-parity-clean-v2-launch.png`
- macOS PDF preview screenshot: `artifacts/smoke/macos/desktop-fullflow-r02-cop-parity-0.1.1-pdf-preview.png`
- macOS PDF artifact: `artifacts/smoke/macos/desktop-fullflow-r02-cop-parity-0.1.1-export.pdf` (`PDF document, version 1.3, 18 pages`)
- Playwright screenshots: `e2e/results/demo-alignment/*.png`
- Playwright navigation screenshots: `e2e/results/navigation-ia/*.png`
- Desktop auth smoke artifacts: `e2e/results/test-artifacts/desktop-auth-credential-fu-*/`
- Playwright report: `e2e/results/playwright-report/index.html`

## Known Gap

Windows install/start/fullflow/PDF evidence has not been executed in this macOS terminal session. Do not mark `desktop-fullflow-release-acceptance-gate` complete and do not start `desktop-auto-update-macos-windows` until Windows evidence exists for this commit.
