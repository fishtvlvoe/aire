## Context

目前 `disclosure_document` 欄位由 `generateDocuments` 函數呼叫 LLM 產生，但 prompt 只有佔位符文字 `[PDF 由任務 10 實作]`，導致 `/api/listings/[id]/pdf` 路由渲染空白 PDF。

現有架構：
- `src/lib/llm/` — LLM adapter 層（`LlmAdapter` interface，已完成），支援 codex/claude-code/gemini/ollama 後端
- `src/app/api/listings/[id]/pdf/route.ts` — Puppeteer PDF 生成，目前用 `<pre>` 原始文字輸出
- `src/lib/db/index.ts` — `getListing()` 返回 `field_visit_data`、`supplementary_data`、`pre_commission_data`（JSON 字串）

規格文件位置：`docs/dossier-implementation-spec.md`（16 章詳細 spec）

## Goals / Non-Goals

**Goals:**
- LLM prompt 生成完整 16 章 Markdown，章節標題固定（`#### 章節 N：標題`），供 HTML 模板 parser
- HTML/CSS 模板支援 A4 版面、頁眉/頁腳、建安 LOGO、表格樣式
- 建物版（7 類）和土地版（6 類）共用同一 prompt 框架，差異由 `property_type` 分支
- 缺值一律標 `待補`，不由 AI 猜測

**Non-Goals:**
- `system_computed` 稅費計算（另開 change）
- 照片縮圖嵌入（章節 15 僅顯示照片清單文字）
- 電子簽章（章節 16 只顯示簽名空白格）
- 實價登錄 API 串接（章節 13 顯示「外部資料待接入」）

## Decisions

### AI Prompt：固定 16 章 Markdown 結構

**決策**：prompt 明確要求每章用 `#### 章節 N：標題` 開頭，用 `---` 分隔章節，HTML parser 依章節編號切割渲染。

**原因**：固定章節標題讓 parser 穩定，不依賴 LLM 自由命名；缺值標 `待補` 避免虛構資料。

**替代方案考慮**：讓 LLM 輸出 JSON 結構 → 太複雜，LLM 容易在 JSON 中插入非法字元導致 parse 失敗。

### HTML 模板：inline CSS + Puppeteer

**決策**：使用單一 `src/lib/templates/disclosureHtml.ts` 函數，接收 16 章 Markdown 文字，輸出完整 HTML 字串，傳給現有 Puppeteer 路由。

**原因**：不引入新套件（符合限制），inline CSS 確保 Puppeteer 正確渲染中文字體；現有 PDF 路由只需替換 `html` 字串。

**替代方案考慮**：MDX/React Server Component 渲染 → 需要額外 server 設定，超出 scope。

### 建物版 vs 土地版分支

**決策**：`generateDisclosurePrompt(propertyType, data)` 函數根據 `isLandType(propertyType)` 返回不同 prompt；土地版章節 8~11 替換為基地/土地現況調查表 p1~p4。

**原因**：兩版差異只在章節 5~6、8~11，其餘 12 章結構相同；用一個函數處理分支，維護成本低。

### Markdown to HTML 轉換

**決策**：不使用外部 markdown parser；改由 HTML 模板直接接收 AI 輸出的原始文字，以 `<pre>` 保留格式，搭配 CSS `white-space: pre-wrap`。

**原因**：不引入新 npm 套件（限制）；`pre-wrap` 足夠處理縮排列表文字；視覺優先級低於「先有內容」。

## Risks / Trade-offs

- **[風險] LLM 輸出不穩定**：章節標題若被 LLM 省略或改名，PDF 內容仍可顯示但章節切割失效 → 緩解：prompt 明確規定「不得省略任何章節」，用 `awaited content` 而非 parser 依賴
- **[風險] Puppeteer 中文字體**：容器環境缺 Noto Serif TC → 緩解：HTML `<link>` 直接引用 Google Fonts CDN（若無網路則降級為系統字體）
- **[Trade-off] 稅費欄位全為 `待補`**：此版本沒有計算邏輯，客戶看到的說明書章節 10~12 全是佔位符 → 接受，以儘早交件為優先，稅費計算為後續 change
