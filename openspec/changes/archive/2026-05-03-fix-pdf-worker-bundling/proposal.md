## Why

謄本 PDF 上傳成功並觸發 extract pipeline 後，pipeline 立即失敗，error 訊息為：

```
Setting up fake worker failed: "Cannot find module
'.../next/dev/server/chunks/pdf.worker.mjs'"
```

`pdfjs-dist` 在 Next.js 16 dev mode 下找不到自己的 worker 檔，導致所有 PDF OCR 立即 fail。`fix-upload-extract-wiring` 已修好「上傳→觸發 extract」的接線，但 OCR 引擎本身斷掉，使 `merged_fields` 永遠為空，autofill 對使用者完全無效。

## What Changes

- 修正 `pdfjs-dist` worker 在 Next.js dev / production 兩種模式下的解析路徑
- 候選方案（交給 design 評估）：
  1. 改用 `pdfjs-dist/legacy/build/pdf.worker.min.mjs` 並用 `new URL(..., import.meta.url)` 指向
  2. 在 `next.config.ts` 設 `serverExternalPackages: ['pdfjs-dist']` 跳過 bundling
  3. 改用 server-side replacement（如 `unpdf` 或直接走 LLM Vision route）
- 加 E2E 測試：上傳謄本 → 等 60s → `extract-status` 必須 `done` 且 `merged_fields_count > 0`

## Non-Goals

- 不改 LLM 抽欄位邏輯（prompt、欄位 mapping 維持）
- 不改 attachments API / wiring（已由 fix-upload-extract-wiring 修好）
- 不重構 OCR pipeline 架構

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `pre-listing-data-collection`：PDF OCR 必須能在 Next.js dev / production 兩種模式下成功執行，不可因 bundler 找不到 worker 檔而 100% fail

## Impact

- Affected specs: `pre-listing-data-collection`
- Affected code:
  - 可能 Modified: `next.config.ts`、`src/lib/ocr/`（pdf 解析入口）、`package.json`（若需換套件）
  - 預期改動範圍小（< 30 行）
