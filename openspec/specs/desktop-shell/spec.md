# desktop-shell Specification

## Purpose

TBD - created by archiving change 'aire-desktop-phase1'. Update Purpose after archive.

## Requirements

### Requirement: Tauri shell with Next.js frontend

The system SHALL package a Tauri 2.x application that loads a Next.js 16 static export as its frontend, with frontendDist pointing to the exported `out/` directory.

#### Scenario: Build produces installer for Windows

- **WHEN** the developer runs `pnpm tauri build` on a Windows x64 host
- **THEN** an `.msi` installer is produced under `src-tauri/target/release/bundle/msi/`

#### Scenario: Build produces installer for macOS

- **WHEN** the developer runs `pnpm tauri build` on a macOS arm64 host
- **THEN** a `.dmg` installer is produced under `src-tauri/target/release/bundle/dmg/`

#### Scenario: Linux is not a target

- **WHEN** the developer attempts `pnpm tauri build --target linux`
- **THEN** the build configuration MUST omit Linux targets and emit an explicit message that Linux is unsupported

---
### Requirement: First-run window state

The system SHALL open with a single main window sized 1280x800 minimum, centered on screen, with a window title that includes the product name and current version (e.g., `AIRE 0.1.0`).

#### Scenario: First launch shows centered window

- **WHEN** the user launches the application for the first time
- **THEN** the main window appears at screen center with minimum dimensions 1280x800 and title `AIRE <version>`

---
### Requirement: IPC bridge between frontend and Rust

The system SHALL expose Tauri `invoke` commands as the only mechanism for the Next.js frontend to call into the Rust backend; the frontend MUST NOT use Next.js API routes or external HTTP for local data operations.

#### Scenario: Frontend calls Rust via invoke

- **WHEN** the frontend imports `invoke` from `@tauri-apps/api/core` and calls `invoke('list_cases')`
- **THEN** the corresponding Rust handler in `src-tauri/src/commands/cases.rs` executes and returns a serializable result

#### Scenario: Static export omits API routes

- **WHEN** Next.js builds with `output: 'export'`
- **THEN** the build MUST fail if any file under `src/app/api/` exists

---
### Requirement: Application data directory

The system SHALL store all persistent data (SQLite DB, logs, generated PDFs not yet moved by the user) under the OS-standard application data directory.

##### Example: data directory paths

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/aire/` |
| Windows | `%APPDATA%\aire\` |

#### Scenario: Data directory created on first launch

- **WHEN** the user launches the application for the first time
- **THEN** the OS-standard data directory exists and contains an empty `aire.db` plus a `logs/` subdirectory
