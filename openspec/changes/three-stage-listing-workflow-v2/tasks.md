## 1. 物件類型 Registry（property-type-registry）

- [x] 1.1 [Tool: copilot-codex] 建立 `src/lib/property-types/index.ts`：Property type registry defines 13 types，每種含 id/displayName/category/available，實作物件類型 Enum 策略：字串 enum 取代數字 ID
- [x] 1.2 [Tool: copilot-codex] 建立 `src/lib/property-types/schemas/` 目錄，First version implements 6 priority types（farmland/townhouse/apartment/highrise/residential-land/farmhouse），各建一個 field schema 檔
- [x] 1.3 [Tool: copilot-codex] Each type defines three-layer field schema：common / building_common 或 land_common / type_specific，欄位含 key/label/type/required；實作物件類型 Schema 設計：三層欄位結構；採用 UI 表單渲染：配置驅動（Config-driven）架構
- [x] 1.4 [Tool: copilot-codex] 其餘 7 種類型標記 `available: false`，type_specific 回傳空物件
- [x] 1.5 [Tool: codex] 撰寫 property-type-registry 單元測試：驗證 retrieve display name、determine category、access unimplemented type、list available types

## 2. DB Schema 與 API 更新（listing-workflow）

- [x] 2.1 [Tool: codex] 更新 `src/lib/db/schema.ts`：Listing status machine supports 13 property types，property_type 改為 TEXT（物件類型 Enum 策略：字串 enum 取代數字 ID），移除 enum 限制，類型驗證在 application layer
- [x] 2.2 [Tool: codex] 更新 `src/lib/db/index.ts`：createListing / updateListing 加入 property_type 驗證，reject unavailable type 回傳 `type-not-available`，reject unknown type 回傳 `invalid-property-type`
- [x] 2.3 [Tool: codex] 更新 `src/app/api/listings/route.ts` POST handler：支援 13 種類型，驗證 available 狀態；Five-page UI flow covers the complete listing lifecycle 的後端入口
- [x] 2.4 [Tool: codex] 撰寫 listing-workflow 整合測試：驗證 create listing with farmland type、reject unavailable type、reject unknown type

## 3. 現場勘查表單（field-visit-form）

- [x] 3.1 [Tool: copilot-codex] 建立 `src/lib/form-renderer/` 模組（UI 表單渲染：配置驅動 Config-driven）：Field visit form renders dynamically based on property type，根據 property type 和 layer 回傳欄位定義陣列；Common fields are identical across all types；Building common fields apply to all building-category types；Land common fields apply to all land-category types
- [x] 3.2 [Tool: copilot-codex] 建立 field-visit-form API endpoint `src/app/api/listings/[id]/field-visit/route.ts`：Form saves data as structured JSON，接收 JSON body 驗證結構後存入 field_visit_data，推進狀態至 field-visit-complete
- [x] 3.3 [Tool: codex] 撰寫 field-visit-form 測試：驗證 save farmland field visit data（含 common/land_common/type_specific keys）、building common fields for apartment

## 4. 秘書後補表單（supplementary-form）

- [ ] 4.1 [Tool: copilot-codex] 擴充 `src/lib/property-types/schemas/` 每個類型加入 supplementary_specific 欄位定義（6 種優先類型）：Supplementary form renders fields for secretary to complete；Type-specific supplementary fields append after category common
- [x] 4.2 [Tool: copilot-codex] 建立 supplementary-form API endpoint `src/app/api/listings/[id]/supplementary/route.ts`：Supplementary data saves as structured JSON，存入 supplementary_data，推進狀態至 ready-for-generation
- [x] 4.3 [Tool: codex] 撰寫 supplementary-form 測試：驗證 secretary opens supplementary tab for farmland（farmland type-specific fields）、save supplementary data for townhouse → status advances

## 5. 物件調查表（property-dossier）

- [x] 5.1 [Tool: copilot-codex] 更新 `src/lib/document-generator/types.ts`：Dossier is included in the generated documents output，GeneratedDocuments 新增 `property_dossier: string` 第七個欄位
- [ ] 5.2 [Tool: copilot-codex] 更新 `src/lib/document-generator/codex-provider.ts`：Property dossier is generated as a complete property profile；Dossier generation uses Codex CLI；物件調查表：AI 整合輸出，非模板填充，依物件類型與三層欄位資料輸出結構化 Markdown
- [x] 5.3 [Tool: codex] 建立 `src/lib/pdf-generator/dossier.ts`：PDF 輸出：HTML → Puppeteer → PDF，接收 Markdown 字串，用 Puppeteer 產生 A4 PDF，存至 `output/<listing-id>/dossier.pdf`
- [ ] 5.4 [Tool: codex] 更新 regenerate API：Dossier can be regenerated independently，VALID_TYPES 新增 `property_dossier`
- [x] 5.5 [Tool: codex] 撰寫 property-dossier 測試：驗證 generate dossier for farmland listing（含 6 sections）、dossier regeneration via API

## 6. UI：物件列表頁（listing-ui-flow）

- [ ] 6.1 [Tool: cursor] 建立 `src/app/listings/page.tsx`：Listing page displays table with filter controls；UI design follows established design system（#F5F6FA/#1B3A6B/#F5882B/Manrope）；表格含地址/類型/狀態/業務/委託日期/操作欄位
- [ ] 6.2 [Tool: cursor] 實作類型篩選器（下拉）與狀態篩選器（下拉），filter listings by type、filter listings by status
- [ ] 6.3 [Tool: cursor] 操作欄依狀態顯示：draft→繼續填寫、ready-for-generation→產生文件、documents-ready→查看文件；consistent sidebar across all pages

## 7. UI：新增物件頁（listing-ui-flow）

- [ ] 7.1 [Tool: cursor] 建立 `src/app/listings/new/page.tsx`：New listing page shows 13 types with availability state；available=false 顯示「即將推出」badge；Implementation Distribution Strategy：cursor 負責 UI
- [ ] 7.2 [Tool: cursor] 實作類型選擇互動：select an available type（深藍邊框+淺藍底+勾選）、attempt to select unavailable type（不可點選）
- [ ] 7.3 [Tool: cursor] 選擇類型後呼叫 POST /api/listings 建立物件，navigate full flow for a new listing，redirect 至 `/listings/[id]/fill`

## 8. UI：資料填寫頁（listing-ui-flow、field-visit-form、supplementary-form）

- [ ] 8.1 [Tool: cursor] 建立 `src/app/listings/[id]/fill/page.tsx`：Fill form page uses three-tab layout（共通欄位/類型專屬欄位/秘書後補）
- [ ] 8.2 [Tool: cursor] Tab 1 共通欄位：委託總價/物件地址/用途/現況/優缺點，common fields always present
- [ ] 8.3 [Tool: cursor] Tab 2 類型專屬欄位：根據 property type 從 form-renderer 動態載入 building_common 或 land_common + type_specific 欄位
- [ ] 8.4 [Tool: cursor] Tab 3 秘書後補：根據 category 載入 building 或 land 共通後補欄位 + type_specific supplementary 欄位
- [ ] 8.5 [Tool: cursor] Tab completion indicator（每個 Tab 顯示綠勾/部分填寫/空白狀態）
- [ ] 8.6 [Tool: cursor] 「產生文件」按鈕：呼叫 POST /api/listings/[id]/generate，redirect 至 `/listings/[id]/generating`

## 9. UI：AI 產生中頁（listing-ui-flow）

- [ ] 9.1 [Tool: cursor] 建立 `src/app/listings/[id]/generating/page.tsx`：Generating page shows per-document progress，7 種文件逐項顯示進度（已完成/產生中/等待中）
- [ ] 9.2 [Tool: cursor] 整體進度條（橘色，顯示 N/7）與預估剩餘時間
- [ ] 9.3 [Tool: cursor] auto-redirect on completion：全部完成後 2 秒自動跳轉至 `/listings/[id]/documents`

## 10. UI：文件輸出頁（listing-ui-flow、property-dossier）

- [ ] 10.1 [Tool: cursor] 建立 `src/app/listings/[id]/documents/page.tsx`：Document output page shows all 7 documents with download，文件卡片 grid（物件調查表/591/銷售DM/社群貼文/短影音腳本）
- [ ] 10.2 [Tool: cursor] 每張卡片含預覽區 + 下載按鈕，物件調查表額外顯示「下載 PDF」按鈕（呼叫 dossier PDF 端點）
- [ ] 10.3 [Tool: cursor] 每張卡片「重新產生」按鈕呼叫 POST /api/listings/[id]/regenerate

## 11. Stitch UI 設計稿（listing-ui-flow）

- [ ] 11.1 [Tool: cursor] 在 Stitch 更新新增物件頁：13 種類型卡片 grid，7 種標記「即將推出」
- [ ] 11.2 [Tool: cursor] 在 Stitch 更新資料填寫頁：三 Tab 佈局，Tab 2 顯示類型專屬欄位範例（以農地為例）
- [ ] 11.3 [Tool: cursor] 在 Stitch 更新文件輸出頁：新增物件調查表卡片（第七張）

## 12. Code Review 與驗收

- [ ] 12.1 [Tool: kimi] CR：property-type-registry + form-renderer（3+ 檔案 diff，驗證欄位結構一致性）
- [ ] 12.2 [Tool: kimi] CR：5 頁 UI 元件（驗證設計系統一致性、Tab 互動邏輯）
- [ ] 12.3 [Tool: codex] 執行完整測試套件：`npm test`，確認全部通過
- [ ] 12.4 [Tool: codex] 執行 `npm run build`，確認 0 TypeScript 錯誤
