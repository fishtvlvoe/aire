# Real Estate Management Design System: High-End Editorial Guidelines

## 1. Overview & Creative North Star: "The Architectural Curator"

Most property management systems feel like cluttered spreadsheets. This design system rejects that. Our Creative North Star is **"The Architectural Curator."** 

We treat the UI as a digital floor plan—spatial, balanced, and premium. We break the "generic dashboard" mold by utilizing **intentional white space, tonal layering, and sophisticated typography scales.** The goal is to make the user feel like they are managing a luxury portfolio, not a database. We favor breathability over density and use "Visual Silence" to highlight the most critical data points.

---

## 2. Color & Surface Philosophy

Our palette is anchored in stability (`primary: #002444`) and punctuated by action (`tertiary: #E87B3A`).

### The "No-Line" Rule
**Explicit Instruction:** You are prohibited from using 1px solid borders to section off content. Boundaries must be defined solely through background color shifts. 
- Use `surface_container_low` (#f3f3f3) for the page background.
- Use `surface_container_lowest` (#ffffff) for the primary content cards.
- The distinction between these two tones is the "line." 

### Surface Hierarchy & Nesting
Treat the UI as physical layers of fine paper.
- **Level 0 (Base):** `surface` (#f9f9f9) - The canvas.
- **Level 1 (Sections):** `surface_container` (#eeeeee) - Grouping related content blocks.
- **Level 2 (Active Cards):** `surface_container_lowest` (#ffffff) - High-focus data areas.

### The Glass & Signature Texture
To prevent a "flat" feel, use **Glassmorphism** for floating navigation or quick-action bars. Use `surface_container_lowest` at 80% opacity with a `20px` backdrop-blur. 
**Signature CTA:** For primary buttons, use a subtle linear gradient from `primary` (#002444) to `primary_container` (#1B3A5C) at a 135° angle to add depth and "soul."

---

## 3. Typography: Editorial Authority

We use a dual-font approach to balance professional precision with modern aesthetics.

*   **Display & Headlines (Manrope):** Chosen for its geometric clarity. Use `display-lg` and `headline-md` for portfolio totals and property names. This provides an "editorial" feel that commands attention.
*   **Body & Labels (Inter / Noto Sans TC):** Chosen for maximum legibility in dense data environments.
    *   **Hierarchy Tip:** Never use "Bold" for body text. Use `Medium` (500) for emphasis and `Regular` (400) for standard reading. 
    *   **Color Contrast:** Use `on_surface` (#1a1c1c) for headings and `on_surface_variant` (#43474e) for supporting metadata.

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are often messy. We use **Ambient Light** principles.

*   **The Layering Principle:** Place a `surface_container_lowest` card on a `surface_container_low` section. The contrast creates a natural "lift" without a single pixel of shadow.
*   **Ambient Shadows:** For "Floating" elements (Modals, Popovers), use:
    *   `Box-shadow: 0 12px 40px rgba(0, 36, 68, 0.06);` 
    *   The shadow is tinted with our `primary` blue, not black, making it feel integrated into the environment.
*   **The "Ghost Border":** If accessibility requires a border, use `outline_variant` (#c3c6cf) at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Precision Elements

### Buttons
- **Primary:** `primary` (#002444) background, `on_primary` (#ffffff) text. Shape: `md` (0.375rem). Use the signature gradient on hover.
- **Secondary:** `surface_container_high` (#e8e8e8) background. No border. Text: `on_surface`.
- **Tertiary (Action):** `on_tertiary_container` (#f38442) for text. Used for "Add Property" or "Urgent Alert."

### Cards & Property Lists
- **Rule:** Forbid divider lines. 
- **Execution:** Separate list items using `16px` of vertical white space. If items must be grouped, use a alternating background tint of `surface_container_lowest` and `surface_container`.
- **Shape:** All cards must use `xl` (0.75rem) corner radius to soften the professional tone.

### Input Fields
- **Floating Labels:** Use `label-sm` for labels.
- **State:** On focus, do not change the border color to a thick line. Instead, increase the background brightness to `surface_container_lowest` and apply a `2px` soft glow of `surface_tint`.

### Property Status Chips
- **High-End Styling:** No solid backgrounds. Use a 10% opacity fill of the status color (e.g., Orange for "Pending") with a 100% opacity text of the same color. This "tonal chip" look is cleaner and less distracting.

---

## 6. Do’s and Don’ts

### Do
- **Do** prioritize asymmetric layouts. Align large property images against tight, left-aligned data columns.
- **Do** use "Negative Space" as a functional tool to separate different management modules (e.g., Maintenance vs. Finance).
- **Do** use `title-lg` for card headers to ensure the user always knows their location.

### Don't
- **Don’t** use pure black (#000000) for text. It creates "visual vibration" against white cards. Use `on_surface`.
- **Don’t** use standard 1px borders for tables. Use row-hover highlights and background color blocks instead.
- **Don’t** crowd the navigation. If a menu has more than 7 items, use a "More" dropdown to maintain the "Curated" feel.

---

## 7. Designer’s Closing Note
In property management, **trust is built through clarity.** By removing the clutter of lines and boxes, and replacing them with tonal depth and elegant typography, we create an environment where the data can breathe and the user feels in total control.