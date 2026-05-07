## ADDED Requirements

### Requirement: App icon asset generation

The system SHALL include a build-time script (`scripts/generate-icons.ts`) that converts a single 1024x1024 PNG source icon into `.icns` (macOS) and `.ico` (Windows) formats using the `png2icons` npm package.

#### Scenario: Generate icons from source PNG

- **WHEN** developer runs `npx tsx scripts/generate-icons.ts`
- **THEN** the script SHALL read `build/icon.png` (1024x1024 PNG) and produce `build/icon.icns` and `build/icon.ico` in the same directory

#### Scenario: Source PNG missing

- **WHEN** `build/icon.png` does not exist
- **THEN** the script SHALL exit with code 1 and print "Error: build/icon.png not found"

#### Scenario: Source PNG wrong dimensions

- **WHEN** `build/icon.png` exists but is not 1024x1024
- **THEN** the script SHALL exit with code 1 and print "Error: icon must be 1024x1024 pixels"

### Requirement: App icon design specification

The source icon (`build/icon.png`) SHALL use the following visual identity:
- Deep navy blue (#1a365d) background
- White foreground element depicting a stylized building silhouette with AI circuit pattern
- 1024x1024 pixels, PNG format with transparency

#### Scenario: Icon visual identity

- **WHEN** icon is displayed in macOS Dock, Windows taskbar, or installer splash
- **THEN** the icon SHALL be visually distinguishable at 16x16, 32x32, 128x128, 256x256, 512x512, and 1024x1024 sizes
