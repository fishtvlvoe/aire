# Tasks: Desktop Windows UTM Runtime Acceptance

## 1. Spectra setup

- [ ] 1.1 Validate proposal, design, specs, and tasks with `spectra analyze desktop-windows-utm-runtime-acceptance`.
- [ ] 1.2 Validate the change with `spectra validate desktop-windows-utm-runtime-acceptance`.

## 2. Host prerequisites

- [x] 2.1 Confirm macOS host architecture, available disk space, GitHub CLI auth, and current git SHA.
- [x] 2.2 Check whether UTM, `utmctl`, and CrystalFetch are installed.
- [x] 2.3 If UTM or CrystalFetch is missing, install or record the exact blocker and next action.

## 3. Windows VM preparation

- [x] 3.1 Download the Windows 11 ARM64 ISO through CrystalFetch.
- [x] 3.2 Satisfy `CrystalFetch is ISO-only` by recording ISO filename, source, and checksum under `artifacts/smoke/windows/` without marking runtime acceptance complete.
- [x] 3.3 Create a UTM Windows 11 ARM64 VM with network access and screenshot/file-transfer capability.
- [x] 3.4 Satisfy `UTM Windows runtime acceptance` by capturing VM configuration and Windows launch evidence under `artifacts/smoke/windows/`.

## 4. Installer provenance

- [x] 4.1 Trigger or select the GitHub Actions Windows build for the exact commit under test.
- [x] 4.2 Satisfy `Windows installer provenance` by downloading the Windows installer artifact and recording workflow run, commit SHA, artifact name, filename, and checksum.
- [x] 4.3 If the current worktree is dirty and not represented by the artifact, record that mismatch before running acceptance.
- [x] 4.4 Satisfy `Windows runtime acceptance must be distinct from packaging` by recording GitHub Actions build success as packaging evidence only until the installed app launches inside Windows.

## 5. Windows runtime smoke

- [x] 5.1 Install the AIRE Windows artifact inside the UTM VM.
- [x] 5.2 Launch the installed Windows Desktop App and capture evidence that the UI renders.
- [ ] 5.3 Satisfy `Address-to-COP smoke inside Windows` by running the address-to-COP smoke inside Windows.
- [ ] 5.4 Capture PDF preview/export evidence from inside Windows.
- [x] 5.5 If any step fails, create a blocker artifact with the failing step, observed failure, impact, and next concrete action.
- [x] 5.6 If UTM interaction is unstable or captures the user's input devices, run `.github/workflows/windows-runtime-smoke.yml` on `windows-latest` and use the uploaded artifact as non-interactive Windows installer/runtime evidence.
- [x] 5.7 Run `release.yml` on the current branch and confirm the freshly built Windows installer installs and launches on `windows-latest` (`26513341136`).

## 6. Release evidence

- [x] 6.1 Update `docs/release/desktop-fullflow-acceptance-report.md` with Windows UTM runtime evidence or blocker status.
- [x] 6.2 Update `docs/release/desktop-fullflow-acceptance-checklist.md` with the Windows runtime result.
- [x] 6.3 Run `spectra analyze desktop-windows-utm-runtime-acceptance --json` and `spectra validate desktop-windows-utm-runtime-acceptance`.
