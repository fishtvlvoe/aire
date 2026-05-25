## Why

`desktop-fullflow-r02-cop-parity` already produces macOS local smoke evidence and Windows CI packaging artifacts, but the report still says Windows install-and-run evidence is missing. Before the Desktop fullflow release can be accepted, the Windows path needs repeatable proof that the generated installer installs, launches AIRE, and leaves auditable logs/screenshots.

## What Changes

- Add a Windows installer smoke workflow that builds the Windows Desktop artifact, installs the generated MSI, launches the installed app, captures process/window evidence, and uploads smoke artifacts.
- Add a PowerShell smoke script for Windows launch evidence: installer log, process metadata, window metadata, and desktop screenshot.
- Update the release smoke report so Windows CI installer smoke is recorded as evidence instead of a known gap.
- Keep the existing complete Playwright fullflow as the product workflow/PDF evidence for the same branch.

## Non-Goals

- Do not implement SaaS parity.
- Do not claim browser E2E is native WebView automation.
- Do not require a physical Windows machine for this CR; GitHub-hosted `windows-latest` is the repeatable Windows CI/VM evidence source.
- Do not change customer-facing product behavior.

## Capabilities

### New Capabilities

- `windows-desktop-install-smoke-evidence`: Windows Desktop installer smoke evidence is generated and archived for release acceptance.

### Modified Capabilities

- `desktop-shell`: Windows installer verification includes install, launch, screenshot and metadata artifacts.

## Impact

- Affected specs: desktop-shell, windows-desktop-install-smoke-evidence
- Affected code:
  - New: .github/workflows/windows-desktop-smoke.yml, scripts/windows-desktop-smoke.ps1, openspec/changes/windows-desktop-install-smoke-evidence/specs/windows-desktop-install-smoke-evidence/spec.md
  - Modified: .github/workflows/release.yml, artifacts/smoke/2026-05-25-desktop-fullflow-r02-cop-parity-smoke-report.md
  - Removed: none
