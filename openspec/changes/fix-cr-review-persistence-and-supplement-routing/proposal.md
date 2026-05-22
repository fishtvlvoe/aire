## Problem

CR found three places where the UI now looks actionable but the data flow is either still pointing to an old route or only kept in local component state:

- The case-row `補件` action still opens the old key-in route instead of the current `物件審核 -> 補件/現場` flow.
- The `補件/現場` workbench controls show editable answers and upload slots, but their values are not persisted or available to PDF check.
- The profile settings page shows editable name, Email, password, brand color, and Logo controls, but save actions only update local state.

## Root Cause

The previous SR focused on removing duplicate UI and fake buttons. It made controls visible and usable enough for navigation and visual acceptance, but did not connect every new control to the mock data layer. The case-row supplement action also kept the historical `/cases/:id/keyin` destination.

## Proposed Solution

- Route the case-row `補件` action to `/cases/:id?tab=supplements` so all supplement entry points use the same workbench.
- Introduce a small persisted workbench supplement draft in the mock backend:
  - field-visit answers and statuses
  - selected upload file names per slot
  - whether the case has been added to the supplement list
- Load and save that draft from `DemoAlignedWorkbench`, and make PDF check read the persisted upload count.
- Introduce profile settings persistence in the mock backend:
  - name
  - Email
  - brand color
  - logo file name
  - password update timestamp/status
- Make the profile page load these settings and save through `mockInvoke` commands instead of only showing local success messages.

## Non-Goals

- Do not implement real file binary upload in this SR.
- Do not implement production password hashing or authenticated password update in this SR.
- Do not replace the existing dedicated branding settings page.
- Do not implement the future automatic supplement generation backend.

## Success Criteria

- Clicking the case-row `補件` action opens `/cases/:id?tab=supplements`.
- Refreshing or remounting the workbench keeps field-visit answers, statuses, selected upload file names, and supplement-list state in the mock store.
- PDF check reflects the persisted upload count instead of only current component memory.
- Saving profile name, Email, brand color, logo file name, and password state calls mock backend commands and survives a settings page remount in browser/mock mode.
- Unit tests cover the new persistence behavior and the supplement route.

## Impact

- Affected specs: case-management, settings-profile
- Affected code:
  - Modified: src/components/CaseListActions.tsx
  - Modified: src/app/(dashboard)/cases/__tests__/page.test.tsx
  - Modified: src/components/workbench/DemoAlignedWorkbench.tsx
  - Modified: src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - Modified: src/app/(dashboard)/settings/page.tsx
  - Modified: src/app/(dashboard)/settings/__tests__/page.test.tsx
  - Modified: src/app/(dashboard)/settings/__tests__/settings-page.test.tsx
  - Modified: src/lib/mock-backend.ts
  - Modified: src/lib/__tests__/mock-backend.test.ts
