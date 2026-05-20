# Design: AIRE cloud license plus local vault

## Round 1 Discussion Log

Date: 2026-05-20

Fish's concern:

- If AIRE becomes a browser PWA served from the public internet, the public web runtime can theoretically ship changed JavaScript later.
- If changed JavaScript runs in the same origin that can read local browser storage, it could send data outward.
- Because real-estate disclosure data has privacy and legal implications, Fish wants stricter constraints than a normal SaaS app.
- The desired product shape is an authorized interface that customers can open, but not share by URL, and not use from an unbound phone or computer.

Current conclusion:

- Public PWA should not be Phase 1.
- AIRE should first ship as a local runtime with cloud authorization.
- The cloud license system controls permission, but customer case data stays in a local encrypted vault.

## Architecture Diagram

```text
                         AIRE Cloud
              ┌────────────────────────────┐
              │ subscription / billing      │
              │ license status              │
              │ device enrollment           │
              │ feature flags               │
              │ version policy              │
              └──────────────┬─────────────┘
                             │
                             │ license check only
                             │ no case plaintext
                             ▼
                  Bound Customer Device
        ┌─────────────────────────────────────┐
        │ AIRE Local Runtime                   │
        │                                     │
        │ ┌──────────────┐  ┌───────────────┐ │
        │ │ Local UI      │  │ Local API      │ │
        │ │ Tauri window  │  │ localhost/IPC  │ │
        │ └──────┬───────┘  └──────┬────────┘ │
        │        │                 │          │
        │        ▼                 ▼          │
        │ ┌─────────────────────────────────┐ │
        │ │ Encrypted Local Vault            │ │
        │ │ cases / owner data / files / PDF │ │
        │ └─────────────────────────────────┘ │
        └─────────────────────────────────────┘
```

## Delivery Options

| Option | Description | Privacy Risk | Speed | Recommendation |
| --- | --- | --- | --- | --- |
| Tauri app | Downloaded app, UI inside app shell, IPC/local DB | Lowest | Fastest with current code | Phase 1 |
| Localhost UI | Small local runtime opens `127.0.0.1` UI with token gate | Low if loopback-only and token-bound | Medium | Phase 2 |
| Browser PWA | Public web app stores encrypted data in browser storage | Higher because public JS can change | Medium | Spike later |
| Cloud SaaS | Cloud stores case data | Highest legal/compliance burden | Not aligned | Reject |

## Device Binding Model

Phase 1 should use layered binding:

1. License key or account token from AIRE Cloud.
2. Device fingerprint generated locally from stable machine attributes.
3. Server-side activation record binds license seat to device fingerprint.
4. Local encrypted activation token stores entitlement, expiry, and feature flags.
5. Periodic online revalidation, with a short offline grace period.

This does not need to bind to a fixed public IP by default. Public IP binding is brittle because many offices use dynamic IP, mobile hotspots, VPNs, or ISP NAT. Device binding is the stronger default. IP allowlisting can be an optional enterprise policy.

## URL Sharing Constraint

The requirement "user can open the page but cannot see/share a URL" maps better to a local app shell than a public PWA.

Recommended mapping:

- Tauri window: no normal browser address bar, no shareable public URL.
- Localhost UI option: bind server to `127.0.0.1` only, not LAN or public network.
- Each UI session gets a short-lived random session token.
- The local UI rejects requests without the session token and rejects non-loopback hosts.

Example:

```text
Allowed:
Tauri shell -> local IPC -> encrypted local vault
Tauri shell -> http://127.0.0.1:<random-port>?session=<random-token>

Rejected:
phone on same Wi-Fi -> http://computer-ip:<port>
other computer -> public URL
browser without session token -> local UI
```

## Biometric / Face ID

Biometric unlock can improve local access control, but should not be the primary legal boundary.

Use it as:

- Local unlock convenience for the encrypted vault.
- Optional stronger local re-authentication before export, backup, or license transfer.

Do not rely on it as:

- A replacement for device binding.
- A guarantee that cloud never sees data.

On macOS, this maps to keychain / Secure Enclave / Touch ID policies. On Windows, it maps to Windows Hello. iPhone Face ID is relevant only if a mobile client exists.

## Legal Positioning

This design supports the position that AIRE Cloud is a licensing and update provider, not the processor of customer case plaintext.

Important caveat: this is architecture reasoning, not legal advice. The implementation must still be paired with:

- privacy policy
- terms of service
- zero-knowledge / local-vault technical whitepaper
- data retention policy for account, billing, license, and logs
- customer-facing template explaining that real-estate case data remains on the customer's device

## Initial Decision

Build Phase 1 as:

```text
Online subscription page
        ↓
Download AIRE local app
        ↓
Login / activate license
        ↓
Bind license seat to this device
        ↓
All real-estate case data stays in encrypted local vault
        ↓
Cloud controls only entitlement and updates
```

## Round 2 Discussion Log

Date: 2026-05-20

Fish's new decision:

- Use a full Tauri App for Phase 1.
- Do not block AIRE launch on the full opcOS / Google-ecosystem architecture.
- Use `aire.opcos.me` as the simple product domain for MVP launch.
- Keep the future opcOS vision, but do not require the parent portal to exist before AIRE can be sold.

Key concern:

If AIRE must first wait for the full opcOS website, unified account system, product launcher, and cross-product entitlement model, then the saleable AIRE release is blocked by platform work. Fish has a friend/customer who wants to buy the solution soon, while AIRE is still blocked on final disclosure output completeness.

Architecture conclusion:

```text
Phase 1: AIRE-first MVP

aire.opcos.me
  ├─ landing / pricing / download
  ├─ account / license checkout
  ├─ activation API
  └─ update metadata

AIRE Tauri App
  ├─ login / activate license
  ├─ device-bound entitlement
  ├─ local encrypted case vault
  ├─ disclosure workflow
  └─ PDF export
```

Future opcOS architecture:

```text
opcos.me
  ├─ unified account
  ├─ product launcher
  ├─ billing hub
  ├─ shared support
  └─ products
       ├─ aire.opcos.me
       ├─ postgo.opcos.me
       ├─ anismile.opcos.me
       └─ future services
```

The Phase 1 AIRE license system should be designed so it can later be absorbed into opcOS, but it must not depend on opcOS being complete.

## Domain And Login Decision

For MVP:

- Customer-facing product domain: `aire.opcos.me`
- AIRE app activation can open or call `aire.opcos.me`
- Main `opcos.me` can be a simple placeholder or redirect during Phase 1
- No need for a full Google-like product launcher before AIRE launch

For future ecosystem:

- `opcos.me` becomes the account and product hub
- `aire.opcos.me` remains the product surface
- Existing AIRE licenses migrate into the shared account model

## Integration Principle

Build a thin entitlement service first, not a whole ecosystem.

The entitlement service owns:

- license status
- active seats
- device activation records
- feature flags
- billing/subscription state
- update eligibility

It does not own:

- case records
- disclosure form content
- land registry files
- owner personal data
- uploaded photos
- exported PDFs

## Real-Estate Product Context

The market already has real-estate software and document/e-signing products. This validates that digital real-estate workflows are acceptable, but AIRE's differentiator is narrower:

- produce legally sensitive real-estate disclosure outputs
- keep customer case data local
- sell through online subscription/license
- avoid manual on-site installation

This means AIRE should not compete first as a generic brokerage CRM. It should launch as a "local privacy disclosure assistant" with online licensing.

## Round 3 Discussion Log

Date: 2026-05-20

Fish's question:

- We have already discussed disclosure structure and content with the customer.
- The current code still has PDF/output bugs.
- There are reference files under `0520/不動產說明書-bug`.
- Should all of that be included in this architecture discussion, or should this discussion only decide product direction first?

Context observed:

`0520/不動產說明書-bug` contains generated PDFs, screenshots, a logo SVG, one image, and one land registry PDF. These are useful as evidence for output QA and comparison, but they are not the right center of gravity for the license/local-vault architecture decision.

Decision:

Separate the work into three lanes.

```text
Lane A: Sellable Product Direction
  ├─ AIRE-first MVP
  ├─ Tauri App
  ├─ aire.opcos.me
  ├─ license + device binding
  └─ local vault privacy position

Lane B: Disclosure Output Completion
  ├─ customer-required disclosure structure
  ├─ PDF content completeness
  ├─ visual/output bugs
  ├─ old generated PDFs as comparison evidence
  └─ final acceptance checklist

Lane C: Platform / opcOS Future
  ├─ unified opcOS account
  ├─ multi-product hub
  ├─ shared billing
  └─ future ecosystem migration
```

Lane A is the current discussion. Lane B is the immediate implementation blocker for selling AIRE. Lane C is deferred.

## MVP Development Scope Decision

For fast launch, AIRE should define a "minimum sellable version" rather than a perfect platform.

Must include:

- AIRE Tauri App can run on customer machine.
- Final disclosure PDF output is complete enough for the partner/customer's actual workflow.
- Customer can activate a license without manual on-site setup.
- Customer case data remains local.
- `aire.opcos.me` provides pricing/download/license entry points.
- Privacy explanation is clear enough for sales and onboarding.

Can defer:

- Full opcOS product hub.
- Browser PWA.
- Multi-device cloud sync.
- Enterprise IP allowlisting.
- Full CRM features.
- Perfect redesign of every PDF page beyond customer acceptance.

Avoid in MVP:

- Cloud storage of case plaintext.
- Rebuilding AIRE on a new Supastarter/opcOS platform before first sale.
- Treating every old PDF bug as part of the license architecture discussion.

## Boilerplate / Hosting Direction

Use existing code where it directly accelerates launch:

- Keep current AIRE Tauri + Next code for the app.
- Use a thin `aire.opcos.me` web surface for sales/download/license.
- Reuse Supastarter only for web/account/billing pieces if it reduces work.
- Do not migrate the AIRE desktop workflow into the Supastarter monorepo before the first sellable release.

Hosting recommendation for MVP:

- `aire.opcos.me` on Vercel or similar managed Next hosting.
- License/entitlement API can start as a simple serverless API or Cloudflare Worker, depending on which existing code is closest.
- Downloads can be hosted through GitHub Releases, R2, or the web host's static assets.

## Customer PDF Data Handling

Do not read every PDF first by default.

Use a staged intake:

1. File inventory: identify what each PDF/image represents.
2. Gold sample: choose one customer-accepted target output if available.
3. Bug sample: choose one current broken AIRE output.
4. Gap table: compare target vs current output at page/section level.
5. Only then inspect source PDFs deeply.

This keeps the agent from spending time parsing low-signal PDFs before the acceptance target is clear.

## Old Output Alignment

Old AIRE output should be treated as evidence, not as the target.

```text
Old AIRE output
  = what the current system can produce
  = useful for finding bugs
  ≠ final customer-required disclosure
```

The final target should come from customer-approved structure and content requirements.

## Round 4 Discussion Log

Date: 2026-05-20

Fish confirmed the MVP sellable standard:

```text
AIRE MVP = deliverable disclosure PDF + license/download activation
```

Both are required:

- Without the disclosure PDF, the product has no customer-facing deliverable.
- Without license/download activation, delivery remains manual and does not scale.

Execution priority:

```text
1. Finish Lane B: Disclosure Output Completion
2. Then define Lane A delivery details: license, activation, download, payment
```

Reasoning:

The first buyer/partner is buying the ability to produce an acceptable real-estate disclosure output. License and payment can start with a simpler MVP flow, but incomplete disclosure output cannot be treated as sellable.

## Round 5 Discussion Log

Date: 2026-05-20

Fish chose the next PDF step:

```text
Create a gap analysis first.
```

Do not immediately fix the old generated PDF. The old AIRE output and customer target appear materially different, so direct bug fixing may optimize the wrong output. The next work item should compare:

- customer-required disclosure structure/content
- current AIRE generated output
- known bug screenshots/PDFs under `0520/不動產說明書-bug`

Expected result:

```text
page/section gap table
  ├─ expected output
  ├─ current output
  ├─ missing/wrong content
  ├─ likely code area
  └─ priority for MVP
```

This gap table becomes the source of truth for the follow-up implementation change.

## Round 6 Discussion Log

Date: 2026-05-20

Fish confirmed the target disclosure reference folder:

```text
/Users/fishtv/Development/products/AIRE/0520/不動產說明書
```

Fish also defined the intended disclosure workflow:

```text
Two disclosure variants:
  ├─ 房屋版本
  └─ 土地版本

Two work stages:
  ├─ 草稿版說明書
  └─ 簽委託後正式補件與編輯
```

### Stage 1: Draft Disclosure

Purpose: produce a usable draft before final customer confirmation.

Inputs:

- online land/building transcript data
- known web data
- company logo
- agent name
- field staff notes
- customer name / land number / building identifiers
- estimated transaction amount if available
- tax/fee estimates
- field condition survey answers and required questions

Output:

- draft real-estate disclosure PDF for field discussion and委託 signing context

### Stage 2: Formal Supplement / Editing After委託

Purpose: after the agent reviews the draft with the customer and signs委託, update handwritten or corrected information into the system.

Key UI idea:

```text
左側：原始/既有表格頁面
右側：所見即所得編輯區
```

Behavior:

- each disclosure page can be separated and replaced independently
- base transcript facts such as land section, land number, and registry-derived data are locked after capture
- editable correction fields are added around the locked base data
- numeric inputs can trigger linked calculations and jump/display related tax fields
- final output uses draft data plus confirmed supplements

### Product Logic Interpretation

AIRE is not only a PDF generator. It is a two-stage disclosure production workflow:

```text
資料蒐集 / 自動帶入
        ↓
草稿版說明書
        ↓
業務現場與客戶核對 / 簽委託
        ↓
補件與修正
        ↓
正式說明書輸出
```

### Implication For Gap Analysis

The PDF gap analysis should not only ask "which PDF pages are wrong?" It must classify each missing page/field by workflow stage:

- draft-required
- formal-supplement-required
- shared across both stages
- house-only
- land-only

## Round 7 Discussion Log

Date: 2026-05-20

Fish clarified the main UI boundary:

- The initial case/object creation UI and the draft disclosure UI are different surfaces.
- Previous implementation attempts mixed these two surfaces, causing the UI to fight itself.
- AIRE should not have only one object-entry interface with no styled disclosure table preview.

Correct model:

```text
Case/Object Setup UI
  ├─ collect basic object data
  ├─ identify house vs land
  ├─ capture registry/basic facts
  └─ save structured fields

Draft Disclosure UI
  ├─ use the saved fields
  ├─ render disclosure-style tables/pages
  ├─ show generated preview beside the inputs
  └─ prepare draft PDF output
```

Fish also clarified the editing model:

- This is not a Word-like editor.
- This is not an Elementor-like freeform page builder.
- The goal is to reproduce the familiar real-estate disclosure table format.
- The user enters structured values such as A/B/C/D/E/F/G fields.
- After input or save, the right-side preview renders the corresponding disclosure page/table.

Suggested UI shape:

```text
┌───────────────────────────────┬────────────────────────────────┐
│ Structured Input Panel         │ Generated Disclosure Preview    │
│                               │                                │
│ A: [          ]                │ ┌────────────────────────────┐ │
│ B: [          ]                │ │ official-style table/page   │ │
│ C: [          ]                │ │ generated from A/B/C        │ │
│ D: [          ]                │ │ not directly free-edited    │ │
│                               │ └────────────────────────────┘ │
│ [Save]                         │                                │
└───────────────────────────────┴────────────────────────────────┘
```

Implementation-neutral decision:

- The preview can be generated through HTML, React components, PDF preview, or another renderer.
- The important contract is structured input -> official-style generated disclosure table/page.

Implication:

The disclosure output gap analysis must identify not only missing PDF pages, but also which input fields are needed to generate each preview table/page.

## Round 8 Discussion Log

Date: 2026-05-20

Fish confirmed the MVP draft disclosure workbench behavior:

```text
Left side: structured field input
Right side: generated preview only
```

Do not build right-side direct editing in the first version.

Accepted MVP behavior:

- User edits fields on the left.
- User clicks save or the app auto-refreshes.
- Right side renders an official-style disclosure table/page preview.
- Right side is not a freeform document editor.
- Right side is not the place where the user edits text directly.

This keeps the MVP as a fixed-format table generator:

```text
structured fields -> disclosure table preview -> PDF output
```

Deferred:

- right-side WYSIWYG editing
- drag/drop page layout
- per-page direct text editing
- Word-like rich-text authoring

## Round 9 Discussion Log

Date: 2026-05-20

Fish chose the preview granularity:

```text
MVP right-side preview = single-page preview
```

Not full-document preview first, and not chapter-level preview first.

Reason:

- Single-page preview maps directly to the disclosure table/page being edited.
- It is easier to compare against customer reference pages.
- It reduces rendering and UI complexity for MVP.

Fish also added a missing product requirement:

```text
Draft disclosure workbench must support image upload.
```

Current system does not fully cover the needed image upload behavior for the target disclosure workflow. The follow-up PDF gap analysis must identify all required image slots from the customer reference folder.

Initial likely image categories:

- company logo
- floor plan / layout image
- exterior photo
- location map / surrounding map
- field survey photos or supporting attachments

The exact MVP image slots still need confirmation from the reference pages.

## Round 10 Discussion Log

Date: 2026-05-20

Fish asked whether the image capabilities already exist in code and whether the real missing piece is upload placement.

Code scout conclusion:

- Company Logo exists as a branding/settings upload flow and PDF header/cover rendering path.
- Floor plan / planning map exists through `case_assets` bridge and Step 3 upload.
- Location map and aerial/surrounding map are generated from coordinates/API fallback, not primarily manual upload.
- Exterior photo currently has PDF rendering and automatic street-view fetch behavior; product meaning is not fully settled because comments imply "uploaded by assistant" while code fetches street view.
- General field/site photos have a `PhotoGallery` PDF component and schema/test traces, but the final document/workbench integration and upload placement are not clear.
- Fish clarified that older AIRE code also had these image/attachment capabilities. The follow-up should look for reusable old-code flows before designing new upload logic.

Decision:

The missing MVP problem is not "write all image code from zero." The missing problem is the image slot map:

```text
For each disclosure page:
  ├─ what image belongs here?
  ├─ is it auto-generated or manually uploaded?
  ├─ where does the assistant upload/replace it?
  ├─ where is it stored?
  ├─ which renderer consumes it?
  └─ does it enter draft PDF, formal PDF, or both?
```

Initial image slot interpretation:

| Image | Current likely capability | Missing decision |
| --- | --- | --- |
| Company Logo | Settings/branding upload exists | Whether draft workbench needs shortcut or just uses global settings |
| Floor plan / planning map | Step 3 `case_assets` upload exists | Whether it belongs in case setup, draft page, or attachment page |
| Exterior photo | PDF block exists; auto street-view fetch exists | Whether MVP requires manual upload, auto street-view, or fallback order |
| Location/surrounding map | Auto map generation exists | Whether manual override upload is needed |
| Field/site photos | PDF gallery component exists | Which page uses it and where upload happens |

Implication:

The follow-up gap analysis must include an "image slot map" section before implementation.

Reuse principle:

```text
Before building new image upload logic:
  1. inventory current repo capability
  2. inventory older AIRE code capability
  3. map each reusable flow to target disclosure pages
  4. only implement missing placement/integration
```

Follow-up clarification:

- Fish remembers the older implementation as "three-ai", but its code is no longer readable/available.
- Therefore, "three-ai" can be used only as product memory, not as an implementation dependency.
- The work should proceed from currently readable AIRE code and the target disclosure references.

Image upload placement decision:

```text
MVP image upload entry = inside the draft disclosure workbench
```

Use page-level placement:

- left-side input panel includes the image upload field for the current page
- right-side single-page preview shows how that image appears in the disclosure table/page
- do not build a separate attachment library first unless gap analysis proves it is needed

Reason:

- The MVP already uses single-page preview.
- Page-level image upload is easier for the assistant to understand.
- It avoids a larger attachment management system before first sale.

## Round 12 Discussion Log

Date: 2026-05-20

Fish confirmed the first draft workbench target:

```text
First single-page draft preview target = 房屋版本的物件資料表
```

This narrows the first implementation/gap-analysis slice:

- focus on building/house disclosure first
- use the property data sheet as the first structured input -> generated table preview proof
- do not split attention into land version first
- use image-slot inventory as supporting work, but do not let it block the first property-sheet slice

Reason:

The house version directly connects to the immediate MVP needs: building disclosure, floor plan, exterior photo, field condition survey, and customer-facing PDF output.

## Round 13 Discussion Log

Date: 2026-05-20

Fish clarified the target reference folder classification:

```text
/Users/fishtv/Development/products/AIRE/0520/不動產說明書
```

Rule:

- Files with "土地" in the filename are land-version references and should be excluded from the first house-version slice.
- The other image references are house-version references unless later corrected.

Observed house-version candidates:

- `1-封面.png`
- `2.JPG`
- `2-1-房屋-不一定要.JPG.JPG`
- `3-2+3.JPG`
- `4.JPG`
- `5.JPG`
- `6.JPG`
- `7.JPG`
- `8.JPG`
- `9-8+9.JPG`
- `10-房屋-現況調查表-1.JPG`
- `10-房屋-現況調查表-2.JPG`
- `10-房屋-現況調查表-3.JPG`
- `10-房屋-現況調查表-4.JPG`
- `10-房屋-現況調查表-5-1+5.JPG`
- `11-房屋-生活機能.JPG`
- `20-(105-04-29)成屋不動產說明書格式範例.pdf`
- `建物物調表-母版.pdf`
- `建物物調表-母版.txt`
- `格局圖.jpg`

Excluded for first house-version slice:

- `2-1-土地-不一定要.JPG`
- `99-土地-現況調查表-*.JPG`
- `999- 土地-生活機能.JPG`
- `土地不動產說明書格式範例(1050429函頒).pdf`

Implication:

The house-version property data sheet target should be selected from the non-land house references, with `2.JPG`, `2-1-房屋-不一定要.JPG.JPG`, and `3-2+3.JPG` as the likely early inspection set.

## Round 14 Discussion Log

Date: 2026-05-20

Fish asked whether to inspect the PDF files first, or begin from the image references.

Decision:

```text
Start from the JPG reference pages first.
Use the PDF files later for legal completeness and official format cross-checking.
```

Reason:

- The immediate MVP UI target is a single-page draft workbench.
- JPG references are faster for identifying page-level layout, field groups, and image slots.
- PDF references are still important, but reading full PDFs too early may slow down the first house-version UI decision.

Initial JPG inspection:

| File | Observed role | First-slice decision |
| --- | --- | --- |
| `2.JPG` | Page `1/9`, titled `【說明】`; legal/explanation page with company header, property number, property name, and disclosure/legal notes. | Not the first property data sheet UI. Keep as a later legal notice/static page target. |
| `2-1-房屋-不一定要.JPG.JPG` | Decorated property summary / sales card: price, area, address, school, rooms, usage, current state, feature notes, property photo. Filename says `不一定要`. | Optional for MVP. Do not let it block the statutory disclosure table. |
| `3-2+3.JPG` | Page `3/9`, section `壹、產權調查表`; includes land location, transaction type, price, included equipment, payment method, then `一、【建物標示】略`. | Best first target for the house-version structured input -> generated official-style preview. |

Current product interpretation:

```text
First house-version draft workbench target
  = 3-2+3.JPG / 產權調查表
  = structured fields on the left
  = official-style generated table preview on the right
```

Do not merge these pages into one UI:

- `2.JPG` is legal/explanation content.
- `2-1-房屋-不一定要.JPG.JPG` is an optional property card.
- `3-2+3.JPG` is the likely first statutory disclosure table.

Next inspection path:

1. Continue from `3-2+3.JPG` and identify all visible fields.
2. Inspect `4.JPG`, `5.JPG`, etc. to see whether the same `產權調查表` continues across pages.
3. Read the official house-version PDF only after the house JPG flow is mapped, to verify legal wording and required sections.

## Round 15 Discussion Log

Date: 2026-05-20

Fish asked to continue aligning the house-version page scope.

Inspection set:

- `4.JPG`
- `5.JPG`
- `6.JPG`
- `7.JPG`
- `8.JPG`
- `9-8+9.JPG`
- `10-房屋-現況調查表-1.JPG`
- `10-房屋-現況調查表-2.JPG`
- `10-房屋-現況調查表-3.JPG`
- `10-房屋-現況調查表-4.JPG`
- `10-房屋-現況調查表-5-1+5.JPG`
- `11-房屋-生活機能.JPG`

Page grouping result:

| Group | Files | Role | MVP treatment |
| --- | --- | --- | --- |
| Main statutory disclosure body | `3-2+3.JPG`, `4.JPG`, `6.JPG`, `7.JPG`, `8.JPG`, `9-8+9.JPG` | 9-page disclosure set with header, property number, property name, legal sections, land display, cost/tax pages. | First product backbone, but not all pages need editable UI at once. |
| First editable data target | `3-2+3.JPG`, `4.JPG` | `產權調查表` and `土地標示`; mostly registry/property structured data. | First MVP workbench slice. |
| Market reference attachment | `5.JPG` | `透明房價一覽表/成交行情`, separate 1-page market-comparable report. | Keep as generated/attached reference page, not part of first editable table UI. |
| Fixed legal notice text | `6.JPG` | `產權相關注意事項`, numbered legal caveats. | Treat as mostly fixed text with case header; defer editing. |
| Tax/cost estimate pages | `7.JPG`, `8.JPG`, `9-8+9.JPG` | buyer/seller cost items and land value increment tax estimate. | Later automatic-calculation section; not first UI slice. |
| Field condition questionnaire | `10-房屋-現況調查表-*.JPG` | 5-page yes/no/checklist style current-condition survey. | Separate questionnaire workbench; do not merge into `產權調查表` UI. |
| Location/living function page | `11-房屋-生活機能.JPG` | map image plus nearby facility table. | Separate map/facility page with image/table slots. |

Important UI conclusion:

```text
Do not build one giant "property object UI" that contains every page.
Build page-specific workbenches.
```

The first workbench should be:

```text
房屋版 / 產權調查表 workbench
  ├─ source pages: 3-2+3.JPG + 4.JPG
  ├─ left side: structured registry/property fields
  ├─ right side: official-style single-page preview
  └─ output: first draft PDF pages for the disclosure body
```

Later workbenches can be separate:

```text
現況調查表 workbench
  = yes/no/checklist fields

費用稅金 workbench
  = amount inputs + calculated tax/cost result

生活機能 workbench
  = map image + nearby facility rows
```

Reason:

The previous UI conflict happened because case setup, statutory disclosure tables, tax/cost pages, field survey checklists, and map/photo pages were treated as if they were one interface. They are not the same mental model.

First implementation scope recommendation:

```text
Build only:
  1. House version case header
  2. `產權調查表` page preview
  3. `土地標示` page preview

Defer:
  - transparent house price page
  - fixed legal notices
  - tax/cost estimate pages
  - 5-page field condition questionnaire
  - living function map page
```

## Round 16 Discussion Log

Date: 2026-05-20

Fish clarified the commercial packaging and current implementation concern.

Current business direction:

```text
Base version
  = customer can pull land/building registry transcript data
  = other information is manually completed by customer

Add-on / upgrade features
  = automated enrichment around the base registry pull
```

Add-on feature candidates:

| Feature | Business tier | Notes |
| --- | --- | --- |
| Land/building registry pull | Base | Core feature for first sale. |
| Owner / co-owner registry details | Base or required registry bundle | Must be stored locally after pull if used in disclosure. |
| Nearby transaction market data | Add-on | Can be sold as monthly upgrade. |
| Real-price registration query | Add-on | Current UI already has premium/feature flag traces. |
| Location / surrounding map | Add-on | Can feed living-function page. |
| Aerial photo | Add-on | Automated image enrichment. |
| Street-view / exterior reference | Add-on | Product meaning needs naming clarity: street-view reference vs uploaded exterior photo. |
| Cadastral map / 地籍圖 | Add-on | Fish explicitly added this to the upgrade set. |
| Floor plan / 格局圖 | Add-on | Fish explicitly added this to the upgrade set; existing upload/asset capability exists, but package gating must be decided. |

Technical concern Fish raised:

- Land administration APIs were expected to pull complete registry/user data.
- After pulling, the data appears not to persist into the real DB/system.
- The project has been built by gradual layering, so some features exist as fetchers or mock flows but may not be wired into durable storage.

Code alignment observed:

- `src-tauri/src/land_registry/pull.rs` implements multiple API IDs: `land_registry`, `building_registry`, `co_owners`, `land_value`, `mortgages`, `building_ownership`, `zoning`.
- `src-tauri/src/commands/real_price.rs` implements `query_real_price`.
- `src-tauri/src/geo_services/*` implements location map, aerial photo, and street-view fetchers.
- Frontend/mock code has `land_registry_data`, `current_step`, premium status, and feature flags.
- Real Rust `cases` DB schema currently does not show durable `land_registry_data` / `current_step` columns in migrations observed so far.

Implication:

```text
Some features are coded as callable capabilities,
but product packaging and durable storage are not yet aligned.
```

Required architecture correction before implementation:

1. Define feature bundles:
   - base registry bundle
   - market/real-price bundle
   - map/photo bundle
   - cadastral/floor-plan bundle
2. Store pulled registry data into local DB or local vault, not only component state.
3. Make the backend entitlement source authoritative, not just browser/mock flags.
4. Super admin local account should see and toggle every feature during development.
5. Frontend feature visibility must be driven by the same feature entitlement map.
6. Convert the top manual-input area into table-style fields so it can compare cleanly with the right-side preview/info panel.

## Round 17 Discussion Log

Date: 2026-05-20

Fish simplified commercial packaging from many add-ons into three plan tiers.

Plan tiers:

| Tier | Product meaning | Feature direction |
| --- | --- | --- |
| Basic / 基本版 | Can sell and deliver a disclosure document. | Registry pull, manual completion, draft/PDF output, basic branding/image upload. |
| Pro / 進階版 | Saves time by auto-filling market/context data. | Basic plus real-price registration, nearby transaction/market data, location/surrounding map, cadastral map. |
| Advanced / 高階版 | Full visual and automation package. | Pro plus aerial photo, street-view/exterior reference, floor plan, deeper automation/calculation, formal supplement workflow. |

Fish then confirmed the SaaS control model:

```text
SaaS website controls the customer's plan.
When the customer changes plan, AIRE features open automatically.
No manual operator intervention should be required.
```

Entitlement flow:

```text
Customer changes plan on SaaS site
        ↓
SaaS billing/license service updates entitlement
        ↓
AIRE Tauri App syncs license/plan status
        ↓
Local feature map updates
        ↓
Frontend automatically shows or hides features
```

Implementation implication:

- The source of truth for customer plan is the SaaS license backend, not local UI state.
- The Tauri app may cache entitlement locally for offline grace, but must refresh from SaaS when online.
- Super admin/dev mode can override for local testing, but production customers should not require manual toggles.
- Feature checks should be plan-based first, with optional per-feature flags only for staged rollout or internal testing.

Plan-based feature map draft:

| Feature | Basic | Pro | Advanced |
| --- | --- | --- | --- |
| Registry pull | Yes | Yes | Yes |
| Manual data completion | Yes | Yes | Yes |
| Draft/PDF output | Yes | Yes | Yes |
| Real-price registration | No | Yes | Yes |
| Nearby market/transaction data | No | Yes | Yes |
| Location/surrounding map | No | Yes | Yes |
| Cadastral map / 地籍圖 | No | Yes | Yes |
| Aerial photo | No | No | Yes |
| Street-view/exterior reference | No | No | Yes |
| Floor plan / 格局圖 | No | No | Yes |
| Formal supplement workflow | Later | Later | Yes or later add-on |

## Round 18 Discussion Log

Date: 2026-05-20

Fish asked whether the "registry data not saved to DB" issue is already recorded, or whether it should only be manually tested later during development.

Decision:

```text
Do not leave this as an informal later check.
Make it an explicit pre-implementation verification item.
```

Observed risk:

- UI has a "pull registry data" action.
- Fish observed that after pressing the button, the data does not appear to persist.
- It is unclear whether data is saved somewhere local, saved only in browser/mock state, or not saved at all.
- Current code inspection suggests a mismatch:
  - frontend/mock state includes `land_registry_data`
  - real Rust `cases` DB schema did not show a durable `land_registry_data` column in the inspected migrations

Required verification before fixing:

```text
Registry persistence verification
  1. Run the real Tauri app path, not only browser/mock mode.
  2. Create or open a case.
  3. Pull registry data.
  4. Confirm whether the UI says data was saved.
  5. Close/reopen or reload the case.
  6. Inspect the local SQLite DB/schema.
  7. Record whether registry payload exists in durable local storage.
```

Expected outcomes:

| Outcome | Meaning | Follow-up |
| --- | --- | --- |
| Data exists in DB/local vault | UI read path may be wrong. | Fix loading/display mapping. |
| Data exists only in mock/localStorage | Browser-dev behavior is misleading. | Add real Tauri persistence. |
| Data only exists in React state | Pull flow loses data after navigation/reload. | Add save command/schema and reload path. |
| No durable column/table exists | Storage design is incomplete. | Add local vault/SQLite schema for pulled registry payloads. |

Implementation rule:

The first registry-data implementation task must begin with this verification and must leave an evidence note in the change record before marking the issue fixed.

## Round 19 Discussion Log

Date: 2026-05-20

Fish accepted the default SaaS plan-control strategy, with the caveat that real customer usage may reveal the rules are too strict or need adjustment.

Default entitlement strategy:

```text
SaaS plan source of truth
  ↓
AIRE App syncs entitlement on startup
  ↓
User can manually resync license/plan
  ↓
Offline grace keeps last valid entitlement for 7 days
  ↓
If downgraded, premium features close but existing generated/imported data is preserved
```

Initial behavior rules:

| Situation | Default behavior |
| --- | --- |
| App starts while online | Sync latest plan/entitlements from SaaS. |
| User changes plan on SaaS site | Next sync opens/closes features automatically. |
| User wants immediate update | Provide a manual "resync license/plan" action. |
| App is offline | Keep last valid entitlement for 7 days. |
| Offline grace expires | Allow base/local viewing where legally acceptable, but block premium fetch/generation actions. |
| Customer downgrades | Do not delete existing data; make premium generation/refetch/editing unavailable or read-only as appropriate. |
| Super admin/dev account | Can enable all features for testing. |

Product caveat:

These rules are the MVP default, not a permanent legal/product final answer. After real partner/customer testing, AIRE should collect issues and adjust:

- whether 7-day offline grace is too short or too long
- whether downgraded premium outputs should be read-only, hidden, or exportable
- whether customers feel too many buttons are blocked
- whether manual resync is clear enough
- whether some advanced features should move into a lower plan

Design principle:

```text
Do not hard-code the business rules so deeply that customer feedback becomes expensive to apply.
Use a plan entitlement map that can be adjusted from SaaS/backend configuration.
```

## Round 20 Discussion Log

Date: 2026-05-20

Fish clarified the cloud data boundary and customer-facing legal/privacy promise.

Cloud may store only:

1. customer computer IP
2. product serial number
3. email
4. user name
5. password credential
6. subscription plan
7. minimum usage records

Implementation clarification:

- Password must not be stored as plaintext. Store only a salted password hash or use a managed auth provider.
- IP address should be treated as potentially personal data and as a risk signal, not a reliable computer identity.
- Minimum usage records should be narrowly defined, such as activation checks, plan sync timestamps, feature entitlement checks, version/update checks, and error codes without case/property payloads.

Cloud must not store:

- disclosure form content
- queried address
- land lot number / building number
- owner / co-owner names
- registry transcript payloads
- real-price search target tied to a customer case
- cadastral map, aerial photo, street-view image, floor plan, field photos
- exported PDFs
- customer case backups

Customer-facing website statements required:

```text
1. AIRE runs locally after download.
2. Customer real-estate case data stays on the customer's own computer.
3. AIRE Cloud does not know queried addresses or land/building numbers.
4. AIRE Cloud is used for license, subscription, device binding, entitlement sync, and updates.
5. AIRE does not upload customer sensitive case data.
6. If the customer's computer is damaged or data is lost, the customer is responsible because AIRE Cloud does not provide case-data backup.
```

Legal document set required:

- privacy policy
- terms of service
- local-data / no-cloud-case-data technical statement
- no-backup responsibility notice
- license and device-binding terms
- customer acknowledgment before first use

IP/device binding decision:

```text
Do not use IP address as the only lock.
Use device binding as the primary lock.
Use IP as optional additional signal or enterprise allowlist.
```

Reason:

- Public IP can change because of ISP dynamic IP, office router changes, mobile hotspot, VPN, NAT, or network migration.
- Multiple computers in one office can share the same public IP.
- A different computer can sometimes appear from the same public IP.
- Therefore IP alone cannot prove "same computer".

Recommended activation model:

```text
license serial + user account
        ↓
device fingerprint / device key generated locally
        ↓
server binds license seat to device_id
        ↓
server also records last_seen_ip as risk signal
        ↓
optional enterprise rule: only allow listed office IP ranges
```

Answer to Fish's direct question:

If a customer uses the same serial number on a different computer, it should fail unless:

- the SaaS license backend has an available seat and allows new device activation, or
- the customer/operator performs an approved device transfer.

If the only difference is IP but the same bound computer moved network, the default MVP should not permanently block the customer. It should trigger revalidation or warning instead. Strict IP allowlisting can be an optional policy for enterprise customers who accept the inconvenience.

## Round 21 Discussion Log

Date: 2026-05-20

Fish confirmed the device-binding business rule.

Rule:

```text
One paid license seat authorizes exactly one computer.
If a customer wants to use AIRE on multiple computers, they must buy additional seats/licenses.
```

Activation behavior:

```text
serial/account + available seat
        ↓
bind to one device_id
        ↓
same device can continue using within entitlement rules
        ↓
different device is blocked unless another seat exists or transfer is approved
```

Implementation implications:

- A license plan must include `seat_count`.
- Each active seat binds to one `device_id`.
- A single-seat customer cannot activate a second computer with the same serial.
- Multi-computer customers need multiple seats or a higher plan/package that includes more seats.
- Device transfer must be an explicit workflow, not automatic silent rebinding.
- Super admin/dev mode may reset or override bindings for testing.

Suggested customer-facing wording:

```text
Each license seat is limited to one authorized computer.
To use AIRE on additional computers, please purchase additional seats.
Device transfer is available through the account/license management process.
```

## Round 22 Discussion Log

Date: 2026-05-20

Fish asked whether the computer will have a key, whether the serial number is limited to one account, and whether this must be implemented in code.

Decision:

```text
Implement licensing as three layers:
  1. license key / serial number
  2. account / email
  3. local device key / device_id
```

Meaning:

| Layer | Meaning |
| --- | --- |
| License key / serial | Proof that a subscription/license was purchased. |
| Account / email | Who owns or administers the license. |
| Device key / device_id | Which computer is authorized to use one seat. |

MVP rule:

```text
one serial = one account = one seat = one computer
```

Future-ready rule:

```text
one account
  ├─ may own multiple licenses/subscriptions
  ├─ each plan/license has seat_count
  └─ each active seat binds to one device_id
```

Activation flow:

```text
User logs in and enters serial/license key
        ↓
AIRE App generates or loads local device key
        ↓
SaaS verifies serial, account, plan, and available seat count
        ↓
If seat is available, bind this device_id to the seat
        ↓
If seat is full, reject activation unless transfer/extra seat is approved
```

Implementation requirements:

- The local app must generate and persist a stable device key/device identity.
- The SaaS backend must store license/account/seat/device binding.
- The local app must cache an activation token for offline grace.
- The code must reject activation on a second computer when seat count is full.
- Device transfer must be an explicit workflow.
- Data structures should not assume forever that every license has only one seat.

## Round 23 Discussion Log

Date: 2026-05-20

Fish aligned the device-transfer policy and clarified offline behavior.

Device transfer policy:

```text
One license seat can self-transfer at most once per month.
If transfer frequency exceeds the normal limit, the customer must contact support.
```

Accepted transfer reasons:

- computer broken
- operating system reinstalled
- company changes the person using the authorized computer
- boss/owner wants to move usage to a different staff computer

Support escalation:

```text
If a customer needs repeated transfers in the same month,
they must explain the situation through Line support or online email support.
```

Reasoning:

- A real estate office computer should not normally break, reinstall, or change owner repeatedly within one month.
- The expected user is the brokerage owner or an authorized staff member on a stable office computer.
- Frequent activation on different computers is more likely to indicate seat sharing or misuse.

Offline behavior clarification:

```text
AIRE's core registry/API workflow cannot be offline-only.
```

Reason:

- The product must connect to land administration / registry APIs to pull data.
- Registry pull, real-price, map, aerial, street-view, and other online enrichments require network access.
- Device transfer also requires SaaS contact because the server must update seat/device binding.

Refined offline rule:

- The app may cache entitlement briefly to avoid accidental lockout during temporary network issues.
- Online API-dependent actions must require network.
- Device transfer cannot happen offline.
- Offline grace does not mean the customer can run new registry pulls offline.

Recommended transfer workflow:

```text
Customer logs into SaaS website
  ↓
opens License Devices
  ↓
sees current bound computer
  ↓
requests transfer and selects reason
  ↓
if monthly self-transfer quota available: old device is unbound
  ↓
new computer opens AIRE and activates with serial/account
  ↓
new device_id binds to the seat
```

If transfer quota is exceeded:

```text
Show support instructions:
  - Line support
  - email support
  - reason required
  - manual review before reset
```

## Round 24 Discussion Log

Date: 2026-05-20

Fish clarified Basic vs Advanced feature separation and UI implications.

Core distinction:

```text
Basic can manually upload/enter customer-prepared content.
Advanced can automatically fetch/generate content through AIRE APIs and integrations.
```

Important correction:

Formal supplement / post-commission editing must belong to Basic.

Reason:

- If a brokerage uses AIRE to create a draft disclosure, then returns from the client with handwritten corrections, they need to complete a formal disclosure document.
- Putting that required supplement/editing workflow only in Advanced would make the Basic product commercially inconsistent.

Plan feature interpretation:

| Capability | Basic | Pro | Advanced |
| --- | --- | --- | --- |
| Create case | Yes | Yes | Yes |
| Pull required registry/transcript data | Yes | Yes | Yes |
| Manual data completion | Yes | Yes | Yes |
| Draft disclosure PDF | Yes | Yes | Yes |
| Formal supplement/editing after委託 | Yes | Yes | Yes |
| Manual image upload into prepared slots | Yes | Yes | Yes |
| Company logo / agent info | Yes | Yes | Yes |
| Real-price/market data API | No or Pro | Yes | Yes |
| System-generated market research / 市調資料 | No | Yes or limited | Yes |
| API-generated aerial photo | No | No or limited | Yes |
| API-generated street-view/exterior reference | No | No or limited | Yes |
| API-generated cadastral/location map | No | Yes or Advanced | Yes |
| Floor plan manual upload | Yes | Yes | Yes |
| Floor plan generation/processing | No | No or limited | Yes |

UI layout implication:

```text
The page layout must reserve slots for images/maps/research outputs,
but the source controls differ by plan.
```

Example:

```text
Image slot: exterior photo
  Basic:
    - user uploads prepared image manually
  Advanced:
    - user can auto-fetch via API
    - user can still replace/edit manually
```

Same principle for:

- cadastral map
- location/surrounding map
- aerial photo
- street-view/exterior reference
- floor plan
- market research / 市調資料

Design rule:

```text
Do not create completely different disclosure page layouts per plan.
Use the same disclosure output slots,
but gate the automation buttons and data sources by entitlement.
```

Reason:

- The final disclosure document should remain consistent.
- Basic customers should not feel the product is incomplete.
- Advanced value comes from saving time and generating/fetching content, not from being the only tier that can complete the required document.

## Round 25 Discussion Log

Date: 2026-05-20

Fish remembered older AIRE/Jianan features that should be placed into the highest plan for now:

- `104`
- social posts / 社群貼文
- DM survey/form / DM 調查表

Docs search findings:

- `docs/release-note-v3.md` confirms the older v3 flow generated 5 documents:
  - 物調表
  - 591 PO 文
  - 銷售 DM
  - 社群貼文
  - 不動產說明書 PDF
- `docs/0417-new/建安不動產欄位總表.md` says the fields were intended to align future generation of:
  - 不動產說明書
  - 物調表
  - 591 PO 文
  - DM 文案
  - FB 導流貼文
- `docs/PRD.md` marks "產品線 B / 行銷自動化" as future/out-of-scope at that time:
  - 行銷文案生成
  - 一鍵上架準備（591/房屋網）
  - 影片劇本 / 分鏡腳本
  - AI 影片生成提示詞
  - 行銷歌曲 + MV 腳本
- `docs/2026-04-16 房仲物件流程自動化：產出五種文件與AI語音客服.md` contains the earlier discussion that the old flow generated:
  - 不動產說明書
  - 物調表
  - 591 PO 文
  - 銷售 DM
  - FB / multiple social-platform traffic posts

Current evidence gap:

```text
The docs search did not yet find a clear standalone `104` module reference.
Treat `104` as remembered old-product scope and keep it in the Advanced backlog until the original file/code is found or Fish clarifies the exact meaning.
```

Plan placement decision:

```text
Advanced / 高階版 includes future marketing automation modules:
  - 104
  - social post generation
  - DM survey/form or DM content workflow
  - 591/real-estate listing post generation
  - broader product-line-B marketing automation where relevant
```

MVP implication:

- Do not let these marketing automation modules block the first sellable disclosure MVP.
- Reserve product navigation/plan structure so these can appear under Advanced later.
- Keep customer case data local if these modules use property data.
- If future social/DM publishing requires cloud APIs, design a separate consent and data-boundary review before enabling automatic publishing.

## Round 26 Discussion Log

Date: 2026-05-20

Fish asked whether the required product information is complete enough for:

- 物件調查表
- 現場第一問 / 現場必問資料
- 法律條規
- UI/UX design that will not feel strange to customers
- avoiding repeated backend/frontend mismatch work

Reference paths Fish provided:

- `/Users/fishtv/Development/products/AIRE/0520/supastarter-nextjs-main`
- `/Users/fishtv/Development/products/AIRE/0520/spectra-app-main`

Current assessment:

```text
Content references are mostly present.
Implementation contracts are not complete enough yet.
```

What is already present:

| Area | Evidence | Status |
| --- | --- | --- |
| 物件調查表 / 現況調查 | `docs/reference-disclosure-document.md`, `docs/extracted-dossier-schema.md`, `docs/dossier-implementation-spec.md`, `0520/不動產說明書/10-房屋-現況調查表-*.JPG`, `src/lib/pdf-blocks/condition-survey.tsx` | Content exists, but current code uses generic/generated rows and must be reconciled with official/customer form pages. |
| 現場必問 / 秘書後補 | `docs/0417-old/*現場必問清單.docx`, `docs/0417-old/*秘書後補清單.docx`, `docs/dossier-implementation-spec.md` | Source files exist, but need extraction into structured schema. |
| 法律條規 | `src/lib/pdf-blocks/legal-notice.tsx`, legal-clause commands, `docs/reference-disclosure-document.md`, Round 20 legal/privacy notes | Code support exists, but legal text/contract wording still needs final review. |
| Disclosure page structure | `docs/dossier-implementation-spec.md`, `docs/extracted-dossier-schema.md`, `0520/不動產說明書/*.JPG` | Enough to define page sequence and first workbench target. |
| Draft autosave/local draft | `src/lib/use-draft-autosave.ts`, `src-tauri/src/commands/drafts.rs`, `src-tauri/src/db/drafts.rs` | Draft payload persistence exists for disclosure drafts. |
| SaaS foundation | `0520/supastarter-nextjs-main` has auth, payments, organizations, settings, plan/checkout modules | Useful for SaaS account/billing/license site, not the disclosure workbench itself. |
| Spectra workflow inspiration | `0520/spectra-app-main` README/CHANGELOG shows task/spec GUI, preflight, drift detection, progress tracking | Useful design pattern: left navigation + focused work surface + task/status tracking. |

Main gap:

```text
There is no single source of truth that maps:
  disclosure page -> UI fields -> data source -> storage location -> preview renderer -> PDF output.
```

This is the reason previous work risked backend/frontend mismatch.

Required pre-implementation artifact:

```text
AIRE Page Contract
```

For each page/workbench, define:

| Contract field | Meaning |
| --- | --- |
| Page ID | Stable identifier, e.g. `house.property_rights.page_1`. |
| Reference file | JPG/PDF/docx source. |
| User workflow | case setup, draft disclosure, formal supplement, field survey, map/photo, market, marketing. |
| Fields | exact field key, label, type, validation, default. |
| Source | registry API, manual input, field survey, secretary supplement, legal template, uploaded image, calculated system value. |
| Storage | cases table, disclosure_drafts payload, registry payload table, case_assets, settings, or future local vault table. |
| Entitlement | Basic, Pro, Advanced; manual vs automated source. |
| Preview component | right-side single-page preview target. |
| PDF renderer | HTML/PDF component that consumes the same payload. |
| Missing/待補 behavior | how empty data renders without guessing. |

UI/UX direction:

```text
Do not build one giant form.
Build page-specific workbenches with shared document slots.
```

Recommended first UI structure:

```text
AIRE App
  ├─ Case Setup
  │   └─ basic property identity and registry pull
  ├─ Draft Disclosure
  │   ├─ page list / section list
  │   ├─ left: structured table fields for selected page
  │   └─ right: official-style single-page preview
  ├─ Formal Supplement
  │   └─ same page contracts, but optimized for correcting handwritten/returned data
  ├─ Field Survey
  │   └─ questionnaire-style workbench
  ├─ Images / Maps
  │   └─ shared slots; living-function map auto-generates in MVP, manual upload remains fallback/override
  └─ Export
      └─ PDF status/checklist and output
```

Design principles:

- Case setup UI and disclosure editing UI must remain separate.
- The first usable screen should be operational, not a marketing landing page.
- Use dense, calm, work-focused UI; this is a legal/document workflow, not a decorative SaaS dashboard.
- The right preview should make the customer feel they are editing the actual formal document, not a generic web form.
- Every automated API button must have a manual fallback path.
- The same output slots should exist across Basic/Pro/Advanced; entitlement gates the automation source, not the document layout.

Development gate:

```text
Do not start broad backend implementation until the first Page Contract is written for:
  1. house property rights / 產權調查表 (`3-2+3.JPG`)
  2. house land display / 土地標示 (`4.JPG`)
  3. house field condition survey first pass (`10-房屋-現況調查表-*.JPG`)
```

This gate is intended to prevent repeating the previous failure mode where backend storage and frontend UI are built from different assumptions.

## Round 27 Discussion Log

Date: 2026-05-20

Fish provided the customer/reference source folders that should drive the disclosure MVP:

- `/Users/fishtv/Development/products/AIRE/docs/0417-new`
- `/Users/fishtv/Development/products/AIRE/docs/0417-old`
- `/Users/fishtv/Development/products/AIRE/docs/cop-scrape`
- `/Users/fishtv/Development/products/AIRE/docs/MOIAPIExample_TOKEN`

Token-efficient reading strategy:

```text
Do not read every PDF/Word/API file into chat.
Build an inventory first, extract only the selected page/workflow, then map it into Page Contracts.
```

Folder roles:

| Folder | Role | Development meaning |
| --- | --- | --- |
| `docs/0417-new` | Field master tables for building and land versions. | Use as the first source of truth for field names, source priority, and whether each value is fixed, estimated, or backfilled. |
| `docs/0417-old` | Old disclosure PDFs, old field-visit questionnaires, secretary supplement lists, physical survey templates, neighborhood/market PDFs. | Use for customer workflow details and official-looking page layout references. |
| `docs/cop-scrape` | MOI/COP service catalog, pricing, service descriptions, static API spec HTML, WFS/WMS references. | Use to map disclosure fields to real registry/cadastral API capabilities and API costs. |
| `docs/MOIAPIExample_TOKEN` | Official C# token/API sample plus paid-user service reference PDF. | Use to confirm activation/token flow: Basic Auth client id/secret -> token -> Bearer request -> service method body. |

File inventory confirmed:

| Type | Count | Notes |
| --- | ---: | --- |
| `.docx` | 29 | Main source for field master, 現場必問清單, 秘書後補清單. |
| `.pdf` | 19 | Old disclosure/reference pages are mostly scanned/image-based; `pdftotext` returns little/no text, so use screenshot/OCR/manual visual extraction for target pages only. |
| `.json` | 78 | COP service/pricing/document-link catalog. |
| `.html` | 63 | Static MOI service descriptions/API specs from `cop-scrape`. |
| `.md` | 3 | Existing summaries and field master. |
| C# sample files | 5 | Token request and API call example. |

Important content findings:

- `docs/0417-new/建安不動產欄位總表.md` already separates 建物版 and 土地版.
- Source priority in the field master is: 謄本, 合約, 現場必問, 秘書後補, 公開行情資料.
- 建物版 includes: basic property/building data, ownership/right data, usage/management, parking/equipment, defects/risk, transaction/tax fields, surroundings, market attachments, photos.
- 土地版 includes: land section/number/area/type, zoning/use controls, ownership/right data, road/access/buildability, risk, announced land value/current value, surroundings, market attachments, cadastral/aerial/site photos.
- `docs/0417-old/*現場必問清單.docx` has property-type-specific field visit questions. For house MVP, `大樓華廈_現場必問清單.docx`, `公寓_現場必問清單.docx`, `透天別墅_現場必問清單.docx`, `店面_現場必問清單.docx`, `套房_現場必問清單.docx`, `農舍_現場必問清單.docx`, `廠房_現場必問清單.docx` are relevant.
- `docs/0417-old/*秘書後補清單.docx` is the formal supplement/back-office source for registry, contract, image naming, and consistency checks.
- The old PDF cover confirms the target output is formal document style with company identity, property id/name, signature blocks, store/company info, phone, and production date.

MOI/COP service mapping candidates:

| Disclosure need | COP service candidates |
| --- | --- |
| 土地標示 / area / current value / land price | `MOI_API_001 地籍土地標示部資料服務`, `MOI_API_014 公告地價與公告土地現值資料服務` |
| 土地所有權 / rights | `MOI_API_002 地籍土地所有權部資料服務` |
| 土地他項權利 / mortgages / encumbrances | `MOI_API_003 地籍土地他項權利部資料服務` |
| 建物標示 / building area / shared portions | `MOI_API_004 地籍建物標示部資料服務`, `MOI_API_026 建物標示及權利範圍查詢服務` |
| 建物所有權 / rights | `MOI_API_005 地籍建物所有權部資料服務` |
| 建物他項權利 | `MOI_API_006 地籍建物他項權利部資料服務`, `MOI_API_028 建物權利種類及其登記狀態查詢服務` |
| 地號 / 建號 lookup | `MOI_API_007 地號資料服務`, `MOI_API_015 建號資料服務`, `MOI_API_036 門牌查建號服務`, `MOI_API_037 門牌模糊檢索建號服務` |
| 地籍圖 / cadastral map | `MOI_WFS_001/002/003 地籍圖WFS`, `MOI_WMS_001/002/003 地籍圖WMS`, `MOI_API_023 土地位置概圖服務`, `MOI_API_024 地籍圖詮釋資料` |
| Land-use risk notes | `MOI_API_018 非都市土地使用管制註記`, `MOI_API_020 土壤或地下水污染場址註記`, `MOI_API_021 地籍圖重測註記`, `MOI_API_022 公告徵收註記`, plus relevant WMS risk layers. |

API integration implication:

- The sample uses `GET https://copapi.moi.gov.tw/cp/getToken` with Basic authorization formed from `ClientID:SecretCode`.
- Service calls then use Bearer token and POST JSON arrays to a service method, for example `LandDescription/1.0/QueryByLandNo`.
- This reinforces that AIRE must keep MOI credentials out of the frontend and should route real calls through the Tauri/Rust backend or another protected local backend boundary.

Next implementation planning rule:

```text
Start with 建物版 / 房屋版本.
Use 0417-new as field master.
Use 0417-old DOCX files for field-visit and secretary supplement workflow.
Use scanned old PDFs/JPGs only as visual layout references for the selected pages.
Use cop-scrape to map fields to API service ids before wiring data fetch.
```

Round 28 decision:

- Fish confirmed that the first house-version property type can be `大樓華廈`.
- The first development artifact is `artifacts/house-building-source-inventory.md`.
- This source inventory becomes the bridge between customer documents, UI fields, local storage, entitlement behavior, API mapping, preview, and PDF output.

## Round 29 Discussion Log

Date: 2026-05-20

Fish asked whether the existing code, UI, and UX are aligned with the newly discussed direction.

Current answer:

```text
Partially aligned.
The existing code has useful foundations, but the current UI/UX is not yet the final target workbench.
```

Useful existing foundations:

| Area | Evidence | Assessment |
| --- | --- | --- |
| Case wizard | `src/components/case-wizard/CaseWizard.tsx` | Existing flow has basic case data, registry data, disclosure data, real-price step, preview/export. This can be reused as navigation logic, but not as the final document workbench shape. |
| Draft autosave | `src/components/case-wizard/CaseWizardStep3Disclosure.tsx`, `src/lib/use-draft-autosave.ts`, `src-tauri/src/commands/drafts.rs` | Good foundation for local-first editing. |
| Residential disclosure schema | `src/lib/disclosure-schema-residential.ts` | Has tabs for 標示, 權利, 稅費, 現況, 附件. Useful, but too generic and not yet mapped to customer page contracts. |
| Image upload | `src/components/case-wizard/CaseWizardStep3Disclosure.tsx`, `src-tauri/migrations/010_case_assets.sql`, `src-tauri/src/commands/case_assets.rs` | Floor-plan/planning-map upload exists. Needs general image-slot expansion for logo, exterior photos, maps, site photos, cadastral map, surrounding map. |
| Registry pull UI | `src/components/PullParcelDataButton.tsx`, `src/components/disclosure-form-residential.tsx` | Existing pull button and seven API IDs exist. Persistence must still be verified in the real Tauri path. |
| PDF/rendering blocks | `src/lib/pdf-blocks/*`, `src/lib/pdf-engine/*` | Useful renderer foundation, but HTML preview and PDF output need a shared Page Contract source. |
| Floor-plan/geo services | `src-tauri/src/commands/floor_plan*`, `src-tauri/src/geo_services/*` | Useful for Pro/Advanced automation, not a blocker for Basic MVP. |

Main mismatch:

```text
The current UI is a wizard + tabbed generic form.
The target UX is a page-specific disclosure workbench:
  left = structured fields for the selected official page
  right = formal-document preview for that same page
```

Specific alignment risks:

- `CaseWizard` currently drives steps as `基本資料 -> 地政資料 -> 揭露資料 -> 實價登錄 -> 預覽匯出`; this is close to workflow order but does not yet separate `Case Setup`, `Draft Disclosure`, `Formal Supplement`, `Field Survey`, `Images/Maps`, and `Export` as independent work surfaces.
- `DisclosureFormResidential` uses generic tabs and a generic schema. It does not yet include all 大樓華廈 fields from the field master and field-visit/supplement docs.
- `DisclosureHtmlPreview` is currently a partial preview, not the full official-style per-page preview.
- `case_assets` currently only supports `kind = floor_plan`; the MVP needs broader slots such as company logo, exterior photos, location/surrounding map, cadastral map, and field survey photos.
- Feature flags/premium controls are still mock-heavy in the frontend; plan entitlement must become SaaS-controlled Basic/Pro/Advanced behavior.
- Real migrations inspected in this pass did not show durable `land_registry_data` / `current_step` columns, while frontend types and mock backend assume those fields. Registry persistence remains a required verification/fix before relying on pulled data.

UX conclusion:

```text
The existing code can be used as scaffolding.
Do not declare the current UI "aligned" yet.
Build the new workbench by reusing autosave, schema pieces, asset upload, registry pull, and PDF blocks, but drive the UI from Page Contracts.
```

Recommended development path:

1. Keep Case Setup separate and lightweight.
2. Create `house.cover` and `house.property_rights` Page Contracts first.
3. Refactor the disclosure editing surface from generic tabs into a page-specific workbench.
4. Expand `case_assets.kind` beyond `floor_plan`.
5. Add plan entitlement checks around automation buttons, not around the manual output slots.
6. Verify registry payload persistence in the real Tauri path before binding UI previews to registry data.

## Round 30 Discussion Log

Date: 2026-05-20

Fish asked whether there are technical problems and asked to proceed with planning.

Decision:

```text
No hard technical blocker has been found for the MVP.
Proceed with a sequenced implementation plan instead of jumping directly into UI changes.
```

Planning artifact:

- `artifacts/mvp-implementation-plan.md`

The plan splits work into six streams:

1. Page Contract foundation
2. Local storage and registry persistence
3. Disclosure workbench UI
4. Asset slots
5. Entitlement and SaaS control
6. PDF and export

Technical caution:

- The MVP is feasible, but only if registry persistence and Page Contracts are handled before broad UI/PDF implementation.
- The existing code should be reused as scaffolding, not treated as already aligned final product UX.

## Round 31 Discussion Log

Date: 2026-05-20

Fish approved starting with the first Page Contract and discussing after it is done.

Created artifact:

- `artifacts/page-contract-house-cover.md`

`house.cover` defines:

- reference sources
- user workflow
- layout contract
- field contract
- summary item generation rules
- storage contract
- right-side preview contract
- PDF contract
- UI contract
- Basic/Pro/Advanced entitlement behavior
- validation rules
- acceptance criteria

Key decision in this contract:

```text
The cover page should be mostly generated from Case Setup and Branding Settings.
The cover workbench should focus on status, missing-field checklist, and optional summary editing, not a heavy duplicate form.
```

Current open questions for Fish:

1. Should MVP cover style use the conservative old PDF style first, or the newer decorative `1-封面.png` style?
2. Should missing summary lines show `待補`, or be omitted?
3. Should production date be locked to export date, or editable?

Fish answered:

- MVP should use the old/conservative PDF style first because it is easier to modify and avoids spending too much time on decorative templates.
- Missing data should render as blank space, not `待補`.
- Blank fields are intentional because the draft disclosure may be printed, taken to the owner, handwritten, and later entered back into the system.
- Production date should default to the export date, but Beta should allow manual date override.
- Hard-coded page number/page count should be removed/avoided for draft templates because attachments or inserted pages can change final ordering.

Design implication:

```text
Draft documents are working papers.
They must support handwriting and later supplement editing.
Do not make the document look "wrong" to owners by printing system placeholders like 待補.
Do not lock volatile page counts into reusable draft pages.
```

## Round 33 Discussion Log

Date: 2026-05-20

Fish asked to make sure other relevant documents, public/legal sources, `docs/cop-api`, and `docs/cop-scrape` are checked so the product does not miss required content or build against wrong API assumptions.

Created artifact:

- `artifacts/source-api-gap-audit.md`

Main findings:

1. Local 105-style format references are useful but not enough by themselves.
2. Public notices show that the 2026-01-13 MOI amendment effective 2026-04-01 adds/updates 成屋 disclosure content:
   - whether solar photovoltaic equipment is installed
   - solar photovoltaic equipment location if installed
   - building energy efficiency condition
3. These fields were added to `artifacts/house-building-source-inventory.md` as Basic manual fields first.
4. `docs/cop-api/api-format-reference.md` confirms token flow, base URLs, and parameter formats.
5. `docs/cop-scrape` confirms broader service catalog, pricing, document links, static HTML specs, WFS/WMS services, and selected service candidates.
6. Current Rust backend has a suitable generic HTTP/auth shape, including Bearer-token support when `token_endpoint` is configured.
7. Current production wiring is incomplete:
   - `land_registry_pull_data` currently uses `StaticApiKeyProvider::configured`, which leaves `token_endpoint` empty.
   - COP production requires wiring token endpoint `https://copapi.moi.gov.tw/cp/getToken`.
   - COP base URL must be explicitly configured as sandbox or production.
   - Missing service wrappers still exist for several needed services.

Backend conclusion:

```text
The backend can be connected.
It is not yet production-complete.
Before relying on it for the disclosure workbench, finish endpoint mapping, token endpoint config, missing wrappers, and real local persistence verification.
```

Product conclusion:

```text
Separate legal-required disclosure fields from sales/workflow enrichment fields.
Basic MVP should include legal-required fields and manual workflow fields.
Pro/Advanced should automate enrichment fields where reliable APIs/data sources exist.
```

## Round 34 Discussion Log

Date: 2026-05-20

Fish asked to start the next concrete Page Contract and explicitly record a past PDF export risk: Traditional Chinese fonts have previously rendered as garbled text in PDF output. Fish also noted that payment/gateway choices should be discussed later, after the disclosure/PDF foundation is clearer.

Created artifact:

- `artifacts/page-contract-house-property-rights.md`

`house.property_rights` defines:

- reference page `0520/不動產說明書/3-2+3.JPG`
- draft and formal supplement workflow
- old/conservative official-table PDF style
- field contract for visible property-rights facts and related building/rights fields
- COP/MOI API mapping for registry, ownership, encumbrance, and missing wrapper services
- local storage payload shape
- right-side preview behavior
- PDF rendering contract
- entitlement behavior across Basic / Pro / Advanced
- open questions for template default values

Important PDF risk:

```text
PDF output must not rely on browser CSS fonts.
Every React PDF export path must initialize the PDF engine and embed/register a Traditional Chinese capable font before rendering.
Current code has NotoSansTC resources and `initReactPdfEngine()`, but the implementation must verify that the export path actually calls it.
```

Required QA samples:

- `壹、產權調查表`
- `土地坐落`
- `附贈設備`
- `依標的物現況說明書賣方表達內容為準`

Payment/gateway status:

```text
Payment is intentionally parked.
Do not expand payment architecture until disclosure Page Contracts, local persistence, entitlement behavior, and the MVP PDF slice are stable enough to sell/test.
```

## Round 35 Discussion Log

Date: 2026-05-20

Fish clarified the `交易種類` behavior for `house.property_rights`.

Decision:

```text
Do not hard-code `交易種類` as `買賣`.
Use selectable options and support a custom text field.
```

MVP behavior:

- Options should include blank, `買賣`, `租賃`, `交換`, and `其他`.
- If `其他` is selected, show a manual text input.
- If no value is selected, PDF/preview renders a blank writable space.
- The normal sales path can remain fast, but the template must not assume every case is `買賣`.

Updated artifact:

- `artifacts/page-contract-house-property-rights.md`

## Round 40 Discussion Log

Date: 2026-05-20

Fish asked Codex to continue the next work automatically and only stop if a decision is needed.

Created artifact:

- `artifacts/page-contract-house-land-display.md`

`house.land_display` defines:

- reference page `0520/不動產說明書/4.JPG`
- `二、【土地標示】` layout
- land parcel table fields
- land registration reason rows
- legal/default notes for `法定建蔽率`, `法定容積率`, and `開發方式限制`
- rights / encumbrance summary fields
- storage payload shape
- preview/PDF contract
- COP/MOI mapping for land display, land ownership, land other rights, zoning/land value, and cadastral-map future slots

Key decision embedded:

```text
This page is registry-heavy, but every API-derived field must remain manually editable or blankable.
Do not rely on registry payloads until local persistence is verified.
```

Important PDF rule carried forward:

```text
Draft mode must not copy `第 4 頁 / 共 9 頁` as static text.
PDF output must use embedded Traditional Chinese fonts.
```

Open decisions for Fish later:

1. Should the legal/default notes always appear, or only appear when data exists?
2. Should `總面積` / `持分面積` display square meters only, or both square meters and converted pings?
3. Should `土地他項權利` remain in this page summary, or move to a separate rights/risk page if long?

Updated artifacts:

- `artifacts/page-contract-house-land-display.md`
- `artifacts/house-building-source-inventory.md`

## Round 41 Discussion Log

Date: 2026-05-20

Continued automatically to the next page after `house.land_display`.

Created artifact:

- `artifacts/page-contract-house-market-reference.md`

`house.market_reference` defines:

- reference page `0520/不動產說明書/5.JPG`
- transparent-price / transaction-market appendix behavior
- transaction table fields
- source and disclaimer notes
- customer signature/date line
- manual row entry first
- future real-price auto-query/import path
- local `market_snapshots` vs display/export snapshot separation
- preview/PDF contract

Product interpretation:

```text
This page is a market/reference appendix, not a registry fact page.
It helps the agent discuss nearby transactions, but the numbers need source/update/disclaimer context.
```

Implementation caution:

- Existing `src/lib/pdf-engine/html-blocks/transaction-history.tsx` can be reused/refactored.
- Existing `src-tauri/src/commands/real_price.rs` is only a thin query command and should not be treated as final production-ready market integration.
- Draft output should render blanks instead of dash placeholders when values are missing.
- Real-price data may have reporting delay and sample bias; preserve source/update/disclaimer text.

Open decisions for Fish later:

1. Should the table follow the photo's visible 5-column layout, or the existing code's clearer `地址 / 面積 / 總價 / 單價 / 交易日期` layout?
2. Should AI generate a short market interpretation paragraph later, or should MVP only show raw rows and disclaimers?

Round 49 superseded the inclusion question: this page is output-ready but optional appendix.

Updated artifacts:

- `artifacts/page-contract-house-market-reference.md`
- `artifacts/resume-after-home-checklist.md`

## Round 42 Discussion Log

Date: 2026-05-20

Continued automatically to the next page after `house.market_reference`.

Created artifact:

- `artifacts/page-contract-house-ownership-notes.md`

`house.ownership_notes` defines:

- reference page `0520/不動產說明書/6.JPG`
- `三、【產權相關注意事項】`
- 11 visible legal/risk notice topics
- controlled template behavior
- future case-highlight fields for 增建, 未承購車位, 用途不符
- preview/PDF contract

Important code finding:

```text
Current `src/components/DossierPage6Notices.tsx` is incomplete for this target.
It has 6 generic notices, while the photo has 11 practical clauses.
Implementation should not treat the current component as already aligned.
```

Product decision embedded:

```text
Normal case users should not freely rewrite these legal clauses in the workbench.
If wording changes, it should be a controlled admin/legal template update.
```

Open decisions for Fish later:

1. Should case-specific risks such as 增建, 未承購車位, or 用途不符 be highlighted visually, or remain plain text first?

Round 49 superseded the print/hide question: MVP prints fixed legal clauses by default.

Updated artifacts:

- `artifacts/page-contract-house-ownership-notes.md`
- `artifacts/resume-after-home-checklist.md`

## Round 43 Discussion Log

Date: 2026-05-20

Continued automatically to the next page after `house.ownership_notes`.

Created artifact:

- `artifacts/page-contract-house-fee-responsibility.md`

`house.fee_responsibility` defines:

- reference page `0520/不動產說明書/7.JPG`
- `貳、買賣雙方應負擔費用項目一覽表`
- seller responsibility items
- buyer responsibility items
- bottom contract/tax-authority disclaimers
- separation between responsibility wording and optional amount estimates
- preview/PDF contract

Important implementation finding:

```text
Existing tax/fee components are useful but not aligned with the reference page.
The reference page is primarily a buyer/seller responsibility list.
The existing components focus more on calculated tax values.
```

MVP decision embedded:

```text
Round 48 supersedes this initial question:
MVP supports blank, manually entered, and auto-calculated estimate values.
Normal users edit amount/note fields, not fixed wording templates.
```

Open decisions for Fish later:

1. Should tax/fee formulas be reviewed by a land administration scrivener/tax specialist before paid launch?

Updated artifacts:

- `artifacts/page-contract-house-fee-responsibility.md`
- `artifacts/resume-after-home-checklist.md`

## Round 44 Discussion Log

Date: 2026-05-20

Continued automatically to the next page after `house.fee_responsibility`.

Created artifact:

- `artifacts/page-contract-house-land-value-tax-estimate.md`

`house.land_value_tax_estimate` defines:

- reference page `0520/不動產說明書/8.JPG`
- `參、增值稅概算表`
- wide land parcel tax estimate table
- currency note
- estimate disclaimer
- manual/display values
- formula version and source snapshot metadata
- preview/PDF contract

Important implementation finding:

```text
Existing tax calculation code is useful, but it does not fully match the reference table.
It should not be treated as paid-launch tax correctness until formula/source assumptions are reviewed.
```

MVP decision embedded:

```text
Round 48 supersedes the manual-first question:
MVP supports blank, manual, and automatic tax estimate values.
Automatic tax calculation must carry formula version, source timestamp, warnings, and later tax/legal review.
AI must not invent or calculate tax amounts.
```

Open decisions for Fish later:

1. Should the wide table stay as one page with smaller text, or split into two lines/sections for readability?
2. Who should review the final land-value-increment tax formula before paid launch?

Updated artifacts:

- `artifacts/page-contract-house-land-value-tax-estimate.md`
- `artifacts/resume-after-home-checklist.md`

## Round 45 Discussion Log

Date: 2026-05-20

Continued automatically to the next page after `house.land_value_tax_estimate`.

Created artifact:

- `artifacts/page-contract-house-tax-notes.md`

`house.tax_notes` defines:

- reference page `0520/不動產說明書/9-8+9.JPG`
- general tax estimate result
- self-use tax estimate result
- seven tax caution notes
- note template versioning
- formula/source metadata
- preview/PDF contract

Product interpretation:

```text
This page is the result summary and caution-note companion to `house.land_value_tax_estimate`.
Keep it separate for now so the estimate table does not become too cramped.
```

MVP decision embedded:

```text
Round 48 supersedes the manual-first wording:
Estimate amounts may be blank, manually entered, or auto-calculated.
AI must not calculate or invent tax amounts.
Note wording should be controlled by admin/legal/tax template versioning.
```

Open decisions for Fish later:

1. Should `house.land_value_tax_estimate` and `house.tax_notes` stay as two separate pages, or combine when content is short?

Round 49 superseded the suppress/print question: MVP prints fixed tax notes by default even when values are blank.

Updated artifacts:

- `artifacts/page-contract-house-tax-notes.md`
- `artifacts/resume-after-home-checklist.md`

## Round 46 Discussion Log

Date: 2026-05-20

Continued automatically to the next reference set after `house.tax_notes`.

Created artifact:

- `artifacts/page-contract-house-condition-survey-highrise.md`

`house.condition_survey_highrise` defines:

- reference pages `0520/不動產說明書/10-房屋-現況調查表-*.JPG`
- 5-page field survey workflow
- first target property type `大樓華廈`
- normalized question model
- field survey workbench separation from case setup and draft disclosure
- fee estimate rows on survey page 5
- photo/attachment references
- preview/PDF contract

Important implementation finding:

```text
The customer reference appears to be a 38-question visual form.
Current `src/lib/disclosure-schema-building-survey.ts` defines a 58-question building survey.
Do not blindly reuse the current 58-question schema without an explicit mapping.
```

Product decision embedded:

```text
Use Page Contract driven survey templates for MVP.
Round 48 locks the MVP primary template as the photo's 38-question customer form.
Unanswered survey fields render blank checkboxes/lines in PDF, not `待補` or `未填`.
```

Open decisions for Fish later:

1. Should field photos attach to individual survey questions, or only to global case asset slots first?

Round 49 superseded the blank rendering question: use empty checkboxes plus writable space.

Updated artifacts:

- `artifacts/page-contract-house-condition-survey-highrise.md`
- `artifacts/resume-after-home-checklist.md`

## Round 47 Discussion Log

Date: 2026-05-20

Continued automatically to the final visible house-version reference page after `house.condition_survey_highrise`.

Created artifact:

- `artifacts/page-contract-house-living-function.md`

`house.living_function` defines:

- reference page `0520/不動產說明書/11-房屋-生活機能.JPG`
- map/location image slot
- nearby facility table
- auto map generation first, manual upload fallback/override
- manual facility rows first
- OSM/Overpass/map automation into the same output slots
- local `case_assets` usage
- preview/PDF contract

Important product interpretation:

```text
Round 48 supersedes the manual-first map assumption.
This page is where required auto map generation and manual fallback/override meet.
The output layout should stay stable; automation only changes how the map/table are filled.
```

Implementation caution:

- PDF should embed a local map image/data URL, not fetch a live map during PDF render.
- `case_assets.kind` must expand beyond `floor_plan` to include `location_map` / `surrounding_map`.
- Auto-generated nearby facilities should carry source/generated timestamp.

Open decisions for Fish later:

1. Should facility rows be capped at 5 like the photo, or allow dynamic extra rows/pages?
2. Should the first implementation place this page under Draft Disclosure, or under a separate Images / Maps workbench?

Round 49 superseded the fallback question: allow manual upload fallback/override and warn without blocking export.

Updated artifacts:

- `artifacts/page-contract-house-living-function.md`
- `artifacts/resume-after-home-checklist.md`

## Round 48 Discussion Log

Date: 2026-05-20

Fish locked several MVP output decisions before implementation:

```text
Use the photo's 38-question condition survey form as the MVP.
First version must automatically generate the living-function map.
Tax pages must support manual values, blank values, and automatic calculation.
Legal/tax wording uses fixed templates; normal users do not freely edit wording.
Round 49 later resolves the remaining output-scope question for 透明房價/成交行情.
```

Implementation implications:

- `house.condition_survey_highrise` should treat the current 58-question code schema as a mapping/reference problem, not the primary MVP form.
- `house.living_function` must wire an auto-map path in the first full-feature build; manual upload is fallback/override.
- `house.fee_responsibility`, `house.land_value_tax_estimate`, and `house.tax_notes` must preserve blank/manual draft behavior while allowing calculated values with formula/source metadata.
- `house.ownership_notes` and tax/legal notes are fixed-template surfaces controlled by admin/legal versioning.
- `house.market_reference` remains ready as a Page Contract; Round 49 later decides it is optional appendix output.

Updated artifacts:

- `artifacts/page-contract-house-condition-survey-highrise.md`
- `artifacts/page-contract-house-living-function.md`
- `artifacts/page-contract-house-fee-responsibility.md`
- `artifacts/page-contract-house-land-value-tax-estimate.md`
- `artifacts/page-contract-house-tax-notes.md`
- `artifacts/page-contract-house-ownership-notes.md`
- `artifacts/page-contract-house-market-reference.md`
- `artifacts/resume-after-home-checklist.md`

## Round 49 Discussion Log

Date: 2026-05-20

Fish approved the recommended defaults for the remaining MVP output decisions.

Decisions:

```text
透明房價/成交行情: first version should be able to output it, but it is an optional appendix, not mandatory output.
生活機能地圖: auto-generation is required; if it fails, allow manual upload fallback/override and warn without blocking export.
Tax values: manual and auto values must be labeled as estimates, preserving caveat wording equivalent to `概算` and `正確應納稅額以稅捐機關核發稅單金額為準`.
Fixed templates: legal and tax templates print by default; normal users do not freely edit or conditionally hide them in MVP.
38-question survey: blank answers render as empty checkboxes plus writable space.
Implementation order: fixed templates/data model first, right-side preview second, PDF renderer third.
```

Remaining discussion items are narrower:

- Exact `house.market_reference` table columns and whether AI market interpretation is later or MVP.
- Whether `house.living_function` facility rows cap at 5 or paginate dynamically.
- Whether `house.living_function` belongs in Draft Disclosure or Images/Maps workbench first.
- Whether survey photos attach per question or as global case assets first.
- Tax formula reviewer and wide-table readability.
- Case-specific legal risk highlighting style.

Updated artifacts:

- `artifacts/page-contract-house-market-reference.md`
- `artifacts/page-contract-house-living-function.md`
- `artifacts/page-contract-house-condition-survey-highrise.md`
- `artifacts/page-contract-house-land-value-tax-estimate.md`
- `artifacts/page-contract-house-tax-notes.md`
- `artifacts/page-contract-house-ownership-notes.md`
- `artifacts/mvp-implementation-plan.md`
- `artifacts/resume-after-home-checklist.md`

## Round 39 Discussion Log

Date: 2026-05-20

Fish asked the difference between the 105 official-format full version and the compact version, then decided the MVP should use the business-readable compact version around one page.

Decision:

```text
For MVP, `建物標示` should be compact and readable for business use.
Do not start with the full 105-format long layout.
```

Interpretation of current photos:

```text
The scanned company disclosure pages are not a full 105 official-format long form.
They are a company-adapted, business-readable version that compresses legal/source content into shorter pages.
```

Implementation implication:

- Keep `建物標示` around one A4 page if possible.
- Include practical fields first: `建號`, area fields, `權利範圍`, `法定用途`, `建築完成日期`.
- Use the 105 official format as a checklist so the data model and legal review do not miss important fields.
- Do not force every 105 field into the first visible PDF layout.
- If legal review later requires fuller 105 details, add them as later pages or appendix rather than bloating the first MVP page.

Updated artifact:

- `artifacts/page-contract-house-property-rights.md`

## Round 38 Discussion Log

Date: 2026-05-20

Resumed from:

- `artifacts/resume-after-home-checklist.md`

Question checked:

```text
Does another house-version page already own detailed `建物標示`, or should `house.property_rights` expand it?
```

Evidence reviewed:

- `0520/不動產說明書/4.JPG` is `二、【土地標示】`, not detailed `建物標示`.
- `0520/不動產說明書/5.JPG` is transparent-price / transaction-market reference.
- `0520/不動產說明書/6.JPG` is `三、【產權相關注意事項】`.
- `0520/不動產說明書/7.JPG` is `貳、買賣雙方應負擔費用項目一覽表`.
- OCR across the house-version image set did not find another formal page that clearly owns `建物標示`.
- `0520/不動產說明書/2-1-房屋-不一定要.JPG.JPG` contains building/area marketing facts, but it is optional and not the formal disclosure section owner.
- `0520/不動產說明書/20-(105-04-29)成屋不動產說明書格式範例.pdf` confirms 成屋 disclosure includes `建物標示、權利範圍及用途`.

Decision:

```text
`house.property_rights` should own the MVP formal `建物標示` section.
Do not keep `一、【建物標示】略` as the target behavior.
```

Implementation implication:

- Render expanded `建物標示` under the top facts.
- Include at least `建號`, area fields, and `權利範圍`.
- Keep missing values blank for handwriting.
- If the section does not fit on one A4 page, allow dynamic pagination without hard-coded page counts.
- Do not duplicate the optional marketing sheet.

Open decision for Fish:

```text
Should MVP include only the compact building fields Fish named, or the fuller 105-format details such as 坐落、門牌、主要建材、法定用途、建築完成日期?
```

Updated artifact:

- `artifacts/page-contract-house-property-rights.md`

## Round 37 Discussion Log

Date: 2026-05-20

Fish clarified the remaining `house.property_rights` decisions and asked what can continue while moving home / before shutting down the computer.

Clarification:

```text
`付款方式` on the disclosure page means payment terms for the real-estate transaction, not SaaS payment to AIRE.
```

Decisions:

- `付款方式` keeps the same control pattern as `附贈設備`: default / manual / blank.
- Default `付款方式` text is `依買賣契約為準`.
- `交易種類` initial state should be blank.
- `建物標示` can include `建號`, area fields, and `權利範圍` if this does not duplicate another required page.
- Basic/Pro breakdown can wait; first build the highest/complete disclosure capability so the full 不動產說明書 can run end-to-end.
- Payment/gateway discussion still stays later.

Building-label caution:

```text
Before implementation, inspect the next house-version pages and decide whether this page owns the detailed 建物標示 table or only a compact summary.
Avoid printing the same official section twice.
```

Operational note:

```text
If Fish shuts down the Mac, local Codex work on this workspace cannot continue because the files, shell, and dev tools are on that machine.
Before shutdown, the useful work is to persist decisions into Spectra and leave a clear next-work checklist.
```

Updated artifact:

- `artifacts/page-contract-house-property-rights.md`

## Round 36 Discussion Log

Date: 2026-05-20

Fish confirmed the `附贈設備` behavior after a visual alignment explanation.

Decision:

```text
`附贈設備` should default to the conservative template phrase, but the user must be able to replace it or clear it.
```

MVP behavior:

- Default mode prints `依標的物現況說明書賣方表達內容為準`.
- Manual mode lets the user enter a concrete equipment list.
- Blank mode leaves writable space in the printed draft.
- PDF must not print `待補`.

Rationale:

```text
Draft stage should be safe and deliverable.
Formal supplement stage should allow correction after owner discussion.
```

Updated artifact:

- `artifacts/page-contract-house-property-rights.md`
