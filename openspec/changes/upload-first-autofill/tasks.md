# Tasks: upload-first-autofill

## Phase 0: Spike 驗證關鍵假設（1 小時，Gate：決定 Phase 1-6 是否需大改）

> 驗證 design.md 中 4 個未驗證假設。跑完把結果寫入 `spike-report.md` 與 `design.md` 的「Phase 0 Spike Results」段落。PaddleOCR 安裝驗證延至 Phase 2 啟動前。

- [x] 0.1 準備樣本：把 Fish 提供的真實謄本 PDF 複製到 `/tmp/sample-transcript.pdf`（含姓名，不對外，僅本機 spike 用）。[Tool: 主對話]
- [x] 0.2 **假設 A** — pdfjs-dist 能從真實謄本抽出中文文字層。跑 `pdfjs.getDocument().getTextContent()`，記錄：有無文字層、字數、中文亂碼率。**結果：PASS（1975 字，100% 可讀）** [Tool: 主對話]
- [x] 0.3 **假設 B** — 5 行 regex 能穩定抽出 4 核心欄位（地段、地號、面積、權利範圍）。命中率目標 ≥ 3/4。**結果：PASS（7/8 = 87.5%）** [Tool: 主對話]
- [x] 0.4 寫 `spike-report.md`：4 假設逐一記錄「結果、數據、是否通過、下一步建議」。[Tool: 主對話]
- [x] 0.5 Gate 決策：Phase 1 照原計畫跑，Task 1.3/1.4 微幅補強（filler strip + 頁面分類 + 權利範圍雙 pattern）。[Tool: 主對話]

## Phase 1: Layer 1 PDF 文字層解析（MVP 核心，2 週）

- [ ] 1.1 Schema migration：新增 `listings.extracted_data TEXT NULL` 欄位 + `src/lib/db/schema.ts:initDb()` 動態 ALTER；migration 檔 003_add_extracted_data.sql。[Tool: 主對話]
- [ ] 1.2 [P] 建立 OCR 抽象層：`src/lib/ocr/index.ts` 定義 `OCRResult` type + `runOcrPipeline(attachmentPath, category) → Promise<ExtractedFields>`。[Tool: copilot-codex]
- [ ] 1.3 [P] Layer 1 PDF 文字層抽取：`src/lib/ocr/pdf-text-layer.ts` 用 `pdfjs-dist` 抽文字，回傳 `{ text: string, hasTextLayer: boolean }`。無文字層 → 回 hasTextLayer=false。[Tool: copilot-codex]
- [ ] 1.3b 預處理：`src/lib/ocr/text-cleanup.ts` — strip `*` 填充字元、全形空白、奇異換行；輸出乾淨 text。[Tool: copilot-codex]
- [ ] 1.3c Section splitter：`src/lib/ocr/section-splitter.ts` — 用 `*** XXX部 ***` header 切分成多個 section object `{ name: '土地標示部', text: '...' }`。[Tool: copilot-codex]
- [ ] 1.4a Normalize 共用層：`src/lib/ocr/normalize.ts` — 日期（民國→西元）、面積（移除,/單位→float）、地價（移除,/單位→int）、權利範圍（X分之Y/全部→Y/X）、空值（(空白)→null）、層數（010層→10）、地號拆解（縣+區+段+號+raw）。依 design.md D8 normalize 規則。[Tool: copilot-codex]
- [ ] 1.4 規則 parser — 土地：`src/lib/ocr/parsers/land-parser.ts`。處理 3 個 section（標示部 / 所有權部 / 他項權利部），欄位清單依 design.md D8 表格 + sample-inventory.md。[Tool: copilot-codex]
- [ ] 1.5 規則 parser — 建物：`src/lib/ocr/parsers/building-parser.ts`。處理 3 個 section（標示部 / 所有權部 / 他項權利部）。含列表型欄位（層次、附屬建物、共有部分、建物座落地號）。[Tool: copilot-codex]
- [ ] 1.5b Mixed parser 組合器：`src/lib/ocr/parsers/mixed-parser.ts` — 依 section-splitter 結果，決定呼叫 land-parser / building-parser，合併輸出為單一 ExtractedFields object。[Tool: copilot-codex]
- [ ] 1.6 單元測試：把 26 份黃金 YAML 樣本（脫敏後）複製到 `__fixtures__/`，每份 yaml 當 expected 輸出，驗證 parse(rawText) === yaml。目標 ≥ 23/26 通過（88%）。[Tool: sonnet]
- [ ] 1.7 extract API endpoint：`POST /api/listings/[id]/extract` 接 attachmentId 或全部未解析，執行 pipeline、寫入 extracted_data。[Tool: copilot-codex]
- [ ] 1.8 attachments POST 完成後非同步觸發 extract（fire-and-forget + 寫入 extracted_data）。[Tool: copilot-codex]

## Phase 2: Layer 2 本地 OCR（2 週）

- [ ] 2.1 評估 PaddleOCR vs Tesseract.js：spike 兩者在 3 份脫敏權狀照片上的中文精度，寫 decision memo 放 design.md。[Tool: 主對話]
- [ ] 2.2 PaddleOCR sidecar 整合：`server/ocr-sidecar/` Python 服務（Docker container），暴露 `POST /ocr` 端點接收圖片 base64，回傳 text。Dockerfile + docker-compose 整合至客戶端 stack。[Tool: sonnet]
- [ ] 2.3 Tesseract.js fallback：`src/lib/ocr/tesseract.ts`，PaddleOCR 不可用時走此路徑。純 Node，無外部依賴。[Tool: copilot-codex]
- [ ] 2.4 Image preprocess：`src/lib/ocr/image-preprocess.ts` — 對權狀照片做旋轉校正（基於 EXIF）+ contrast 拉伸。[Tool: copilot-codex]
- [ ] 2.5 規則 parser — 權狀：`src/lib/ocr/parsers/title-deed.ts`。欄位：權狀編號、物件地址、面積、所有權人、建號/地號。[Tool: copilot-codex]
- [ ] 2.6 整合測試：10 張模擬權狀照片 → OCR 結果 → parser → 驗證準確率 ≥ 80%。[Tool: sonnet]

## Phase 3: Layer 3 LLM Vision（1 週）

- [ ] 3.1 LLM Vision 抽象層：擴充 `src/lib/codex-client/` 的 backend adapter，新增 `runVision(imagePath, prompt) → Promise<string>` 介面。[Tool: copilot-codex]
- [ ] 3.2 Vision prompt 設計：`src/lib/ocr/llm-vision-prompts.ts`，針對每類文件（謄本 / 權狀 / 合約）寫抽欄位的 prompt template。[Tool: copilot-codex]
- [ ] 3.3 業務 opt-in UI：`src/components/LLMVisionConsentDialog.tsx` 首次啟用時顯示隱私提示。[Tool: copilot-codex]
- [ ] 3.4 Layer 1+2 失敗時自動降級至 Layer 3（若 opt-in）；同時標記為「llm-vision」provenance。[Tool: copilot-codex]

## Phase 4: 流程重排 + UI 徽章（與 Phase 1 並行，1 週）

- [ ] 4.1 章節順序重排：`src/app/listings/[id]/fill/page.tsx` 把「照片/文件」移到第一個 tab，並且新建物件預設停留在該 tab。[Tool: copilot-codex]
- [ ] 4.2 「跳過上傳，全部手動輸入」按鈕：upload tab 右上角，點擊後 navigate 到下一 tab（基本資料）。[Tool: copilot-codex]
- [ ] 4.3 FieldVisitForm 欄位徽章：render 欄位時讀 `extracted_data.merged_fields.<key>`，根據 provenance 顯示綠/黃/紫/灰徽章。[Tool: copilot-codex]
- [ ] 4.4 SupplementaryForm 同上：補充資料章節的欄位也要支援自動帶入徽章。[Tool: copilot-codex]
- [ ] 4.5 Conflict 切換 UI：欄位旁顯示「另有 N 份文件值為 X，切換」下拉（僅 conflict 時顯示）。[Tool: copilot-codex]
- [ ] 4.6 「OCR 解析中」進度指示：章節 header 加 spinner + 進度條，extract 完成後變 toast「資料已帶入，請檢查」。[Tool: copilot-codex]
- [ ] 4.7 extract 非同步 polling：前端每 2 秒查一次 `extracted_data.by_attachment` 數量，直到所有上傳的 attachment 都有 entry。[Tool: copilot-codex]

## Phase 5: 整合測試 + 驗收（1 週）

- [ ] 5.1 E2E 測試：Playwright spec 覆蓋「上傳謄本 PDF → extract → 切基本資料 → 欄位自動帶入 + 徽章 → 修改欄位 → 徽章變灰」完整流程。[Tool: sonnet]
- [ ] 5.2 精度驗證：準備 20 份真實脫敏謄本 + 10 份權狀，跑 extract 並統計：
  - Layer 1 準確率（目標 ≥ 95%）
  - Layer 2 準確率（目標 ≥ 80%）
  - Layer 3 補位率（Layer 1+2 miss 的欄位，Layer 3 能補多少）
  [Tool: sonnet]
- [ ] 5.3 客戶驗收會議：帶 20 份已抄過的歷史物件，現場上傳 → 對比原始業務填值 → 業務 review 自動帶入結果 → 統計「免修改率」。[Tool: 主對話]
- [ ] 5.4 跨檔 Code Review：Kimi MCP 審查 OCR + parser + UI 徽章 diff，重點：
  - OCR 失敗時 fallback 完整性
  - extract 非同步 race condition
  - 業務手填值不被覆蓋的邏輯
  - 隱私（Layer 3 opt-in 不會誤傳）
  [Tool: kimi]

## Phase 6: 上線 + 迭代（持續）

- [ ] 6.1 灰度部署：第一週只對 1 個客戶啟用，收集「業務手動覆蓋的欄位」→ 反哺 parser 規則。[Tool: 主對話]
- [ ] 6.2 Parser 迭代：根據第一週實戰資料，每週更新 transcript-land / transcript-building / title-deed 三個 parser，提升準確率。[Tool: copilot-codex]
- [ ] 6.3 新文件類型（合約 / 地籍圖）：若客戶常用，後續新增 parser。[Tool: copilot-codex]

---

## Open Questions（進 apply 前須釐清）

1. **OCR 失敗時是否阻擋流程**？（proposal 提及，待業務確認）
2. **多份同類文件 conflict 優先級是否要讓業務自訂**？
3. **隱私：Layer 3 API 是否預設關閉**？（傾向是，要 opt-in）
4. **權狀手機拍照的最低品質要求**（解析度、光線）是否要寫進 UI 提示？
5. **既有物件回填**：要不要提供「一鍵用上傳的檔案重新 extract 並覆蓋」功能？

## Phase 優先順序建議

| Phase | 時間 | 優先 | 價值 |
|-------|------|------|------|
| Phase 1 | 2 週 | **最高** | 解 80% 案例（電子檔謄本）|
| Phase 4 | 1 週（並行 P1） | **最高** | UI 視覺效果立刻能 demo |
| Phase 5（部分） | 1 週 | **高** | 前 3 階段一起驗收 |
| Phase 2 | 2 週 | 中 | 權狀照片用 |
| Phase 3 | 1 週 | 低 | 備援，opt-in |
| Phase 6 | 持續 | 高 | 上線後才能做 |

**建議推進節奏**：
- 第 1-2 週：Phase 1 + Phase 4（主對話 + Copilot），MVP 可 demo
- 第 3 週：Phase 5 前半 + 客戶驗收
- 第 4-5 週：Phase 2（權狀 OCR）
- 第 6 週：Phase 3（Layer 3）+ Phase 5 全量 + 客戶上線

---

**⚠️ 代理分工護欄**：
- 所有 `[Tool: copilot-codex]` 任務 MUST 加 `--add-dir src/` `--add-dir server/ocr-sidecar/` `--add-dir migrations/` 限制範圍
- Copilot CLI prompt 結尾 MUST 加：「禁止修改或刪除 openspec/ 目錄下的任何檔案；禁止跑任何 git 指令（status / diff 除外，特別禁止 clean / restore / reset / checkout）」
- 所有 `[Tool: sonnet]` 任務由 Sonnet 子代理執行
- `[Tool: kimi]` 任務用 `kimi_analyze` MCP
- 主對話（Opus）不寫程式碼，只負責派工、整合、驗收
- **Codex 與 Cursor 已禁用**（品質不穩），不在本 change 派工選項內
