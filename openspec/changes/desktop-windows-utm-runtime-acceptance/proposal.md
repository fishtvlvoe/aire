# Change: Desktop Windows UTM Runtime Acceptance

## Summary

Create a dedicated acceptance change for validating the AIRE Desktop Windows build inside a real Windows 11 ARM64 runtime on macOS using UTM. GitHub Actions remains the installer source, CrystalFetch is only the Windows ISO acquisition helper, and UTM is the runtime environment where the Windows app must actually launch and run the address-to-COP smoke.

## Problem

The previous desktop-local-address-to-cop-e2e change reached local web and macOS Desktop App parity, but Windows runtime acceptance remained blocked because this macOS host does not currently have a Windows VM, physical Windows device, or Windows GUI runner. A successful GitHub Actions Windows build proves packaging, not runtime behavior.

## Goals

- Establish a repeatable UTM-based Windows 11 ARM64 acceptance path on this Mac.
- Use GitHub Actions to produce or retrieve the Windows installer for the exact commit under test.
- Install and launch the AIRE Windows app inside the UTM VM.
- Run the address-to-COP acceptance smoke inside Windows and capture evidence.
- Record blockers explicitly when ISO, VM setup, installer retrieval, app launch, or flow execution fails.

## Non-Goals

- Do not claim Windows acceptance from GitHub Actions build success alone.
- Do not replace macOS Desktop App parity testing.
- Do not implement auto-update acceptance in this change.
- Do not publish a customer release installer until the Windows runtime evidence is complete.

## Capabilities

- desktop-windows-utm-runtime-acceptance (new)
- desktop-shell (modified)

## Acceptance Criteria

- The change records the chosen Windows runtime path as UTM + Windows 11 ARM64.
- The change records CrystalFetch only as the ISO acquisition path, not as an acceptance tool.
- The change records the Windows installer source, commit SHA, artifact URL or local path, and checksum.
- The change captures Windows launch evidence from inside the VM.
- The change captures address-to-COP smoke evidence from inside the VM or a blocker artifact explaining the exact remaining obstacle.
- `spectra analyze desktop-windows-utm-runtime-acceptance` and `spectra validate desktop-windows-utm-runtime-acceptance` pass before implementation is considered ready.
