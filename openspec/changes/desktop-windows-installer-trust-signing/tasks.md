## 1. Evidence Baseline

- [ ] 1.1 Capture the current unsigned Windows installer warning screenshots in the UTM Windows VM for `SmartScreen warning classification`.
- [ ] 1.2 Record current installer provenance, sha256, signing status, SmartScreen observation, and Defender observation under artifacts/smoke/windows/trust/ for `Windows installer trust metadata`.
- [ ] 1.3 Confirm whether the warning is SmartScreen low reputation or a Defender malware detection with a concrete detection name for `SmartScreen warning classification`.

## 2. Signing Provider Decision

- [ ] 2.1 Choose Azure Artifact Signing or an equivalent trusted Windows code signing provider for `Customer release requires trusted code signing`.
- [ ] 2.2 Document required account setup, organization verification owner, expected lead time, and recurring cost in docs/release/windows-installer-trust.md.
- [ ] 2.3 Define GitHub Actions secret names and required permissions without committing secrets.

## 3. Release Pipeline Implementation

- [ ] 3.1 Update .github/workflows/release.yml so Windows installer signing runs after build and before release asset upload for `Tauri shell with Next.js frontend`.
- [ ] 3.2 Add script verification for installer sha256, signature chain, publisher subject, certificate thumbprint, timestamp, and metadata schema.
- [ ] 3.3 Ensure unsigned installer artifacts can still be used for internal smoke but are labeled internal-only.
- [ ] 3.4 Ensure signed installer artifacts are the only artifacts eligible for customer-release-ready status for `Customer release requires trusted code signing`.

## 4. Defender / SmartScreen Handling

- [ ] 4.1 Add release documentation explaining the difference between SmartScreen low reputation and Defender malware detection for `SmartScreen warning classification`.
- [ ] 4.2 Add a Microsoft Security Intelligence submission checklist for concrete Defender detections.
- [ ] 4.3 Record submission evidence path or submission id when a false positive review is needed.

## 5. Windows VM Acceptance

- [ ] 5.1 Install the signed release candidate inside the UTM Windows VM.
- [ ] 5.2 Capture installer UI evidence showing publisher and warning state.
- [ ] 5.3 Launch AIRE and capture first-screen evidence.
- [ ] 5.4 Run the address-to-COP smoke path if runtime prerequisites are available.
- [ ] 5.5 Keep runtime acceptance and installer trust acceptance as separate checklist results.

## 6. Release Documentation

- [ ] 6.1 Update docs/release/desktop-fullflow-acceptance-checklist.md with Windows installer trust gate status for `Release documents distinguish runtime acceptance from trust acceptance`.
- [ ] 6.2 Update docs/release/desktop-fullflow-acceptance-report.md with signed installer evidence and remaining limitations for `Release documents distinguish runtime acceptance from trust acceptance`.
- [ ] 6.3 Run spectra analyze desktop-windows-installer-trust-signing and resolve Critical/Major findings.
- [ ] 6.4 Run spectra validate desktop-windows-installer-trust-signing before implementation starts.
