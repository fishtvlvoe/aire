# Page Contract: house.living_function

Date: 2026-05-20

Status: Draft for Fish review

## Purpose

`house.living_function` defines the house-version生活機能 page with a location/surrounding map and nearby facility table.

Reference page:

- `0520/不動產說明書/11-房屋-生活機能.JPG`

This page connects the disclosure output to maps, nearby amenities, manual uploads, and automation. Fish decided the first MVP version must automatically generate the map; manual upload remains a fallback/override, not the primary path.

## References

| Reference | Path | Use |
| --- | --- | --- |
| Page image | `0520/不動產說明書/11-房屋-生活機能.JPG` | Visual layout, map slot, and table columns. |
| Source inventory | `artifacts/house-building-source-inventory.md` | Surroundings and image-slot source mapping. |
| Existing React component | `src/components/DossierSurroundingMap.tsx` | Current browser map/facility UI candidate. |
| Existing map API helper | `src/lib/map-api.ts` | Browser geocode/amenity lookup candidate. |
| Existing PDF block | `src/lib/pdf-blocks/life-amenities.tsx` | Current PDF living amenities renderer candidate. |
| Tauri geo services | `src-tauri/src/geo_services/*` | Existing OSM map, nearby amenities, aerial/street-view service candidates. |

## Observed Page Structure

From `11-房屋-生活機能.JPG`:

```text
Header:
  建安不動產 logo/name
  物件編號
  物件名稱

Top visual:
  map image / surrounding area screenshot with location marker

Table:
  編號
  名稱
  類別
  距離(公尺)

Example rows:
  1 臺南市立體育場 / 生活便利 / 1100
  2 台灣中油 / 生活便利 / 350
  3 文化中心 / 生活便利 / 1700
  4 大東夜市 / 生活便利 / 1500
  5 國立臺南大學 / 各級學校 / 900
```

## User Workflow

```text
Case Setup
  ↓
Location/address/coordinates available or manually entered
  ↓
Living Function Workbench
  auto-generate map image from address/coordinates
  allow manual map override/fallback if needed
  ↓
Edit nearby facility rows
  ↓
Right preview shows map + table
  ↓
Draft / final PDF export
```

## Layout Contract

MVP visual direction:

- Use the old/conservative PDF style.
- Large map image on top.
- Facility table below.
- Keep table readable and not overly decorative.
- Missing values render blank, not `待補`.
- Do not hard-code page number/page count in draft output.

Required visual zones:

1. Header row with property id/name and company mark.
2. Map/location image.
3. Nearby facility table.
4. Optional final-export page number only if final mode later enables dynamic numbering.

## Field Contract

| Field key | Label | Type | Required | Primary source | Manual fallback / override | Target storage | Preview/PDF slot | Missing behavior | Entitlement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `living_function.case_no` | 物件編號 | text | yes | `cases.case_no` | Case Setup | `cases` | Header | Blank/checklist warning | Complete build first |
| `living_function.case_name` | 物件名稱 | text | yes | `cases.case_name` | Case Setup | `cases` | Header | Blank/checklist warning | Complete build first |
| `living_function.address_text` | 地址/位置文字 | text | no | Case Setup / field survey | Manual | `cases`, `disclosure_drafts` | Hidden/source status | Blank | Complete build first |
| `living_function.latitude` | 緯度 | number | no | Geocode/manual | Manual | `disclosure_drafts`, future `geo_snapshots` | Hidden/source status | Blank | Complete build first |
| `living_function.longitude` | 經度 | number | no | Geocode/manual | Manual | `disclosure_drafts`, future `geo_snapshots` | Hidden/source status | Blank | Complete build first |
| `living_function.map_asset_id` | 位置圖/周邊圖 | asset ref | yes for MVP generation path | Map API / OSM map renderer | Manual upload override/fallback | `case_assets`, `disclosure_drafts` | Map slot | Blank image area with checklist warning | Complete build first |
| `living_function.map_source` | 地圖來源 | enum/text | no | System/manual | Manual | `disclosure_drafts` | Source/checklist | Blank | Complete build first |
| `living_function.facilities[].index` | 編號 | number | yes | System/manual | Manual | `disclosure_drafts` | Table | Auto/blank | Complete build first |
| `living_function.facilities[].name` | 名稱 | text | yes | Field visit / map search | Manual | `disclosure_drafts`, future `geo_snapshots` | Table | Blank | Complete build first |
| `living_function.facilities[].category` | 類別 | select/text | no | Field visit / map search | Manual | `disclosure_drafts`, future `geo_snapshots` | Table | Blank | Complete build first |
| `living_function.facilities[].distance_m` | 距離(公尺) | number/text | no | System distance / manual | Manual | `disclosure_drafts`, future `geo_snapshots` | Table | Blank | Complete build first |
| `living_function.generated_at` | 產生時間 | datetime/text | no | System | System/manual | `geo_snapshots`, `disclosure_drafts` | Hidden/checklist | Blank | Complete build first |

Facility category examples:

- `生活便利`
- `各級學校`
- `公園綠地`
- `交通`
- `醫療`
- `市場商圈`
- `其他`

## Asset / API Mapping

| Source | Current status | MVP behavior |
| --- | --- | --- |
| Automatic map generation | Existing OSM map service candidate exists in Tauri geo services | Required for first MVP version; generate an embeddable local map image from address/coordinates. |
| Manual map upload | Needed as fallback/override | User can upload a map/screenshot into `case_assets` if auto generation fails or needs replacement. |
| `case_assets.kind` | Currently known to be too narrow in planning; needs expansion beyond `floor_plan` | Add `location_map` / `surrounding_map` kind later. |
| `src/components/DossierSurroundingMap.tsx` | Existing browser map component candidate | Useful for UI, but not enough for stable PDF image by itself. |
| `src/lib/map-api.ts` | Existing geocode/amenity helper candidate | Candidate for fetching facilities. |
| `src-tauri/src/geo_services/overpass` | Existing nearby amenity service candidate | Candidate for local-app automation. |
| `src-tauri/src/geo_services/osm_map` | Existing OSM location map candidate | Candidate for map image generation. |
| `src-tauri/src/geo_services/nlsc_aerial` | Existing aerial image candidate | Higher automation/visual appendix, not required for this page's MVP. |
| `src-tauri/src/geo_services/mapillary` | Existing street-view candidate | Higher automation/visual appendix, not required for this page's MVP. |

MVP rule:

```text
First version must auto-generate the location/surrounding map.
Manual map upload remains available as fallback/override.
Facility rows may be auto-fetched or manually edited, but the output slot stays fixed.
```

## Storage Contract

Target `disclosure_drafts.payload_json` shape:

```json
{
  "page_contract_version": 1,
  "living_function": {
    "address_text": "",
    "latitude": null,
    "longitude": null,
    "map_asset_id": "",
    "map_source": "auto_generated",
    "facilities": [
      {
        "index": 1,
        "name": "臺南市立體育場",
        "category": "生活便利",
        "distance_m": "1100"
      }
    ],
    "generated_at": ""
  }
}
```

Map images should live in local `case_assets`. Raw geo/amenity snapshots should stay local and not upload property context to AIRE Cloud.

## Preview Contract

Right-side preview payload:

```ts
interface HouseLivingFunctionPreviewPayload {
  caseNo: string;
  caseName: string;
  companyName?: string;
  logoDataUrl?: string | null;
  mapImageDataUrl?: string | null;
  mapSource: string;
  facilities: Array<{
    index: number;
    name: string;
    category: string;
    distanceM: string;
  }>;
  draftMode: boolean;
  showPageNumber: boolean;
}
```

Preview requirements:

- A4 portrait.
- Map image keeps stable aspect ratio.
- Facility table shows at least 5 rows cleanly.
- Missing values render blank.
- No `待補`.
- No hard-coded page count in draft mode.
- If auto map generation fails, show blank image area in draft mode, surface a checklist warning outside the printable body, and allow manual upload override.

## PDF Contract

PDF export must use the same normalized payload as the HTML/right-side preview.

Font/image requirements:

- PDF must use embedded/registered Traditional Chinese capable font.
- Every PDF export path must call `initReactPdfEngine()` before rendering with `@react-pdf/renderer`.
- Renderer must not rely on browser CSS fonts for PDF output.
- Map image must be embedded from a local asset/data URL, not fetched live during PDF render.
- Add verification with Chinese sample text from this page:
  - `生活便利`
  - `各級學校`
  - `距離(公尺)`
  - `臺南市立體育場`

## UI Contract

Workbench surface:

```text
Images / Maps or Draft Disclosure
  Page list: 生活機能

  Left panel:
    Map upload / auto-generate controls
    Facility table editor
    Source/generated-at status
    Missing-field checklist

  Right panel:
    Official-style map + facility table preview
```

Editable here:

- auto-generate map action/status
- map image upload/replace fallback
- facility rows
- category/distance values
- source note if needed

## Entitlement Contract

Current build direction:

- Build the complete/highest-capability disclosure workflow first.
- Do not block this Page Contract on Basic/Pro packaging.

Future packaging direction:

- Manual upload and manual facility rows can be available for disclosure completion.
- Fish's current MVP requires auto map generation in the first full-feature build; later Basic/Pro packaging may decide whether lower tiers can keep automation or use manual fallback.
- The output slot should remain stable; plan gates automation, not the document layout.

## Validation Rules

Draft mode:

- Map image may be blank.
- Facility rows may be blank.
- Checklist should show missing recommended map/facility content outside the printable body.
- If auto generation fails, preserve the draft instead of blocking the whole disclosure.
- Final export should warn but not hard-block if the map is manually overridden or intentionally left blank.

Final mode:

- Warn if no map image exists.
- Warn if no facility rows exist.
- Warn if auto-generated rows are stale or missing source timestamp.

Do not block final export until product/legal review defines hard requirements.

## Page Number Rule

- Draft mode: no hard-coded page count.
- Final mode: dynamic numbering may be added later after all inserts/attachments are assembled.

## Acceptance Criteria

- Page Contract maps the visible map/table structure from `11-房屋-生活機能.JPG`.
- Missing map/facility values render blank in preview/PDF.
- The first MVP implementation auto-generates the map image into a local asset.
- The page supports manual map upload override/fallback and manual facility row edits.
- Existing `NotoSansTC` font initialization is required in all PDF paths.
- PDF and preview consume one normalized payload.
- No property data is uploaded to AIRE Cloud.

## Implementation Notes

Potential reusable modules:

- `src/components/DossierSurroundingMap.tsx`
- `src/lib/map-api.ts`
- `src/lib/pdf-blocks/life-amenities.tsx`
- `src-tauri/src/geo_services/overpass`
- `src-tauri/src/geo_services/osm_map`

Likely new/changed modules later:

- `src/lib/page-contracts/house-living-function.ts`
- `src/components/disclosure-workbench/HouseLivingFunctionPanel.tsx`
- `src/components/disclosure-workbench/HouseLivingFunctionPreview.tsx`
- `src/lib/pdf-engine/normalize-house-living-function.ts`
- `src/lib/pdf-blocks/house-living-function-page.tsx`

## Open Questions For Fish

1. Should facility rows be capped at 5 like the photo, or allow dynamic extra rows/pages?
2. Should the first implementation place this page under Draft Disclosure, or under a separate Images / Maps workbench?
