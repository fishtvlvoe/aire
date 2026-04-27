## Context

`pdfjs-dist` 是 OCR pipeline 的 PDF 文字抽取工具。Next.js 16 的 Turbopack（dev）和 webpack（prod）對 `import 'pdfjs-dist'` 的處理方式不同，dev mode 把 worker 檔的 import 解析到 `.next/dev/server/chunks/pdf.worker.mjs`，但 turbopack 沒有把該 worker 檔複製過去，導致 runtime require fail。

實測證據（2026-04-27）：
- `POST /api/listings/192/attachments` 成功
- 1 秒後 `extract-status` 回 `{status:"failed", failed:1}`
- DB `extracted_data.by_attachment[*].error` = `Cannot find module '.../pdf.worker.mjs'`

## Goals

1. PDF 上傳後 OCR pipeline 不因 worker bundling 失敗
2. dev 與 prod 兩種模式都能跑
3. 不影響既有 wiring 與 LLM 抽欄位邏輯

## Non-Goals

- 不重寫 OCR pipeline
- 不改 prompt / merged_fields 規則

## Design

### 候選 1：改用 pdfjs-dist legacy build + URL 指向（推薦先試）

```typescript
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url
).toString();
```

**優點**：legacy build 有 polyfill，server-side Node 環境穩定。
**缺點**：需確認 turbopack 接受 `import.meta.url` 這個 hint。

### 候選 2：next.config.ts serverExternalPackages

```typescript
const nextConfig = {
  serverExternalPackages: ['pdfjs-dist'],
};
```

**優點**：跳過 bundling，由 Node 原生 require。
**缺點**：可能影響其他 server-side import；只是繞過，不一定根治。

### 候選 3：換用 unpdf 或直接走 LLM Vision

**優點**：unpdf 為 serverless 設計，無 worker 依賴。
**缺點**：替換套件範圍大，影響超出本 change scope。

### 決策

先試候選 1；若 dev mode 仍失敗，加候選 2 為保險。

## Verification

E2E：`npx playwright test e2e/autofill-upload.spec.ts:120` — 4/4 全綠。
