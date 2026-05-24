## Why

Fish 在還沒取得屋主正式委託與謄本前，仍需要一份可帶去洽談的房屋參考資料。AIRE 不能因為正式建號、所有權或他項權利尚未取得，就讓整份物調表像壞掉一樣大片空白。

## What Changes

- 新增「屋主洽談前參考物調表」輸出規則：可查、可候選、可合理推測的資料先填入 PDF，並標示資料來源。
- 修改候選資料策略：單一土地候選與最可能建物候選可作為前期參考來源，但不得偽裝成正式謄本資料。
- 修改同棟推測策略：同棟同尾碼戶別可提供面積、用途、完成日、建材、樓層與持分等參考值，並標示為推測資料。
- 修改 PDF 空白策略：取得日期、權狀字號、他項權利、抵押權、擔保金額、存續期間等無可靠來源欄位保持空白，方便列印後手寫補件。
- 修改驗收：裕農路地址在沒有正式謄本時仍要產出可洽談版本，且 PDF 必須保留「地政資料，最終以正式謄本為主；本說明書不代表完整資訊。」聲明。

## Non-Goals

- 本次不做正式電子謄本自動申領、代登入、存官方帳密、憑證讀卡或 RPA 操作官方網站。
- 本次不把 COP API 或公開候選資料當成正式謄本。
- 本次不要求無可靠來源的正式所有權、取得日期、抵押權、他項權利欄位顯示提示文字；這些欄位要留白。
- 本次不新增雲端同步，也不改變 AIRE 本機資料優先的產品定位。
- 本次不重做既有 UI/UX 骨架，只補資料規則、PDF 顯示與驗收。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `land-registry-address-lookup`: 地址查詢與候選資料需要支援前期洽談參考來源，而非只等待正式唯一建號。
- `dossier-data-assembly`: dossier assembly 需要依資料信任等級解析正式、候選、推測與留白欄位。
- `property-data-sheet`: 物件資料表需要可顯示洽談前參考值、來源標記與留白欄位。
- `disclosure-pdf-render`: PDF 輸出需要保留正式謄本聲明，且不可把無可靠資料欄位塞成提示文字。

## Impact

- Affected specs: land-registry-address-lookup, dossier-data-assembly, property-data-sheet, disclosure-pdf-render
- Affected code:
  - Modified: src/app/(dashboard)/cases/new/page.tsx
  - Modified: src/components/workbench/DemoAlignedWorkbench.tsx
  - Modified: src/lib/pdf-engine/assemble-dossier-data.ts
  - Modified: src/lib/pdf-blocks/property-data-sheet.tsx
  - Modified: src/lib/pdf-engine/html-blocks/property-data-sheet.tsx
  - Modified: e2e/candidate-parcel-options-presurvey.spec.ts
  - New: e2e/pre-owner-talk-reference-dossier.spec.ts
- Dependencies 新增: none
- 環境變數新增: none
