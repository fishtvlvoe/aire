# Design System Strategy: The Architectural Curatorship

## 1. Overview & Creative North Star
**Creative North Star: "The Modern Estate"**
This design system moves away from the cluttered, "utility-first" look of traditional management software. Instead, it adopts the language of high-end architectural journals and luxury real estate editorials. We treat every interface as a curated space—prioritizing white space, structural integrity, and a sense of "quiet luxury."

To break the "template" look, we employ **Intentional Asymmetry**. For example, a dashboard header may have an oversized display title flush left, while the primary action is offset in a floating glass card to the right. We favor overlapping elements (e.g., a card slightly bleeding into a section header) to create a sense of depth and physical presence, moving the UI from a flat screen to a multi-layered digital environment.

---

## 2. Colors
Our palette is rooted in the "Deep Blue" of trust and the "Light Grey" of stone and concrete, punctuated by a high-energy "Orange" that signifies action and urgency.

### Surface Hierarchy & Nesting
We reject the idea of a flat background. Instead, we use a "Layered Stone" approach.
*   **The "No-Line" Rule:** Under no circumstances should 1px solid borders be used to separate sections. Boundaries are created through tonal shifts. A `surface-container-low` (#f3f3f3) sidebar sits against a `surface` (#f9f9f9) canvas, creating a distinction that is felt rather than seen.
*   **The Glass & Gradient Rule:** For floating navigation or top-level alerts, use Glassmorphism. A container with `surface_container_lowest` (#ffffff) at 80% opacity with a `40px` backdrop blur creates a premium, airy feel.
*   **Signature Textures:** For high-impact areas like the Navigation Bar, do not use a flat hex. Apply a subtle linear gradient from `primary` (#002444) to `primary_container` (#1B3A5C) at a 135-degree angle. This adds "soul" and depth to the most prominent element in the system.

| Token | Hex | Role |
| :--- | :--- | :--- |
| `background` | #F9F9F9 | The foundational canvas. |
| `primary` | #002444 | The "Deep Blue" of authority. |
| `secondary` | #9D4400 | The "Orange" accent for momentum. |
| `on_surface` | #1A1C1C | The "Deep Grey" for high-legibility text. |
| `surface_container_lowest` | #FFFFFF | The base color for all primary cards. |

---

## 3. Typography
We utilize **Manrope** for its unique geometric construction which remains highly legible in Traditional Chinese contexts.

*   **Editorial Scaling:** We use a high-contrast scale. `display-lg` (3.5rem) should be used sparingly for data highlights (e.g., total portfolio value), while `body-md` (0.875rem) handles the heavy lifting of estate logistics.
*   **Hierarchy of Authority:** 
    *   **Headlines:** Bold, authoritative, and widely tracked (letter-spacing: -0.02em).
    *   **Labels:** All-caps with a +0.05em tracking for `label-sm` to give a "blueprint" or technical feel to metadata.
*   **Language Harmony:** In Traditional Chinese, ensure line heights are increased by 10-15% compared to English defaults to accommodate the visual density of the characters.

---

## 4. Elevation & Depth
Depth in this system is a product of light and layering, not artificial structure.

*   **The Layering Principle:** To create a "lifted" section, place a `surface_container_lowest` card on a `surface_container_low` background. The difference is subtle but sophisticated.
*   **Ambient Shadows:** For "Active" cards, use a shadow that mimics natural light: `box-shadow: 0px 12px 32px rgba(27, 58, 92, 0.06);`. Note the use of the `primary` color (Deep Blue) in the shadow tint—never use pure black.
*   **The Ghost Border:** If a form field or boundary requires definition for accessibility, use `outline-variant` (#C3C6CF) at **15% opacity**. It should be a whisper, not a shout.
*   **Soft Minimalism:** Utilize `DEFAULT` (0.5rem/8px) corners for a professional, "tailored" look. Avoid fully rounded pill shapes unless it's for a small interactive chip.

---

## 5. Components

### Buttons & CTAs
*   **Primary:** `primary` background with `on_primary` text. Use a subtle 2px inner-glow on hover to simulate a physical button being pressed.
*   **Secondary (The Accent):** Reserve `secondary` (Orange) for "Conversion" or "Urgent Alert" buttons only. This prevents the interface from feeling "loud."

### Architectural Cards
*   **Rules:** Forbid the use of divider lines. Separate content blocks within a card using `1.5rem` of vertical whitespace or a subtle background shift to `surface_container_high`.
*   **Interaction:** On hover, a card should not move up; instead, its shadow should slightly diffuse, and the "Ghost Border" opacity should increase from 0% to 20%.

### Data Lists
*   **The Clean Slate:** List items must not have bottom borders. Instead, use alternating background tints (`surface` vs `surface_container_low`) or simply generous padding (16px - 24px) to define the rhythm.

### Estate Status Chips
*   **Styling:** Use a low-saturation version of the status color with high-contrast text. For example, a "Leased" chip uses a soft tint of blue with a deep navy label.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** embrace the "Negative Space." If a layout feels crowded, remove a border and add 16px of padding instead.
*   **Do** use asymmetrical layouts for landing pages or dashboard summaries to create a custom, high-end feel.
*   **Do** use `Manrope` Medium for body text in Chinese to ensure the strokes don't disappear against the light grey background.

### Don't:
*   **Don't** use 100% black text. Always use `on_surface` (#1A1C1C) to maintain a soft, premium contrast.
*   **Don't** use standard "drop shadows" (0, 2, 4). Always use expanded, ambient blurs with a blue-tinted alpha.
*   **Don't** use icons as the primary way to communicate. In an estate management context, text is the "Source of Truth"—icons are merely the "Guide."