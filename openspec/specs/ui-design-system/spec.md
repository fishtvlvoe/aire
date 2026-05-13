# ui-design-system Specification

## Purpose

TBD - created by archiving change 'aire-desktop-phase1'. Update Purpose after archive.

## Requirements

### Requirement: Shared design tokens with OPCOS

The system SHALL store design tokens (color palette, font families, spacing scale, border radius, shadow scale) in a single JSON file at `src/styles/design-tokens.json` and SHALL load these tokens into `tailwind.config.ts` under `theme.extend`. The token values MUST match those used by OPCOS (Supastarter `apps/saas/tailwind.config.ts`) so that visually equivalent classes render identical pixels across the two products.

##### Example: design tokens JSON shape

| Token group | Example keys | Source of truth |
| --- | --- | --- |
| colors | `primary`, `primary-foreground`, `secondary`, `muted`, `destructive`, `success`, `warning` | OPCOS Tailwind config |
| fontFamily | `sans`, `mono` | Noto Sans TC + Inter / JetBrains Mono |
| borderRadius | `sm`, `md`, `lg`, `xl` | OPCOS Tailwind config |
| boxShadow | `sm`, `md`, `lg` | OPCOS Tailwind config |
| spacing | inherited Tailwind defaults | n/a |

#### Scenario: Tokens file present and loaded

- **WHEN** the build runs `pnpm tauri build`
- **THEN** `src/styles/design-tokens.json` exists, is valid JSON, and its `colors`, `fontFamily`, `borderRadius`, `boxShadow` keys are merged into `tailwind.config.ts` `theme.extend` at config evaluation time

#### Scenario: Token rename does not silently break build

- **WHEN** a developer renames a key in `design-tokens.json` (e.g., `primary` → `brand`) without updating Tailwind class usage
- **THEN** the build fails or Tailwind emits a warning that the class `bg-primary` references an undefined color

---
### Requirement: Icon library uniformity

The system SHALL use `lucide-react` as the sole icon library and MUST NOT mix multiple icon libraries (e.g., react-icons, heroicons) in the same codebase. Emoji characters MUST NOT be used as UI icons in any component, page, or generated PDF.

##### Example: allowed vs. disallowed icon usage

| Usage | Allowed? |
| --- | --- |
| `import { FileText } from 'lucide-react'` | yes |
| `import { HiDocument } from 'react-icons/hi'` | no |
| Inline emoji `📄` in JSX | no |
| Inline emoji in PDF output | no |

#### Scenario: Build rejects emoji icon in source

- **WHEN** a developer commits a file containing an emoji used as a UI icon (e.g., `<button>📄 匯出</button>`)
- **THEN** a lint rule or CI check flags the emoji as a forbidden icon source

---
### Requirement: Atomic component styling consistency

The system SHALL define button, input, and card components in `src/components/ui/` using Tailwind classes that reference shared tokens (`bg-primary`, `text-primary-foreground`, `rounded-md`, `px-4`, `py-2`, `border-input`, etc.); these components MUST NOT use hard-coded hex colors or `style` props for color, padding, or border radius.

#### Scenario: Button uses token classes only

- **WHEN** the renderer outputs the primary button HTML
- **THEN** the rendered class list contains `bg-primary text-primary-foreground` and does NOT contain inline `style` attributes for color or padding

#### Scenario: Card uses token shadow scale

- **WHEN** the renderer outputs a card component
- **THEN** the rendered class list contains one of `shadow-sm`, `shadow-md`, or `shadow-lg` from the token scale and does NOT contain `style="box-shadow: ..."`

---
### Requirement: Visual parity verification with OPCOS

The system SHALL provide a manual visual parity checklist at `docs/visual-parity-checklist.md` that lists the OPCOS pages and the AIRE pages to compare side-by-side, and SHALL record the assessment outcome (match / drift / mismatch) for each row before the Phase 1 release is tagged.

##### Example: parity checklist rows

| OPCOS page | AIRE page | Compare items | Pass criteria |
| --- | --- | --- | --- |
| Dashboard primary button | Cases list `新增案件` button | Color, height, radius, hover state | Identical hex on screenshot diff |
| Settings form input | Case form text input | Border color, focus ring, height | Identical hex on screenshot diff |
| Empty state card | Empty cases list card | Padding, border, shadow | Identical hex on screenshot diff |

#### Scenario: Checklist exists at release time

- **WHEN** the release pipeline runs for Phase 1 tag
- **THEN** `docs/visual-parity-checklist.md` exists with all checklist rows marked as `match` or with documented exceptions
