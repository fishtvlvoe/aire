## Context

three-ai 的核心場景是：業務拿著紙本/PDF 謄本 + 權狀 + 現場照片，**回到電腦前要把這些資料抄進系統**，產出 5 種文件（物調表 / 591 PO 文 / 銷售 DM / 不動產說明書 / 社群貼文）。

目前的瓶頸是「**抄寫**」這步：
- 業務 30–40 分鐘填一個物件
- 容易漏欄位、容易抄錯數字
- 重複勞動，沒成就感

**洞察**：謄本 PDF 100% 是電子檔（地政事務所核發 + 客戶 mail 來），文字層完整，**直接讀就有結構化資料**。權狀通常是影像，但格式固定，OCR 後規則就能抽。這些事系統可以做，業務不必動手。

技術前提：
- Next.js 16 + Node 22（伺服器端可跑 OCR 與 PDF 解析）
- 已部署於客戶本機 Docker（隱私資料不離開客戶電腦 → OCR 必須本地跑）
- LLM backend 已經有 codex / claude-code / gemini / ollama 可選

## Goals / Non-Goals

**Goals:**
- 業務每物件抄寫時間 從 30–40 分 → **降到 5–8 分**（只需確認自動帶入結果 + 補空欄位）
- 自動帶入準確率 ≥ 95%（謄本電子檔）；≥ 80%（權狀照片）
- 處理失敗時可降級回全人工流程，不讓業務卡住
- 客戶資料不離開客戶電腦（OCR 本地跑、Vision API fallback 須業務 opt-in）

**Non-Goals:**
- 不做 100% 全自動（最後一關業務確認 + 簽名仍是人工）
- 不做手寫字辨識
- 不做跨國格式
- 不訓練自家 OCR 模型

## Phase 0 Spike 假設與結果

以下 4 個假設將在 Phase 0 Spike 驗證（約 1 小時），結果決定 Phase 1-6 是否需要調整。原始數據見同目錄 `spike-report.md`。

| # | 假設 | 驗證方法 | 結果 | 影響 |
|---|------|---------|------|------|
| A | pdfjs-dist 能從真實謄本 PDF 抽出中文文字層（非掃描影像） | 用 Fish 提供樣本跑 `pdfjs.getTextContent()`，檢查字數 & 中文完整度 | ✅ PASS（1975 字，100% 可讀） | Layer 1 可行，Phase 1 照原計畫 |
| B | 5 行 regex 能穩定抽 4 核心欄位（地段/地號/面積/權利範圍），命中 ≥ 3/4 | 對 Layer 1 輸出的 raw text 跑 regex，人工比對 | ✅ PASS（7/8 = 87.5%） | D8 規則 parser 可行，Task 1.4 需擴充處理「全部 + 分數」格式變異 |
| E | 掃描謄本 PDF（非電子）pdfjs 能否抽到文字 | 需額外索取掃描樣本 | 未驗證 | 若掃描 PDF 無文字層 → pipeline 要偵測並走 Layer 2 OCR |
| C | PaddleOCR 在 macOS Docker 能跑起來且中文精度堪用 | 延至 Phase 2 啟動前驗（非今日 spike） | 延後 | 決定 R2 風險嚴重度 |
| D | 業務會信任自動帶入（信任度 ≥ 80% 保留原值） | 需 Phase 5 客戶驗收才有數據 | 延後 | 決定 R3 嚴重度 |

Phase 0 只驗 A + B。C/D 留給後續 Phase。

## Decisions

### D1: 三層 OCR 策略（成本/精度平衡）

**決策**：依文件類型走不同 pipeline，避免每張都打 LLM Vision。

```
PDF 上傳
  ↓
判斷有無文字層（pdfjs.getTextContent）
  ├─ 有 → Layer 1: 直接抽 + 規則 parser（地段地號 / 面積等）
  │        信心度 0.95+ → 完成
  │        信心度低 → 走 Layer 3
  └─ 無（影像 PDF） → Layer 2: Tesseract/PaddleOCR 本地 OCR → 規則 parser
                      信心度 0.80+ → 完成
                      信心度低 → 走 Layer 3

圖片上傳（jpg/png）
  ↓
Layer 2: 本地 OCR
  ↓ 信心度評估
Layer 3: Claude Vision API（業務 opt-in，需設定 API key）
```

**理由**：
- Layer 1（PDF 文字層）佔 80% 案例（地政事務所核發都是電子檔）→ $0 成本、< 1 秒
- Layer 2（本地 OCR）佔 15%（權狀手機拍照）→ $0、5–20 秒
- Layer 3（LLM Vision）佔 5%（前兩層失敗或欄位缺失）→ $0.02–0.05，但是業務 opt-in

**替代方案**：全部送 Claude Vision → 簡單但每物件成本 $0.10+，月 100 個物件約 $10/客戶；且資料離開電腦，違反客戶隱私期望。

### D2: 欄位來源追蹤（Provenance）

**決策**：每個欄位的來源用標籤儲存，UI 顯示對應徽章。

```ts
type FieldProvenance =
  | { source: 'manual' }                    // 業務手填
  | { source: 'manual-edit' }               // 業務改過自動帶入的值
  | { source: 'ocr-pdf'; from: string; confidence: number }  // 例：from='陳世曉-謄本.pdf'
  | { source: 'ocr-image'; from: string; confidence: number }
  | { source: 'llm-vision'; from: string; confidence: number };

// 儲存於 listing.field_visit_data.__provenance.{key}
```

**UI 表現**：
- `manual` → 無徽章（預設）
- `ocr-pdf` 信心度 ≥ 0.9 → 綠色徽章「📄 已從 {filename} 帶入」
- `ocr-pdf` 信心度 < 0.9 / `ocr-image` → 黃色徽章「📄 已帶入，請確認」
- `llm-vision` → 紫色徽章「🤖 AI 推論，請確認」
- `manual-edit` → 灰色徽章「✏️ 已手動修改」

**理由**：透明可溯源 + 業務知道哪些欄位風險高需要重點檢查。

### D3: 章節順序重排（前端流程）

**決策**：建物物件流程：

```
舊流程：基本 → 建物 → 現況 → 法律 → 照片/文件 → 補充
新流程：照片/文件 → 基本 → 建物 → 現況 → 法律 → 補充
```

**實作**：在 `src/app/listings/[id]/fill/page.tsx` 的章節導航 array 中，把「照片/文件」章節 index 移到最前面。

**過渡期相容**：既有物件（已有 field_visit_data 但未上傳文件）載入時，預設停在「基本」章節（不強制跳回上傳）；新建物件預設在「照片/文件」。

### D4: 自動帶入觸發點

**決策**：上傳後立刻 trigger extract（非同步），業務在「上傳中…解析中…」期間先看其他章節。

```
上傳檔案 → POST /api/listings/{id}/attachments
   ↓ 200 OK 後立即（fire-and-forget）
POST /api/listings/{id}/extract?attachmentId=xxx
   ↓ 完成後寫入 listing.extracted_data + 推 SSE / poll 更新前端
業務切到「基本資料」時自動填入欄位 + 顯示徽章
```

**為什麼不同步等**：謄本解析 5–20 秒，業務沒必要乾等；改非同步 + 後續章節先讀現有 extracted_data。

### D5: extract 結果儲存格式

**決策**：新增 `listings.extracted_data TEXT` 欄位儲存統一 schema：

```json
{
  "by_attachment": {
    "att_uuid_1": {
      "filename": "陳世曉-謄本.pdf",
      "category": "transcript",
      "extracted_at": "2026-04-24T08:00:00Z",
      "fields": {
        "address": { "value": "台南市東區大學路1號", "confidence": 0.98 },
        "land_area": { "value": 32.5, "confidence": 0.95 },
        "owner_name": { "value": "陳世曉", "confidence": 0.99 }
      },
      "raw_text": "（OCR 原文，截斷至 5000 字元）"
    }
  },
  "merged_fields": {
    "address": { "value": "...", "from": "att_uuid_1", "confidence": 0.98 }
  }
}
```

**`merged_fields`** 是多份文件 conflict 解決後的最終結果（取信心度最高 / 最新 attachment）。`field_visit_data` 在業務首次進入章節時從 `merged_fields` 初始化。

### D6: Conflict 解決策略

**決策**：3 規則優先級（從高到低）：
1. 業務手動覆蓋（manual / manual-edit） > 任何自動值
2. 同類別文件中，**信心度高的勝**
3. 信心度相同時，**較新的 upload 勝**

例：業務上傳 2 份謄本（地號 1234-5 與 1234-6），address 欄位都被抽出。`merged_fields.address` 取最新那份。但業務可在 UI 切換「使用其他文件的值」（下拉選單）。

### D7: OCR 引擎選擇

**決策**：

| Layer | 引擎 | 為什麼 |
|-------|------|-------|
| Layer 1 | `pdfjs-dist`（已在 puppeteer 依賴鏈內） | 純 Node 套件、無外部呼叫、解 PDF 文字層 |
| Layer 2 | **PaddleOCR**（透過 Python child_process 或 docker sidecar） | 中文精度顯著優於 Tesseract；但需 Python 環境 |
| Layer 2（備用） | **Tesseract.js**（純 Node） | PaddleOCR 不可用時備用，精度較差 |
| Layer 3 | Claude Vision（透過既有 LLM_BACKEND） | 已有 backend 抽象，沿用 codex/claude-code/gemini 任一支援 vision 的 |

**理由**：本地優先（隱私）、跨平台（Windows Docker 客戶機）、有降級路徑。

**Risk**：PaddleOCR 在 Windows Docker 內可能有安裝問題 → Mitigation：Dockerfile 多階段建置 + fallback Tesseract.js。

### D8: 規則 parser 設計

**決策**：每個文件類型一個 parser file，輸入 raw text，輸出 fields object。

```
src/lib/ocr/parsers/
  ├─ transcript-land.ts    // 土地謄本
  ├─ transcript-building.ts // 建物謄本
  ├─ title-deed.ts          // 權狀
  └─ cadastral-map.ts       // 地籍圖（部分結構化）
```

**Parser 內部**：用 regex 抽結構化欄位。例：
```ts
function parseTranscript(text: string): Record<string, FieldValue> {
  const fields: Record<string, FieldValue> = {};

  const addressMatch = text.match(/坐落地址[：:](.+?)(\n|$)/);
  if (addressMatch) fields.address = { value: addressMatch[1].trim(), confidence: 0.98 };

  const areaMatch = text.match(/面積[：:]\s*([\d.]+)\s*平方公尺/);
  if (areaMatch) {
    const sqm = Number(areaMatch[1]);
    fields.land_area = { value: +(sqm / 3.3058).toFixed(2), confidence: 0.95 };
    // 平方公尺 → 坪
  }

  // ... 30–50 個欄位
  return fields;
}
```

**理由**：謄本格式高度標準化（內政部規範），regex 對印刷體 OCR 後的文字準確度高。LLM 只在 regex 失敗時補位。

## Implementation Distribution Strategy

| 任務 | 代理 | 原因 |
|------|------|------|
| Layer 1 PDF 文字層解析 + 規則 parser | Copilot CLI | 純函式 + regex |
| Layer 2 OCR 引擎封裝（PaddleOCR sidecar） | Sonnet 子代理 | 跨 process / docker 整合，複雜 |
| Layer 3 LLM Vision 接 codex backend | Copilot CLI | 沿用既有 backend 抽象 |
| extract API + 非同步 polling | Copilot CLI | 標準 REST + state 管理 |
| FieldVisitForm 欄位徽章 UI | Copilot CLI | React + Tailwind |
| 章節順序重排 + listings/new 流程改造 | Copilot CLI | UI 順序調整 |
| 整合測試 + E2E | Sonnet 子代理 | 跨多模組（upload → extract → fill 顯示徽章） |
| Code Review | Kimi MCP | 多檔分析 |

**禁用工具**：Codex、Cursor（已禁，全 change 不派）

## Risks / Trade-offs

### R1: OCR 精度不夠

風險：權狀手機拍照模糊 → OCR 抓錯地號 → 業務沒檢查就送出 → 文件出錯。
對策：
- 信心度 < 0.85 自動標紅 + 強制業務 click 「已確認」才能進下一章節
- Conflict 視覺化（如謄本說 32.5、權狀說 32.6）
- D2 provenance 追蹤，事後可回溯

### R2: PaddleOCR 在客戶 Windows Docker 安裝失敗

風險：Python 套件編譯失敗 / GPU/CPU 版本衝突 → Layer 2 整層掛掉。
對策：
- Tesseract.js 作為內建 fallback（純 Node，無 Python 依賴）
- 部署前在客戶機 dry-run 測一輪，失敗則改用 LLM Vision

### R3: 業務不信任自動帶入，全部手動覆寫

風險：自動帶入價值 = 0，多此一舉的 UI。
對策：
- 第一週每個物件回看「業務改了哪些欄位 vs 自動帶入」→ 改 parser
- 信心度透明 + 徽章設計讓業務知道「綠色徽章基本不用查」

### R4: 跨章節欄位映射錯誤

風險：謄本「面積（平方公尺）」 → 系統「建物面積（坪）」需單位換算 + 區分土地/建物。
對策：
- D8 parser 內做單位轉換 + 寫單元測試
- conflict 時不自動覆蓋，標紅讓業務決定

### R5: 多份文件 conflict（同類別不同地號）

風險：業務上傳 2 份謄本，系統不知選哪份。
對策：
- D6 conflict 規則 + UI 提供「文件來源切換」下拉
- 預設取「最新上傳 + 最高信心度」

### R6: 業務漏上傳謄本，但已習慣「自動帶入」

風險：流程依賴 OCR，沒上傳 → 業務不知道要怎麼填。
對策：
- 流程 fallback 回手填（顯示「未上傳文件，請手動輸入所有欄位」提示）
- 「跳過上傳」按鈕保留

### R7: extract 非同步可能 race（業務切章節太快）

風險：上傳後立刻切到「基本」，extract 還沒完成 → 欄位全空 → 業務以為要手填。
對策：
- 章節 header 顯示「OCR 解析中... XX% 完成」
- extract 完成時 toast「資料已帶入，請檢查欄位」
- 業務手填後 extract 才完成 → 不覆蓋已填值

## Implementation Phases

### Phase 1: Layer 1（PDF 文字層 + 規則 parser）
- 1 週工作量
- 適用 80% 案例
- 即上線可看效果

### Phase 2: Layer 2 OCR
- 2 週工作量（含 PaddleOCR Docker 整合）
- 適用權狀照片

### Phase 3: Layer 3 LLM Vision
- 1 週工作量
- 沿用既有 LLM backend

### Phase 4: 流程重排 + UI 徽章
- 1 週工作量
- 與 Phase 1 並行可行（OCR 還沒好就先把流程順序調好）

### Phase 5: 整合測試 + 客戶驗收
- 1 週

**總計**：6 週可完整 ship。Phase 1 + 4 並行可在 2 週後上線「謄本電子檔自動帶入」MVP。
