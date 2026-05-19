## Context

AIRE 現在的成屋表單已經有「附件」tab，裡面有 `attachment_floor_plan`，UI 文案是「附建物平面圖」。目前它只是是/否/未知欄位，不能承接真正的格局圖檔、手稿、審核紀錄或 PDF 輸出圖。

這次需求的重點不是讓業務學繪圖工具，而是把現場最自然的「紙筆手稿」接進系統：業務在現場畫好，回店內交給助理拍照或上傳，AIRE 協助整理成乾淨圖。因為會進不動產說明書，系統必須把責任鏈做清楚：原始手稿保留、AI 只做辨識草稿、人工確認、系統固定規則重畫、PDF 標示來源與限制。

法律風險的核心解法：不要把它叫「測量圖」或「權利範圍圖」，而是「現場手稿整理圖」。正式 PDF 顯示乾淨格局圖，同時保存原始手稿與確認紀錄供爭議回查。

## Goals / Non-Goals

**Goals:**

- 讓業務只需要畫紙本手稿，不需要操作任何軟體。
- 讓助理在「附件 > 附建物平面圖」旁上傳手稿照片並轉換。
- 讓 AI 只讀取手稿內容並產生結構化草稿，不直接產生正式最終圖。
- 讓乾淨格局圖由 deterministic renderer 依確認資料重畫。
- 讓每張進 PDF 的圖都有原始手稿、確認人、確認時間、版本與限制聲明。

**Non-Goals:**

- 不提供法律測量、建築圖審查或坪數認定服務。
- 不讓未確認草稿出現在正式 PDF。
- 不要求業務現場拿 iPad 拉線、量測或登入第三方工具。
- 不在第一版做完整格局編輯器；只做簡單修正與確認。
- 不用 Codex CLI 作為產品端能力。

## Decisions

### Decision: Attach sketch conversion to the existing attachment floor plan field

把功能放在成屋說明書表單的「附件」tab，接在 `attachment_floor_plan`「附建物平面圖」欄位旁。使用者看到的是既有欄位擴充，不是新系統。當有 approved converted plan 時，`attachment_floor_plan` 自動顯示為「是」；沒有 approved plan 時仍可維持「未知」或人工選「否」。

Alternatives Considered:

1. 放在「現況」tab：否決，現況處理漏水、違建、瑕疵，格局圖本質是附件圖資。
2. 新增獨立主流程步驟：否決，會增加助理認知負擔，且現有欄位已經有「附建物平面圖」。
3. 只放在 PDF 預覽頁：否決，太晚發現缺圖，會讓助理在產出階段才回頭補資料。

### Decision: Preserve original sketch before any conversion

系統先保存原始手稿照片，再做裁切、校正、AI 辨識或重畫。原始檔與雜湊不可被覆蓋；重新上傳就是新版本。這是法律爭議時最重要的證據鏈，能證明乾淨圖不是憑空產生。

Alternatives Considered:

1. 只存轉換後乾淨圖：否決，無法證明圖的來源。
2. 覆蓋舊手稿：否決，無法追蹤版本差異。
3. 把原始手稿只存在 PDF 附件：否決，PDF 不是系統內部完整稽核紀錄。

SQL DDL:

```sql
CREATE TABLE IF NOT EXISTS floor_plan_sketches (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  original_asset_id TEXT NOT NULL,
  original_sha256 TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'field_sketch' CHECK (source_type IN ('field_sketch')),
  version INTEGER NOT NULL,
  upload_note TEXT,
  uploaded_by TEXT,
  uploaded_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_floor_plan_sketches_case_version
  ON floor_plan_sketches(case_id, version);

CREATE INDEX IF NOT EXISTS idx_floor_plan_sketches_case
  ON floor_plan_sketches(case_id);
```

```sql
CREATE TABLE IF NOT EXISTS floor_plan_conversions (
  id TEXT PRIMARY KEY,
  sketch_id TEXT NOT NULL REFERENCES floor_plan_sketches(id) ON DELETE CASCADE,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'needs_correction', 'approved', 'rejected', 'revoked')),
  extracted_json TEXT NOT NULL DEFAULT '{}',
  manual_edits_json TEXT NOT NULL DEFAULT '{}',
  uncertainty_json TEXT NOT NULL DEFAULT '[]',
  renderer_version TEXT,
  rendered_asset_id TEXT,
  approval_checklist_json TEXT NOT NULL DEFAULT '{}',
  approved_by TEXT,
  approved_at TEXT,
  model_provider TEXT,
  model_id TEXT,
  prompt_template_version TEXT,
  response_fingerprint TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_floor_plan_conversions_case_status
  ON floor_plan_conversions(case_id, status);

CREATE INDEX IF NOT EXISTS idx_floor_plan_conversions_sketch
  ON floor_plan_conversions(sketch_id);
```

### Decision: Use AI as parser, not final artist

AI 的角色是讀手稿，輸出 JSON：房間、標籤、相對位置、門窗、陽台、廚房、衛浴、手寫尺寸、看不清楚的地方。正式圖不直接使用 AI 生圖，而是用系統 renderer 從 JSON 畫出來。這樣每個字、每條線、每個房間都能回到確認資料。

Alternatives Considered:

1. 直接用 OpenAI Image API 生成最終平面圖：否決，漂亮但不可追溯，文字與尺寸仍有錯誤風險。
2. 完全不用 AI：否決，助理需要手動重打所有房間與相對位置，效率不足。
3. 直接做 CAD-like 編輯器：否決，第一版成本太高，也不符合「業務不能複雜」的前提。

Structured extraction shape:

```ts
type FieldSketchExtraction = {
  sketchId: string;
  rooms: Array<{
    id: string;
    label: string;
    type: 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'balcony' | 'dining' | 'other';
    handwrittenText?: string;
    dimensionsText?: string;
    confidence: number;
  }>;
  openings: Array<{
    type: 'door' | 'window' | 'opening';
    fromRoomId?: string;
    toRoomId?: string;
    wallHint?: 'top' | 'right' | 'bottom' | 'left';
    confidence: number;
  }>;
  adjacency: Array<{ fromRoomId: string; toRoomId: string; relation: 'door' | 'open' | 'near' }>;
  entranceRoomId?: string;
  orientationText?: string;
  uncertainty: Array<{ field: string; message: string; severity: 'blocker' | 'warning' }>;
};
```

### Decision: Approval checklist is the legal gate

產 PDF 前要完成一張確認表。最少確認：房間數、客廳/餐廳、廚房、衛浴、陽台、入口、門窗大方向、手寫尺寸是否照抄、看不清楚項目已處理。確認後輸出固定聲明，並記錄 approver 與 Asia/Taipei 時間。

Alternatives Considered:

1. AI confidence 高就自動核准：否決，法律責任需要人確認。
2. 只用一個「我確認」checkbox：否決，無法知道使用者確認了哪些內容。
3. 每次 PDF 輸出才確認：否決，確認資料應屬於格局圖版本，不應散落在 PDF 產出流程。

### Decision: PDF wording separates layout reference from legal records

PDF 頁面標題使用「主要格局圖」或「現場手稿整理圖」，頁腳或圖下注記固定放入限制文字：本圖依現場手稿整理，供空間配置參考；實際面積、權利範圍、登記事項與法定用途，以地政謄本、權狀、主管機關資料及現場確認為準。

Alternatives Considered:

1. 不放聲明以保持版面乾淨：否決，法律風險高於版面簡潔。
2. 聲明只放在系統後台：否決，買方與屋主看到 PDF 時也需要看到限制。
3. 所有來源用同一套聲明：否決，手稿整理圖與 Magicplan/CubiCasa 匯入圖的來源不同，應有不同標籤。

## Implementation Contract

Behavior:

- 助理在「附件 > 附建物平面圖」旁看到「上傳現場手稿」與「轉換成格局圖」。
- 助理上傳鉛筆手稿後，系統保存原圖，顯示原圖預覽與版本。
- 助理按轉換後，系統產生結構化草稿與乾淨圖預覽。
- 系統並排顯示原始手稿與乾淨圖，要求逐項確認。
- 通過確認後，乾淨圖才能成為 PDF 的 approved floor plan。
- PDF 顯示來源「現場手稿整理圖」與限制聲明。

Interface / data shape:

- Tauri commands:
  - upload_floor_plan_sketch(payload: UploadFloorPlanSketchPayload) -> FloorPlanSketch
  - extract_floor_plan_sketch(sketch_id: string) -> FloorPlanConversion
  - update_floor_plan_conversion(conversion_id: string, patch: FloorPlanConversionPatch) -> FloorPlanConversion
  - render_floor_plan_conversion(conversion_id: string) -> RenderedFloorPlan
  - approve_floor_plan_conversion(conversion_id: string, checklist: ApprovalChecklist) -> FloorPlanConversion
  - revoke_floor_plan_conversion(conversion_id: string, reason: string) -> FloorPlanConversion
  - list_floor_plan_conversion_history(case_id: string) -> FloorPlanConversionHistory
- ApprovalChecklist fields:
  - room_count_confirmed, kitchen_confirmed, bathrooms_confirmed, balcony_confirmed, entrance_confirmed, openings_confirmed, dimensions_source_confirmed, uncertainty_resolved, approval_statement
- PDF data extension:
  - fieldSketchFloorPlan?: { renderedImageBytes: Uint8Array; sourceLabel: '現場手稿整理圖'; approvedAt: string; disclaimer: string; originalSketchVersion: number; conversionId: string }

Failure modes:

- Upload rejects unsupported file type and creates no sketch record.
- AI extraction failure keeps original sketch and returns a retryable extraction error.
- Unresolved blocker uncertainty prevents approval.
- Missing rendered image prevents PDF inclusion and does not stop full PDF generation.
- Revoked conversion is excluded from future PDF generation.

Acceptance criteria:

- `spectra validate field-sketch-floor-plan-conversion --strict` passes.
- Unit tests cover upload versioning, immutable original sketch records, extraction draft persistence, checklist gating, approval, revocation, and PDF exclusion for unapproved drafts.
- Manual test with a sample pencil sketch confirms upload, extraction, side-by-side review, checklist approval, PDF inclusion, and audit history.
- PDF output contains source label and limitation statement.

Scope boundaries:

- In scope: hand sketch upload, AI parsing, deterministic clean render, review, approval, audit, PDF inclusion.
- Out of scope: legal measurement certification, third-party floor planning app operation, CAD export, multi-floor 3D modeling.

## Risks / Trade-offs

[Risk] 手稿太潦草導致辨識錯誤 → Mitigation: 顯示不確定項目、要求人工修正、阻擋核准。

[Risk] 使用者誤以為乾淨圖等於測量圖 → Mitigation: UI 與 PDF 固定使用「現場手稿整理圖」與限制聲明。

[Risk] AI 直接生成圖看起來漂亮但內容不忠實 → Mitigation: AI 生圖不得作為 final asset；final asset 只能由 renderer 從確認資料產出。

[Risk] 爭議時無法證明來源 → Mitigation: 保存原始手稿、雜湊、版本、模型資訊、人工確認與 PDF inclusion history。

[Risk] 第一版 renderer 無法處理複雜格局 → Mitigation: 第一版支援常見公寓格局；複雜圖標為需要人工修正或外部專業圖資。

## Migration Plan

1. 新增 DB migration 建立 `floor_plan_sketches` 與 `floor_plan_conversions`。
2. 新增 Tauri commands 與本機檔案儲存，先支援 upload/list/history。
3. 新增 UI panel 接在 `attachment_floor_plan` 欄位旁。
4. 接入 AI extraction，先產生 structured JSON，不產最終圖。
5. 新增 deterministic renderer，把 confirmed JSON 畫成乾淨 PNG/SVG。
6. 新增 approval checklist 與 PDF inclusion。
7. 補測試與手動樣本流程，通過後再進行 SDD archive。

Rollback strategy:

- 先關閉 UI panel 與 PDF inclusion，保留已上傳手稿與 conversion history。
- 若 migration 已發布，不刪資料表；舊資料在後續版本可重新啟用或匯出。

## Open Questions

- AI extraction 要由桌面端直接用客戶 OpenAI API Key 呼叫，還是由 OPCOS 代理且不保存案件內容。
- 第一版 renderer 要輸出 PNG 還是 SVG 後再 rasterize 給 PDF。
- approval checklist 是否需要老闆角色二次確認，還是助理確認即可。
- 現場手稿是否要加入屋主簽名欄位，作為更強的來源確認。
