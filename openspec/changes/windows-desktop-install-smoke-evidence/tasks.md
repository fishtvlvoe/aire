## 1. Spectra artifacts

- [x] 1.1 Define Requirement: Windows Desktop installer smoke evidence and Requirement: Tauri shell with Next.js frontend update; verify with `spectra analyze windows-desktop-install-smoke-evidence --json` and `spectra validate windows-desktop-install-smoke-evidence`.

## 2. Windows native install smoke

- [ ] 2.1 Implement Decision 1: Use GitHub-hosted Windows as repeatable VM evidence and add `scripts/windows-desktop-smoke.ps1` so Windows CI can install the generated MSI, launch AIRE, capture process/window metadata and screenshot; verify locally with PowerShell syntax parse or in CI with generated artifacts.
- [ ] 2.2 Implement Decision 2: Install the just-built MSI in the same run and Decision 3: Separate native launch evidence from product fullflow evidence by adding `.github/workflows/windows-desktop-smoke.yml` and wiring the same steps into `.github/workflows/release.yml`; verify with `gh workflow run release.yml`.

## 3. Evidence and handoff

- [ ] 3.1 Update the desktop smoke report to replace the Windows gap note with Windows CI installer smoke evidence and artifact paths; verify report references the workflow and required files.
- [ ] 3.2 Run final validation (`spectra analyze`, `spectra validate`, relevant tests) and commit/push the clean branch.
