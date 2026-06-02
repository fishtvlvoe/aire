## Problem

目前 PDF 組裝在案件沒有讀到已保存的實價登錄資料時，會在 PDF 預覽階段再次呼叫 `queryRealPrice`。這讓 reference PDF 依賴 Twinkle / open data 即時查詢；若前查流程或便民系統已經提供實價登錄資料，PDF 仍可能重複查第二個來源。

## Root Cause

`assembleDossierData` 同時負責讀案件快照與補查實價登錄，資料來源邊界不夠明確。新增案件流程已能把免費前查的實價登錄保存到 `land_registry_data.entries.real_price_query`，但 PDF 組裝仍保留即時補查 fallback。

## Proposed Solution

將案件已保存的免費前查實價登錄視為 PDF 的唯一資料來源。PDF 組裝只讀 `real_price_query` 快照；若快照不存在或為空，PDF 顯示無成交行情，不在預覽或匯出時呼叫 Twinkle / open data。

## Non-Goals

- 不移除新增案件頁的免費前查實價登錄顯示。
- 不改 COP 正式查詢、候選地段地號、或電子謄本流程。
- 不新增新的外部實價登錄 provider。

## Success Criteria

- 已保存 `real_price_query` 時，PDF 使用該快照產生成交行情。
- 已保存資料不存在時，PDF 不呼叫 `queryRealPrice`，且仍可完成 reference PDF。
- `/cases/new` 保存案件時仍會把免費前查實價登錄結果寫入 provenance。
- Spectra analyze / validate 通過。

## Impact

- Affected code:
  - Modified: src/lib/pdf-engine/assemble-dossier-data.ts
  - Modified: src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - Modified: openspec/changes/prefer-presurvey-real-price-source/tasks.md
  - New: openspec/changes/prefer-presurvey-real-price-source/specs/dossier-real-price-source/spec.md
  - New: openspec/changes/prefer-presurvey-real-price-source/design.md
  - Removed: none
