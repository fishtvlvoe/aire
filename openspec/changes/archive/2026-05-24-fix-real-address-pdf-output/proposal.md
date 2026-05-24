## Problem

Visible Chrome testing with the real test address `台南市東區裕農路288巷17號8樓之1` can create a case, run supplements, and export PDF, but the exported PDF still contains output risks:

- The cover `物件名稱` uses the address even when a case name was entered.
- Browser-dev mock registry payload can leak hard-coded official-looking values such as `北松字第012345號` and `013層` into the PDF.
- The PDF preview iframe initially renders with an empty `src`, producing a Chrome console error during real-browser acceptance.
- A visible browser can request an icon path and produce a 404 in the same acceptance run.

## Root Cause

PDF dossier assembly currently treats mock registry fallback values as if they were verified official registry values. The cover mapping also ignores `case_name`. The preview page renders an iframe before a blob URL exists, and the app shell has no icon metadata artifact.

## Proposed Solution

- Prefer the entered `case_name` for the PDF cover `物件名稱`, falling back to address only when no case name exists.
- Filter known browser-dev placeholder official values from PDF output so mock data cannot masquerade as real registry facts.
- If the registry floor is the known mock placeholder but the address contains a floor, derive the displayed floor from the address.
- Render a loading placeholder until the PDF preview blob URL exists.
- Add an app icon artifact so visible browser testing does not emit a missing icon request.

## Non-Goals

- Do not implement live COP data retrieval in this SR.
- Do not change pricing or fee calculation logic.
- Do not redesign the PDF template.
- Do not remove the browser-dev mock backend.

## Success Criteria

- A PDF exported for `台南市東區裕農路288巷17號8樓之1` includes the case name and correct address.
- The exported PDF does not contain known old/demo strings: `宜蘭`, `五結`, `農舍`, `農地`, `和平東路`, `文化路`, `永康勝利`, `育農路`, `北松字第012345號`.
- The building floor for the test address does not display the mock `013層` value when the address clearly says `8樓之1`.
- Visible Chrome acceptance can open preview/export without the empty-iframe-src console error.
- Unit tests cover the dossier mapping rules.

## Impact

- Affected specs: disclosure-pdf-render
- Affected code:
  - Modified: src/lib/pdf-engine/assemble-dossier-data.ts
  - Modified: src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - Modified: src/app/(dashboard)/cases/[id]/preview/page.tsx
  - New: src/app/icon.svg
