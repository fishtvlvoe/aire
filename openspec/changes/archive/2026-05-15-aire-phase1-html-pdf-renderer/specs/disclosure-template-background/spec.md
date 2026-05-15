# disclosure-template-background (delta)

## REMOVED Requirements

### Requirement: Admin uploads and manages disclosure template background images

**Reason**: The PNG template-background approach is replaced by the React-component-based theme system. There is no longer a single uploaded background image; instead, each theme pack draws its own background styling through React components (header band, footer band, decorative borders, gradient zones) declared in `src/lib/pdf-themes/<theme>/index.tsx`. Admin upload is replaced by theme selection.

**Migration**: Existing admin-upload UI is removed in favor of `ThemeSelector` in `src/components/ThemeSelector.tsx`. The previously stored background images are abandoned (PNG files in `src/resources/templates/` are deleted). The admin role now uses theme selection plus customer logo upload (`customer-logo-upload` capability) instead of arbitrary template image upload. Customer-facing visual customization in Phase 2 will go through additional theme packs (補充包) per the architecture in `pdf-theme-system` capability.

#### Scenario: Removed — admin template-upload UI no longer exists

- **WHEN** an admin opens the settings area after this change is applied
- **THEN** there is no "上傳底圖" UI element anywhere in the admin settings and the only branding controls visible are `ThemeSelector` (主題選擇) and `LogoUploader` (公司 Logo 上傳)

## ADDED Requirements

### Requirement: Theme components SHALL replace PNG template background

The system SHALL draw all disclosure document background visuals (header band, footer band, decorative borders, gradient zones, AI badge frame) through React PDF components inside theme packs registered with the `pdf-theme-system` capability. The system SHALL NOT load any PNG or JPG background image at PDF render time.

#### Scenario: Render does not load template PNG files

- **WHEN** a disclosure PDF renders end-to-end
- **THEN** no file under `src/resources/templates/` is opened for reading during the render (verified by file-system monitoring or by confirming the templates directory does not exist in the new build)

#### Scenario: Theme A draws minimal background components

- **WHEN** theme-a-minimal renders a page
- **THEN** the page contains a thin top border `View` with the theme's primary color and no other background imagery (verified by inspecting the rendered React PDF tree for the theme's `Header` and `Footer` components)

#### Scenario: Theme C draws tech-elegant background components

- **WHEN** theme-c-tech-elegant renders a page
- **THEN** the page contains a top-left diagonal accent `View`, a gradient header `View`, and a gold border line `View` (verified by inspecting the rendered React PDF tree)

### Requirement: AI badge SHALL be drawn by every theme as a fixed identity mark

The system SHALL include in every theme an `AiBadge` rendering at the top-right of every page header. The badge SHALL be styled per theme (theme-a uses solid blue circle, theme-c uses green-blue gradient circle) but SHALL always contain the text "AI" and SHALL always be present (themes cannot opt out).

#### Scenario: AI badge appears on every page for every theme

- **WHEN** any disclosure PDF renders with any registered theme
- **THEN** every page contains exactly one rendered Text node whose content equals "AI" inside a circular View at the top-right of the page header

### Requirement: Customer logo SHALL coexist with theme background without overlap

The system SHALL anchor the customer logo at predetermined coordinates (cover 80×30mm, header 25×15mm — per the `customer-logo-upload` capability) and SHALL define theme components such that no background component overlaps either logo anchor in any built-in theme.

#### Scenario: Theme A leaves logo anchors clear

- **WHEN** theme-a-minimal renders the cover
- **THEN** no background `View` from the theme overlaps the 80×30mm cover logo anchor (verified by computed layout box intersection check)

#### Scenario: Theme C leaves header logo anchor clear

- **WHEN** theme-c-tech-elegant renders any page
- **THEN** no background `View` from the theme overlaps the 25×15mm header logo anchor
