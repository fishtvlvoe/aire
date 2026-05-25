# Desktop Fullflow Acceptance Report

Date: 2026-05-25
Branch: `feat/desktop-fullflow-r02-cop-parity-clean-v2`

## Result

`desktop-fullflow-r02-cop-parity` implementation is functionally validated on web/E2E and macOS build/launch smoke. The release gate is not complete until Windows installer and fullflow smoke evidence is collected for this commit.

## Implementation Summary

- `/cases/new` now redirects successful login and acts as the address-first workflow entry.
- Address lookup fills section, land number and building number where available; missing fields block case creation and formal lookup.
- Customer-facing copy hides implementation terms in normal workflow.
- Query records show audit/cost/cache/error metadata, with raw details only behind management expansion.
- System Settings centralizes plan, trial, license and registry-account status.
- Formal lookup cache hits record zero cost and preserve `sourceRunId`.
- PDF assembly uses saved trusted registry data and does not start paid lookup during preview/export.
- A separate SR was opened for Desktop auth credential fulfillment and persistent device sessions: `desktop-auth-credential-fulfillment-smoke`.

## Verification

- `pnpm test`: passed, 122 files / 645 tests.
- `pnpm type-check`: passed.
- `pnpm build`: passed.
- `pnpm tauri:build`: passed with Rust warnings only.
- `E2E_BASE_URL=http://localhost:3000 pnpm exec playwright test e2e/product-auth-functional-flow.spec.ts --reporter=line --timeout=90000`: passed.
- `E2E_BASE_URL=http://localhost:3000 pnpm exec playwright test e2e/product-ui-demo-alignment.spec.ts --reporter=line --timeout=90000`: passed.
- `E2E_BASE_URL=http://localhost:3000 pnpm exec playwright test e2e/aire-disclosure-registry-ux.spec.ts e2e/candidate-parcel-options-presurvey.spec.ts e2e/complete-presurvey-property-sheet-flow.spec.ts --reporter=line --timeout=120000`: passed.

## Artifacts

- macOS app: `src-tauri/target/release/bundle/macos/AIRE.app`
- macOS DMG: `src-tauri/target/release/bundle/dmg/AIRE_0.1.0_aarch64.dmg`
- macOS launch screenshot: `artifacts/smoke/macos/desktop-fullflow-r02-cop-parity-clean-v2-launch.png`
- Playwright screenshots: `e2e/results/demo-alignment/*.png`
- Playwright report: `e2e/results/playwright-report/index.html`

## Known Gap

Windows install/start/fullflow/PDF evidence has not been executed in this macOS terminal session. Do not mark `desktop-fullflow-release-acceptance-gate` complete and do not start `desktop-auto-update-macos-windows` until Windows evidence exists for this commit.
