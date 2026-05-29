## MODIFIED Requirements

### Requirement: Tauri shell with Next.js frontend

The system SHALL package a Tauri 2.x application that loads a Next.js 16 static export as its frontend, with frontendDist pointing to the exported `out/` directory.

#### Scenario: Build produces MSI installer for Windows

- **WHEN** the developer runs `pnpm tauri build` on a Windows x64 host
- **THEN** an `.msi` installer is produced under `src-tauri/target/release/bundle/msi/`
- **THEN** an `.exe` installer (NSIS) is also produced under `src-tauri/target/release/bundle/nsis/`
- **THEN** the `.msi` installer is the recommended distribution format for Windows users

#### Scenario: Build produces installer for macOS

- **WHEN** the developer runs `pnpm tauri build` on a macOS arm64 host
- **THEN** a `.dmg` installer is produced under `src-tauri/target/release/bundle/dmg/`

#### Scenario: Linux is not a target

- **WHEN** the developer attempts `pnpm tauri build --target linux`
- **THEN** the build configuration MUST omit Linux targets and emit an explicit message that Linux is unsupported
