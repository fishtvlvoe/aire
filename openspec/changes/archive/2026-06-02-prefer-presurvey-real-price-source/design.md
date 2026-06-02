## Context

第一階段免費前查的實價登錄資料已在新增案件流程中保存為 `land_registry_data.entries.real_price_query`。PDF 預覽階段不應再把「取得資料」和「組裝文件」混在一起，否則 reference PDF 會受外部查詢速度、API 失敗或資料源差異影響。

## Decision 1: Saved pre-survey real-price data is the PDF source of truth

PDF 組裝 SHALL 只使用案件保存的 `real_price_query` 快照。這份資料可能來自便民系統前查、既有免費前查整合，或新增案件頁已完成的免費查詢，但進入 PDF 前都必須先保存到案件資料。

## Decision 2: PDF preview must not perform live real-price lookup

`assembleDossierData` SHALL NOT call `queryRealPrice` when assembling preview/export data. Missing real-price data is an acceptable empty state, not a reason to hit Twinkle / open data during PDF generation.

## Decision 3: Creation-time lookup remains allowed

新增案件頁仍 MAY 執行免費實價登錄查詢並顯示結果；保存案件時 SHALL persist records under `real_price_query` so the PDF can consume them later.

## Failure Modes

- Saved records are empty: PDF shows no transaction history and still renders.
- Saved records are present but from a different district: existing filtering still prevents unrelated records from entering PDF.
- External real-price provider is slow or unavailable: PDF preview/export is unaffected because it does not call the provider.

## Verification

- Unit test proves persisted `real_price_query` is used without calling `queryRealPrice`.
- Unit test proves missing persisted records do not call `queryRealPrice`.
- Focused Vitest, Spectra analyze, and Spectra validate pass.
