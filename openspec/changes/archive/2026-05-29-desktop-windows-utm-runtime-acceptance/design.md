# Design: Desktop Windows UTM Runtime Acceptance

## Context

AIRE Desktop targets Windows as the primary customer platform, but the current macOS development host can only prove local web and macOS Desktop App wrapper parity. The archived `desktop-local-address-to-cop-e2e` change recorded Windows runtime acceptance as blocked because no Windows VM, physical Windows device, or GUI runner was available in that session.

This change creates the missing Windows runtime path. GitHub Actions proves that a Windows installer can be built. UTM proves that the installed Windows app can launch and run the customer-facing smoke inside a real Windows environment. CrystalFetch is useful for obtaining the Windows 11 ARM64 ISO, but it is not an app runtime or acceptance tool.

## Approach

Use UTM as the Windows runtime on Apple Silicon macOS. Use CrystalFetch only to obtain the Windows 11 ARM64 ISO. Use GitHub Actions release/build workflow to produce the Windows installer for the exact commit being accepted, then install and run that artifact inside the VM.

## Runtime Options

| Option | Role | Decision |
| ------ | ---- | -------- |
| UTM + Windows 11 ARM64 | Primary local Windows runtime | Use first |
| CrystalFetch | Windows ISO acquisition helper | Use only for ISO download |
| GitHub Actions `windows-latest` | Windows packaging source | Use for installer build, not runtime acceptance |
| Parallels Desktop | Alternate local Windows runtime | Fallback if UTM is blocked |
| Windows 365 / Dev Box | Cloud Windows runtime | Fallback if local VM is blocked |
| Physical Windows PC | Manual acceptance runtime | Fallback if VM options are blocked |

## Flow

1. Verify host prerequisites: Apple Silicon macOS, disk space, UTM availability, CrystalFetch availability, GitHub CLI auth.
2. Obtain Windows 11 ARM64 ISO through CrystalFetch or record a blocker if ISO acquisition fails.
3. Create a UTM Windows VM with enough CPU, memory, disk, network, clipboard/file-transfer support, and display access for screenshots.
4. Produce or retrieve the Windows installer from GitHub Actions for the exact commit under test.
5. Record installer metadata: commit SHA, workflow run, artifact name, artifact URL or local path, installer filename, and checksum.
6. Install AIRE inside Windows.
7. Launch AIRE inside Windows and capture launch evidence.
8. Run the address-to-COP smoke from inside Windows.
9. Save evidence under `artifacts/smoke/windows/` and summarize it in `docs/release/desktop-fullflow-acceptance-report.md`.

## Acceptance Smoke

The minimum Windows smoke must prove the packaged Windows app can perform the same customer-facing path that passed on local web and macOS Desktop App:

- App process launches from the installed Windows artifact.
- The shell renders the AIRE UI, not a blank webview.
- Local Web parity route is reachable through the Desktop App wrapper.
- Address-to-COP smoke reaches the PDF preview/export step.
- Evidence includes screenshots from Windows and command/log output where available.

## Blocker Handling

If any step cannot run, create a blocker artifact under `artifacts/smoke/windows/` with:

- timestamp
- host facts
- attempted command or UI action
- observed failure
- impact on acceptance
- next concrete action

A blocker artifact keeps the CR honest, but it does not count as Windows runtime acceptance.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Windows ARM64 app dependency mismatch | Install inside UTM before claiming acceptance |
| GitHub Actions artifact does not match local dirty worktree | Use committed SHA or explicitly record local build provenance |
| UTM automation is limited | Use manual screenshot evidence plus structured blocker files when needed |
| Keychain or credential prompts block smoke | Use the same debug-only memory keyring path only for test builds, and record the env used |
