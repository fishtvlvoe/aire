## ADDED Requirements

### Requirement: UTM Windows runtime acceptance

The project SHALL use a real Windows runtime before marking Windows Desktop acceptance as passed. For the primary local route, the runtime SHALL be Windows 11 ARM64 running in UTM on Apple Silicon macOS.

#### Scenario: Runtime evidence is captured

- **WHEN** the Windows Desktop acceptance is executed through UTM
- **THEN** the evidence SHALL include Windows screenshots or logs proving the installed app launched inside the VM

##### Example: UTM launch evidence

- **GIVEN** VM `AIRE-Windows-11-ARM64` and installer `AIRE_0.1.0_x64-setup.exe`
- **WHEN** the installed app launches in Windows
- **THEN** evidence includes `artifacts/smoke/windows/aire-windows-launch-20260527.png`

#### Scenario: Runtime is unavailable

- **WHEN** UTM, Windows 11 ARM64, or a usable Windows VM is unavailable
- **THEN** the change SHALL record a blocker artifact instead of marking Windows Desktop acceptance as passed

### Requirement: CrystalFetch is ISO-only

The project SHALL treat CrystalFetch as a Windows ISO acquisition helper only. CrystalFetch output SHALL NOT be recorded as Windows Desktop runtime acceptance.

#### Scenario: ISO is downloaded with CrystalFetch

- **WHEN** CrystalFetch downloads a Windows 11 ARM64 ISO
- **THEN** the evidence SHALL record the ISO filename and checksum separately from runtime acceptance evidence

#### Scenario: CrystalFetch succeeds without VM execution

- **WHEN** CrystalFetch succeeds but the AIRE Windows installer has not launched inside Windows
- **THEN** Windows Desktop runtime acceptance SHALL remain incomplete

##### Example: ISO only is incomplete

- **GIVEN** ISO `Win11_24H2_EnglishInternational_Arm64.iso`
- **WHEN** no Windows VM launch evidence exists
- **THEN** the checklist marks ISO acquisition complete and Windows runtime acceptance incomplete

### Requirement: Windows installer provenance

The Windows acceptance run SHALL record installer provenance for the exact build being tested, including commit SHA, source workflow or local build path, artifact name, installer filename, and checksum.

#### Scenario: Installer comes from GitHub Actions

- **WHEN** the Windows installer is downloaded from GitHub Actions
- **THEN** the evidence SHALL include the workflow run identifier, commit SHA, artifact name, installer filename, and checksum

##### Example: Release workflow artifact

- **GIVEN** workflow run `26398171467` and commit `3104c927`
- **WHEN** artifact `windows-x64-installer` is downloaded
- **THEN** evidence records the run id, commit SHA, artifact name, installer filename, and SHA-256 checksum

#### Scenario: Installer comes from a local build

- **WHEN** the Windows installer is produced locally or manually copied into the VM
- **THEN** the evidence SHALL include the local path, commit SHA or dirty-worktree marker, installer filename, and checksum

##### Example: Dirty worktree marker

- **GIVEN** local path `src-tauri/target/release/bundle/nsis/AIRE_0.1.0_x64-setup.exe`
- **WHEN** `git status --porcelain` is not empty
- **THEN** evidence records `dirty-worktree=true` with the installer checksum

### Requirement: Address-to-COP smoke inside Windows

The Windows runtime acceptance SHALL execute the address-to-COP smoke inside the installed Windows Desktop App and capture the final PDF preview or export evidence.

#### Scenario: Address-to-COP smoke passes

- **WHEN** the installed Windows app completes the address-to-COP smoke
- **THEN** the evidence SHALL include the Windows screenshot or log showing the PDF preview or export step

##### Example: PDF preview reached

- **GIVEN** the installed Windows app is running inside UTM
- **WHEN** the address-to-COP smoke reaches the PDF preview route
- **THEN** evidence includes `artifacts/smoke/windows/address-to-cop-pdf-preview-20260527.png`

#### Scenario: Address-to-COP smoke is blocked

- **WHEN** the installed Windows app launches but the address-to-COP smoke cannot reach the PDF preview or export step
- **THEN** the change SHALL record the failing step, observed message, and next concrete action in a blocker artifact

##### Example: Flow blocker

- **GIVEN** the installed Windows app launches
- **WHEN** registry lookup cannot run because credentials are missing
- **THEN** evidence includes `artifacts/smoke/windows/address-to-cop-blocker-20260527.json`
