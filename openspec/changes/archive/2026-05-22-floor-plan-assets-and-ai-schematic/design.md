## Context

AIRE 目前的 PDF engine 已經能組裝封面、地圖、空拍、外觀照、實價與生活機能資料，但成屋說明書只有文字型「格局」欄位，沒有案件層級的格局圖資產。本機程式碼尚無通用 case attachments 模組；現有圖片流程偏向固定用途，例如外觀照、地圖與空拍圖。

已檢查跨專案可復用材料：

- /Users/fishtv/Development/ST/apps/aire 具備 listing attachment API、AttachmentMeta JSON metadata、檔案 MIME/extension/size 驗證、刪除與 document generator provenance 流程。這是最接近 AIRE 桌面版的參考。
- /Users/fishtv/Development/ST/supastarter-nextjs 沒有 floor plan 或 Magicplan 程式碼；可借鏡的是 packages/storage/provider/s3 的 signed upload pattern、UserAvatarUpload 的 dropzone/crop UX。此模式適合未來 OPCOS/SaaS，不適合直接進入零雲端桌面 MVP。
- Magicplan 官方支援匯出 2D/3D sketch 為 PDF、JPG、PNG、SVG、CSV、DXF、OBJ、USDZ、IFC，且 API/webhook 可在 custom export 後回傳檔案 URL。
- Homestyler 官方 business 頁面提供 integrated floor planner、white label 與 custom API integration 解法，適合後期商務整合。
- OpenAI 官方 Image API 可從文字 prompt 生成或編輯圖片；Responses API 的 image_generation tool 支援對話式、多步驟圖片產生與編修。官方限制明列文字渲染與一致性仍有缺口，因此在 AIRE 中只能定位為「格局示意圖」。

參考來源：

- https://developers.openai.com/api/docs/guides/image-generation
- https://developers.openai.com/api/docs/guides/tools-image-generation
- https://help.magicplan.app/report-plan
- https://apidocs.magicplan.app/guide/advanced-integrations/custom-export-button-integration/webhook-documentation-project-updated
- https://www.homestyler.com/business?lang=en_US
- https://github.com/charmlinn/blueprint3d-modern
- https://github.com/cvdlab/react-planner

## Goals / Non-Goals

**Goals:**

- 為 AIRE 產品保留 AI 格局圖擴充端口，讓未來 OpenAI/ChatGPT Image、外部格局工具與人工上傳能接進同一個 floor plan asset contract。
- 建立案件層級 floor plan asset 儲存、匯入、審核、刪除與 PDF 輸出鏈。
- 明確區分「外部工具匯入/屋主提供」與「OpenAI/ChatGPT 口述生成」的信任等級。
- 讓 import-first MVP 不依賴任何雲端儲存與第三方帳號 API。
- 為 Magicplan、Homestyler、CubiCasa、RoomSketcher、Apple RoomPlan 與 OpenAI Image 保留一致 metadata 入口。

**Non-Goals:**

- 不把 AI 格局圖定義為 ST 平台功能；ST/OPCOS 僅辨識 AIRE 的 SaaS entitlement，不承擔 AIRE 內部生圖流程。
- 不在本次實作完整 2D/3D 編輯器。
- 不在本次把 supastarter-nextjs storage 套進桌面版。
- 不在本次承諾任何 AI 生成圖的尺寸精準度。
- 不在本次建立 vendor-specific OAuth、billing、webhook receiver 或背景同步 worker。

## Decisions

### Decision: AIRE owns the AI floor plan extension port

AI 格局圖是 AIRE 產品能力，不是 ST 平台能力。AIRE 內部保留 `floor-plan.ai-schematic`、`floor-plan.manual-upload`、`floor-plan.external-import` capability 與 floor plan asset contract；ST/OPCOS 只在 SaaS 權限與產品入口層知道 AIRE 有這些 entitlement，不保存或處理案件格局圖內容。

Alternatives Considered:

1. 把 AI 格局圖寫進 ST 的 SaaS MVP SR：否決，會讓平台層與 AIRE 產品層混淆，未來其他子服務也會誤以為要共用此功能。
2. 完全不寫入任何 SR，等未來再說：否決，功能容易被忘記，且現在的 entitlement 與 asset contract 需要預留名稱。
3. 今天直接實作完整 AI 生圖：否決，會偏離 AIRE SaaS MVP 的註冊、授權、下載、安裝與草稿產出主線。

### Decision: Local case asset store

AIRE 桌面版新增 case_assets SQLite table 與本機 app data 檔案目錄，檔案放在 AIRE/case-assets/{case_id}/{asset_id}.{ext}，SQLite 只保存 metadata 與 storage_path。這符合目前「案件資料全本機」的產品安全邊界，也讓 PDF engine 可以用同一條 bytes loading path 處理外部匯入圖與 AI 示意圖。

Alternatives Considered:

1. 直接把圖片 bytes 存 SQLite BLOB：否決，DB 體積膨脹、備份/修復成本升高，PDF 測試 fixture 也會變重。
2. 直接套用 supastarter-nextjs S3 signed upload：否決，桌面 MVP 要零雲端，且 supastarter 目前 storage bucket 與 ContentType 預設偏 avatar，不符合案件圖資與隱私需求。
3. 把 floor plan path 加到 cases table：否決，後續會有多版本、多來源、多審核狀態，單欄位會壓縮模型。

SQL DDL:

```sql
CREATE TABLE IF NOT EXISTS case_assets (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('floor_plan')),
  source TEXT NOT NULL CHECK (source IN (
    'manual_upload',
    'owner_provided',
    'magicplan',
    'homestyler',
    'cubicasa',
    'roomsketcher',
    'apple_roomplan',
    'openai_image',
    'external_url'
  )),
  trust_tier TEXT NOT NULL CHECK (trust_tier IN ('measured_external', 'owner_reference', 'ai_schematic')),
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  storage_path TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  reviewer_id TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_case_assets_case_kind_status
  ON case_assets(case_id, kind, review_status);

CREATE INDEX IF NOT EXISTS idx_case_assets_case_source
  ON case_assets(case_id, source);
```

### Decision: Source trust tiers drive PDF wording

Floor plan source and trust_tier are first-class fields. PDF labels and disclaimers come from trust_tier, not from filename or upload location. The approved primary floor plan enters PDF output; pending and rejected assets remain available inside the case only.

Alternatives Considered:

1. 只存 source 字串並讓 PDF component 自行判斷：否決，UI、PDF 與未來 import API 會重複分類邏輯。
2. 全部統一標成「格局圖」：否決，AI 生成示意圖與實測圖被混淆會增加客訴與合規風險。
3. 所有圖都輸出到 PDF：否決，未審核草圖會污染正式說明書。

### Decision: OpenAI image as schematic draft

OpenAI Image / ChatGPT Image Tool 在 AIRE 中定位為 AI schematic draft。操作結構是：現況調查表收集 room list、approx dimensions、adjacency、entrance、balcony、kitchen、bathrooms、windows、orientation、uncertainty notes，再產生 FloorPlanBrief JSON，最後由 image generation 產生俯視黑白格局示意圖。生成後一律 pending，需要人審核才輸出 PDF。

官方文件指出 Image API 適合單次 prompt 生成或編輯圖片，Responses API 的 image_generation tool 適合多輪對話式編修。官方也列出 GPT Image models 在文字渲染與視覺一致性上的限制，因此 AIRE 不把它當測量引擎。

FloorPlanBrief shape:

```ts
type FloorPlanBrief = {
  caseId: string;
  propertyType: 'apartment' | 'house' | 'studio' | 'other';
  totalAreaText?: string;
  rooms: Array<{
    name: string;
    label: string;
    approximateSize?: string;
    notes?: string;
  }>;
  adjacency: Array<{ from: string; to: string; relation: 'door' | 'open' | 'hallway' | 'near' }>;
  entrance?: string;
  balcony?: string;
  kitchen?: string;
  bathrooms?: string;
  windows?: string;
  orientation?: string;
  uncertaintyNotes: string[];
};
```

Alternatives Considered:

1. 直接把屋主口述文字丟進 image prompt：否決，輸入缺少可驗證結構，產出難以追溯。
2. 用 OpenAI 產生 SVG/JSON 作為可量測圖：否決，官方 image generation 產出本質是圖片，不能保證幾何精準與建築圖規範。
3. 完全不支援 AI 示意圖：否決，屋主沒有圖、也沒有時間掃描時，示意圖可作為低成本溝通草稿。

### Decision: Reuse ST attachment pattern and defer supastarter storage

實作時優先移植 ST/apps/aire 的 attachment 思路：檔案驗證、metadata、source/provenance、刪除同步與 document generator input mapping。supastarter-nextjs 只作為未來雲端產品線的 signed upload 參考，且在使用前要修正 bucket 設計、ContentType、key validation 與非 avatar 檔案類型。

Alternatives Considered:

1. 直接複製 ST/apps/aire 的 Next API routes：否決，AIRE 是 Tauri desktop，應落在 Rust commands 與 local SQLite。
2. 直接安裝 Blueprint3D Modern 或 react-planner：否決，這會把需求擴成完整繪圖工具；本次只需可進 PDF 的主要格局圖。
3. 只做 PDF image slot，不做 asset metadata：否決，來源、審核與 AI disclaimer 是產品信任邊界。

## Implementation Contract

Behavior:

- 助理可在案件精靈上傳一張或多張格局圖資產，選擇來源，看到 pending/approved/rejected 狀態。
- 助理可把一張格局圖設為 approved primary floor plan。
- 產生不動產說明書時，只有 approved primary floor plan 會進入 PDF。
- OpenAI/ChatGPT 生成圖輸出時顯示「格局示意圖」文案，外部工具匯入圖輸出時顯示來源工具名稱。

Interface / data shape:

- Tauri commands:
  - import_case_asset(payload: ImportCaseAssetPayload) -> CaseAsset
  - list_case_assets(case_id: string, kind?: 'floor_plan') -> CaseAsset[]
  - delete_case_asset(asset_id: string) -> { ok: true }
  - review_case_asset(asset_id: string, status: 'approved' | 'rejected') -> CaseAsset
  - read_case_asset_bytes(asset_id: string) -> Uint8Array
- ImportCaseAssetPayload fields:
  - case_id, kind, source, trust_tier, source_path, file_name, mime_type, metadata_json
- CaseDossierData extension:
  - floorPlan?: { imageBytes: Uint8Array; source: string; trustTier: string; reviewStatus: 'approved'; reviewedAt?: string; disclaimer: string; metadata?: Record<string, unknown> }

Failure modes:

- Unsupported MIME returns a validation error and writes no DB row.
- Missing local file returns a readable asset-not-found error and omits the PDF page instead of failing the full dossier.
- AI schematic request without required FloorPlanBrief fields returns a missing-field validation error and creates no image request.
- Multiple approved floor plans resolve by explicit primary flag in metadata; absent primary flag resolves to latest approved asset by updated_at.

Acceptance criteria:

- SQLite migration creates case_assets table and indexes.
- Rust unit tests cover MIME validation, import, delete, review transitions, and cascade behavior.
- TypeScript tests cover FloorPlanBrief validation and PDF data assembly fallback when no approved asset exists.
- Manual PDF check confirms an approved floor plan renders on a dedicated page with correct disclaimer.
- spectra validate floor-plan-assets-and-ai-schematic passes.

Scope boundaries:

- In scope: local import, metadata, review, PDF inclusion, structured AI brief contract.
- Out of scope: vendor OAuth, hosted webhooks, cloud storage, full CAD editor, legal measurement certification.

## Risks / Trade-offs

[Risk] AI generated layout contains wrong dimensions, doors, room count, or text labels → Mitigation: label as schematic, require structured brief, require human approval, and print disclaimer in PDF.

[Risk] Large image files slow PDF generation → Mitigation: validate size, normalize dimensions before PDF assembly, and store original metadata separately.

[Risk] PDF renderer cannot embed certain formats such as SVG/PDF directly → Mitigation: MVP accepts raster images only; PDF/SVG imports require conversion before storage.

[Risk] Source metadata becomes inconsistent across UI and PDF → Mitigation: centralize source/trust label mapping in src/lib/floor-plan-assets.ts.

[Risk] Future OPCOS cloud storage conflicts with local-first asset model → Mitigation: keep storage interface narrow and allow a future backend implementation without changing PDF data contract.

## Migration Plan

1. Add src-tauri/migrations/007_case_assets.sql and verify it runs on existing local databases without changing existing cases.
2. Add Rust DB helpers and Tauri commands behind the existing desktop command registration flow.
3. Add frontend asset panel and source selector to the existing case wizard step that captures field-visit completion data.
4. Extend dossier data assembly and PDF components to include the approved floor plan asset when present.
5. Run spectra validate floor-plan-assets-and-ai-schematic, cargo tests for case assets, and the existing frontend test suite.

Rollback strategy:

- The feature is additive. Rollback removes the UI entry point and PDF floor plan page integration first. Existing case_assets rows and files remain local and can be ignored by older builds. A later cleanup migration can remove the table after backup if the feature is abandoned.

## Open Questions

- 要放在現況調查流程的哪一個畫面：CaseWizardStep4 還是獨立的「補充附件」頁面。
- AI generation 要由桌面 App 直接呼叫 OpenAI API，還是透過 OPCOS 的受控 image-generation endpoint 代理。
- PDF 格局圖頁面要固定在物件資料章節後，或放在照片/圖資區塊中。
