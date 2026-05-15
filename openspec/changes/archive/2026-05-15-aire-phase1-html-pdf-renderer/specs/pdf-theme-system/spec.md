# pdf-theme-system Specification

## Purpose

Provide a pluggable theme system that ships two themes (A minimal + C tech-elegant) for MVP and exposes a registration API so future Phase 2 theme packs can add new themes without modifying core code.

## ADDED Requirements

### Requirement: System SHALL ship two built-in themes (A minimal + C tech-elegant)

The system SHALL include exactly two built-in themes registered at module load: theme id `theme-a-minimal` (display name "淡雅") and theme id `theme-c-tech-elegant` (display name "科技優雅"). Each theme SHALL provide all five required components (Cover, Header, Footer, Section, Table) and a complete `tokens` object (colors, spacing, fontSize).

#### Scenario: Both built-in themes are registered after module load

- **WHEN** `listThemes()` is called after the registry module loads
- **THEN** the returned array contains exactly two theme objects with ids `theme-a-minimal` and `theme-c-tech-elegant`

#### Scenario: Each theme provides all required components

- **WHEN** the test iterates over the registered themes and inspects each theme object
- **THEN** every theme has truthy `Cover`, `Header`, `Footer`, `Section`, `Table` React component references AND a `tokens` object with non-empty `colors`, `spacing`, `fontSize` maps

### Requirement: System SHALL expose registerTheme / getTheme / listThemes APIs

The system SHALL provide three pure functions on `src/lib/pdf-themes/registry.ts`: `registerTheme(theme: PdfTheme): void` (idempotent on duplicate id), `getTheme(id: string): PdfTheme | undefined`, `listThemes(): PdfTheme[]`. The registry state SHALL live in module scope and SHALL NOT require React context.

#### Scenario: Registering a new theme makes it discoverable

- **WHEN** the test calls `registerTheme({ id: 'theme-test', displayName: 'Test', /* full PdfTheme */ })` and then `listThemes()`
- **THEN** the returned array contains an entry whose id equals 'theme-test' AND `getTheme('theme-test')` returns the same object reference

#### Scenario: Re-registering an existing id replaces the previous theme

- **WHEN** the test calls `registerTheme({ id: 'theme-a-minimal', displayName: 'Override', /* full PdfTheme */ })`
- **THEN** subsequent `getTheme('theme-a-minimal')` returns the override object AND `listThemes()` still has only one entry with that id

### Requirement: ThemeProvider SHALL inject theme into PDF Document tree

The system SHALL provide a `<ThemeProvider theme={theme}>` React component that injects the theme into descendant PDF block components via React context. PDF block components SHALL consume the theme via a `useTheme()` hook and SHALL throw a typed error if used outside ThemeProvider.

#### Scenario: Block component reads theme via useTheme

- **WHEN** a `<Cover>` block is rendered inside `<ThemeProvider theme={themeA}>`
- **THEN** the rendered Cover uses `themeA.tokens.colors.primary` for the title color (verified by inspecting the rendered React tree)

#### Scenario: useTheme outside provider throws typed error

- **WHEN** a block component calls `useTheme()` without a ThemeProvider ancestor
- **THEN** the call throws `ThemeError::ProviderMissing` with the message "PdfTheme not found in context — wrap the document in <ThemeProvider>"

### Requirement: Theme switch SHALL persist via Tauri IPC and re-render preview

The system SHALL expose a `set_theme(theme_id)` Tauri IPC command that writes the selected `theme_id` to the `branding` SQLite table and SHALL trigger a re-render of any open PDF preview UI by emitting a `branding-changed` Tauri event.

#### Scenario: set_theme writes to SQLite and emits event

- **WHEN** the test calls `invoke('set_theme', { themeId: 'theme-c-tech-elegant' })`
- **THEN** the next `invoke('get_theme')` call returns 'theme-c-tech-elegant' AND a `branding-changed` event is observed on the Tauri event bus within 100ms

### Requirement: Unknown theme id SHALL fall back to theme-a-minimal with warning

The system SHALL detect when `getTheme(id)` returns undefined for a stored `theme_id` (e.g., an uninstalled theme pack) and SHALL fall back to `theme-a-minimal` for rendering, emitting a console warning and showing a non-blocking UI banner "主題已不存在，已切換至預設主題".

#### Scenario: Missing theme id falls back gracefully

- **WHEN** the SQLite branding row contains `theme_id = 'theme-uninstalled'` and the user opens PDF preview
- **THEN** the preview renders using `theme-a-minimal` AND the UI shows a banner with text "主題已不存在，已切換至預設主題" AND a console warning is logged with the missing theme id

### Requirement: Theme pack documentation SHALL define the public contract

The system SHALL ship `docs/pdf-theme-pack-spec.md` documenting the `PdfTheme` TypeScript interface, the five required components and their props contracts, the tokens shape, and a worked example of registering a new theme. This document is the durable handoff for Phase 2 third-party theme pack authors.

#### Scenario: Theme pack spec documents the full contract

- **WHEN** the file `docs/pdf-theme-pack-spec.md` is rendered
- **THEN** it contains all the following section headings: "## PdfTheme 介面", "## 五個必要元件", "## tokens 物件", "## 註冊範例", "## 版本相容性"
