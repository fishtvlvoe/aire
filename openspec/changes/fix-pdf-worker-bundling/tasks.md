## Tasks

### Wave 1: 找 OCR 入口

- [ ] 1.1 PDF OCR worker resolution survey — 讀 src/lib/ocr/ 找出 pdfjs-dist 的 import 點與 worker 設定方式 [Tool: haiku]

  輸出：列出檔案路徑、現有 import 語法、worker 是否有設 `GlobalWorkerOptions.workerSrc`。回報 ≤200 字。

### Wave 2: 修 worker 路徑

- [ ] 2.1 PDF worker resolution fix — 依 design「決策」段，先實作「候選 1：改用 pdfjs-dist legacy build + URL 指向（推薦先試）」 [Tool: copilot-codex]

  根據 1.1 的回報，在 OCR pipeline 入口檔修改 import：
  ```typescript
  import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
  ```
  跑 `npm run build` 確認 0 errors。

### Wave 3: 驗收

- [ ] 3.1 PDF OCR end-to-end success — 跑 E2E 確認 extract 完成且 merged_fields 有值 [Tool: sonnet]

  執行：`npx playwright test e2e/autofill-upload.spec.ts --reporter=line`
  預期：4/4 全綠（特別是「extract 完成後 merged_fields 有值」）。
  若仍 fail，讀 DB extracted_data error 訊息回報，套用「候選 2：next.config.ts serverExternalPackages」為 fallback；最後手段才考慮「候選 3：換用 unpdf 或直接走 LLM Vision」。
