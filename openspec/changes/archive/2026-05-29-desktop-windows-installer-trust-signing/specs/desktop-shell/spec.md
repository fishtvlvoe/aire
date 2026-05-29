# desktop-shell Specification Delta

## MODIFIED Requirements

### Requirement: Tauri shell with Next.js frontend

The system SHALL package a Tauri 2.x application that loads a Next.js 16 static export as its frontend, with frontendDist pointing to the exported out/ directory. Windows installer release candidates SHALL include release trust metadata and SHALL NOT be marked customer-release-ready unless the Windows installer trust gate passes.

#### Scenario: Build produces installer for Windows

- **WHEN** the developer runs pnpm tauri build on a Windows x64 host
- **THEN** an MSI or EXE installer is produced under src-tauri/target/release/bundle/
- **AND** release trust metadata is generated before the installer is promoted as a release candidate

#### Scenario: Customer release is blocked until installer trust passes

- **WHEN** the Windows installer can be installed and launched but lacks trusted code signing verification
- **THEN** the desktop-shell release status remains internal-only
- **AND** customer release remains blocked by the windows-installer-trust gate

##### Example: launch evidence without signing

- **GIVEN** Windows launch evidence `artifacts/smoke/windows/aire-windows-installed-launch-login-20260527.png`
- **AND** signing verification result `unsigned`
- **WHEN** the release report is generated
- **THEN** desktop-shell Windows status is `internal-only`
