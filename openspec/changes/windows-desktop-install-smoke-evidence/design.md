## Context

The existing release workflow proves that Windows packages can be built and uploaded, but it does not prove that the installer can be installed and launched on Windows. The acceptance gap is evidence, not product behavior.

## Decisions

### Decision 1: Use GitHub-hosted Windows as repeatable VM evidence

Windows acceptance for this CR uses `windows-latest` because it is available to every run, records job logs, and can publish artifacts. Physical Windows UAT can still be added later, but it is not required for this repeatable CI smoke.

### Decision 2: Install the just-built MSI in the same run

The smoke workflow SHALL build the Windows bundle and install the MSI produced in that run. It SHALL NOT download an older draft release artifact, because release URLs can drift and would weaken traceability.

### Decision 3: Separate native launch evidence from product fullflow evidence

Native launch evidence SHALL prove MSI install and installed app startup with process/window metadata and screenshot. The complete case-to-PDF workflow SHALL continue to use Playwright against the same branch/build path and SHALL be reported as product fullflow/PDF evidence, not native WebView automation.

## Implementation Contract

- The workflow `windows-desktop-smoke.yml` SHALL run on `workflow_dispatch` and pull requests that touch Windows smoke or desktop packaging files.
- The workflow SHALL build a Windows MSI, fail if no MSI exists, and upload installer artifacts.
- The script `scripts/windows-desktop-smoke.ps1` SHALL accept `InstallerPath` and `OutputDir`.
- The script SHALL run `msiexec` with a log file, find the installed `AIRE.exe`, launch it, capture process/window metadata, capture `launch.png`, and stop the process.
- The smoke artifact directory SHALL include `install.log`, `process.json`, `window.json`, and `launch.png`.
- The smoke report SHALL record the workflow name, artifact files, and that Windows CI installer smoke is the Windows VM evidence source.

## Risks

- A GitHub-hosted Windows runner may not expose an interactive desktop in the same way as a customer VM. The mitigation is to treat this as CI/VM installer smoke and keep physical UAT as an optional later artifact.
- MSI install paths can vary. The script will first check common current-user install locations, then search `%LOCALAPPDATA%` for `AIRE.exe`.
