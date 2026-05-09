# Tasks — disclosure-preview

## 1. 資料層：欄位位置定義與 DB schema

- [x] [P] 1.1 建立 src/lib/branding/field-layouts.ts（實作 spec「System defines field positions for disclosure template using percentage-based coordinates」，依據 design D2 欄位位置定義格式）：定義 FieldPosition interface（fieldKey, label, x, y, width, height, fontSize, textAlign, page），匯出 DEFAULT_COVER_FIELDS 陣列（10 個封面欄位：object-id, object-name, agent-name, store-name, broker-name, broker-cert, company-name, company-address, company-phone, document-date），匯出空的 DEFAULT_CONTENT_FIELDS 陣列。座標值參考 design.md D2 的範例表。驗證：import 不報錯，DEFAULT_COVER_FIELDS.length === 10。[Tool: copilot]

- [x] [P] 1.2 修改 src/lib/db/schema.ts（實作 spec「Admin uploads and manages disclosure template background images」的 DB 基礎，依據 design D1 版型背景圖儲存）：在 feature_flags 表的 initFeatureFlags 函式中新增兩個預設 key：doc_bg_cover（空字串）和 doc_bg_content（空字串）。驗證：啟動 dev server 後查詢 SELECT * FROM feature_flags WHERE key LIKE 'doc_bg%' 回傳兩筆。[Tool: copilot]

## 2. 背景圖上傳 API

- [x] 2.1 建立 src/app/api/admin/templates/background/route.ts（實作 spec「Admin uploads and manages disclosure template background images」，依據 design D1 版型背景圖儲存）：實作 POST 和 DELETE handler。POST 接收 multipart/form-data（欄位 page=cover|content + file），驗證檔案格式（只允許 image/png 和 image/jpeg）和大小（上限 5MB），上傳至 R2 路徑 branding/backgrounds/{page}.{ext}，更新 feature_flags 表的 doc_bg_{page} 為 R2 公開 URL，回傳 { url }。如果該 page 已有背景圖，先刪除 R2 舊檔再上傳新檔。DELETE 接收 query param page=cover|content，刪除 R2 檔案並清空 feature_flags 對應 key。複用現有 src/app/api/admin/templates/logo/route.ts 的 R2 上傳邏輯（S3Client 設定、clearExistingLogoFiles pattern）。驗證：curl POST 上傳 PNG 回 200 + URL；curl POST 上傳 6MB 檔案回 400；curl DELETE 後 feature_flags 值為空。[Tool: copilot]

## 3. 預覽資料 API

- [x] 3.1 建立 src/app/api/documents/disclosure-preview/route.ts（實作 spec「System renders disclosure document as HTML preview with template background」，依據 design D5 資料流）：實作 GET handler，接收 query param listingId。從 DB 讀取 listing 資料（title, address 等欄位）和 generated_documents JSON（如有 disclosure_overrides 則優先用覆寫值），讀取 feature_flags 的 doc_bg_cover 和 doc_bg_content URL，讀取 field-layouts.ts 的 DEFAULT_COVER_FIELDS 和 DEFAULT_CONTENT_FIELDS。回傳 JSON：{ fields: [{ fieldKey, label, value, position: {x,y,width,height,fontSize,textAlign} }], backgrounds: { cover: string|null, content: string|null }, listingId }。每個 field 的 value 來源優先順序：disclosure_overrides[fieldKey] > listing 對應欄位 > 空字串。驗證：curl GET 回 200 + JSON 結構正確，fields 陣列長度 === 10。[Tool: copilot]

## 4. 儲存編輯 API

- [x] 4.1 建立 src/app/api/documents/disclosure-preview/save/route.ts（實作 spec「User edits disclosure field text inline and saves changes」，依據 design D4 contentEditable 即時編輯）：實作 PATCH handler，接收 JSON body { listingId, fieldKey, value }。驗證 fieldKey 存在於 DEFAULT_COVER_FIELDS 或 DEFAULT_CONTENT_FIELDS 中（白名單驗證）。對 value 做 HTML tag stripping（用正則 /<[^>]*>/g 移除所有 HTML 標籤）。讀取 listing 的 generated_documents JSON，在其中新增或更新 disclosure_overrides[fieldKey] = strippedValue，寫回 DB。回傳 200 { ok: true }。驗證：PATCH 後再 GET 確認 value 已更新；嘗試送 HTML 標籤確認被 strip。[Tool: copilot]

## 5. 管理員設定頁 UI

- [x] 5.1 修改 src/app/admin/(dashboard)/templates/page.tsx（實作 spec「Admin template settings page includes background image management」，依據 design D6 管理員版型設定 UI）：在 Logo 上傳區下方新增「版型背景圖」區塊。包含兩個上傳 slot（封面頁、內容頁），每個 slot 顯示：已上傳時顯示縮圖（max-height 200px）+ 刪除按鈕；未上傳時顯示虛線框 + 「上傳背景」按鈕。上傳呼叫 POST /api/admin/templates/background，刪除呼叫 DELETE /api/admin/templates/background?page=xxx。頁面載入時從 GET /api/admin/templates 讀取現有背景 URL。樣式沿用現有 LogoUploader 的卡片風格（白底、圓角、陰影）。驗證：上傳後縮圖顯示；刪除後顯示虛線框。[Tool: copilot]

## 6. 預覽頁面 UI

- [x] 6.1 建立 src/components/DisclosurePreview.tsx（實作 spec「System renders disclosure document as HTML preview with template background」，依據 design D3 預覽頁面架構）：預覽主容器元件。接收 props：fields（欄位資料陣列）、backgrounds（封面/內容頁背景 URL）、listingId、onSave callback。渲染結構：外層 flex 置中容器 → 內層 A4 比例容器（794x1123px，position: relative）→ 背景圖層（img, width: 100%, position: absolute, z-index: 0）→ 欄位覆蓋層（position: absolute, z-index: 1）。支援封面頁和內容頁上下排列。當視窗寬度 < 794px 時用 transform: scale(viewportWidth / 794) 縮放。驗證：元件渲染不報錯，A4 容器比例正確。[Tool: copilot]

- [x] 6.2 建立 src/components/DisclosureFieldOverlay.tsx（實作 spec「User edits disclosure field text inline and saves changes」，依據 design D4 contentEditable 即時編輯）：單個可編輯欄位元件。接收 props：fieldKey, label, value, position（x,y,width,height,fontSize,textAlign）, onSave。渲染為 div，style 用 position: absolute + left/top/width/height 百分比 + fontSize + textAlign。設定 contentEditable="true"。hover 時顯示淡藍色邊框提示可編輯。focus 時邊框變為實線藍色。onBlur 時取 innerText（非 innerHTML），若與原始 value 不同則呼叫 onSave(fieldKey, newValue)。儲存成功顯示綠色 checkmark 1 秒後消失，失敗顯示紅色邊框。驗證：點擊欄位可編輯；blur 後觸發 onSave；HTML 標籤不會出現在 innerText 中。[Tool: copilot]

- [x] 6.3 建立 src/app/listings/[id]/documents/preview/page.tsx（實作 spec「System renders disclosure document as HTML preview with template background」，依據 design D3 預覽頁面架構 + D5 資料流）：預覽頁面 route。頁面載入時呼叫 GET /api/documents/disclosure-preview?listingId={id} 取得資料。渲染 DisclosurePreview 元件 + 底部工具列（返回按鈕導回 /listings/[id]/documents）。onSave callback 呼叫 PATCH /api/documents/disclosure-preview/save。頁面標題「不動產說明書預覽」。loading 狀態顯示骨架屏。驗證：頁面可正常存取，背景圖和欄位都顯示。[Tool: copilot]

## 7. 文件列表頁整合

- [x] 7.1 修改 src/app/listings/[id]/documents/page.tsx（實作 spec「System renders disclosure document as HTML preview with template background」的預覽按鈕入口）：在不動產說明書（disclosure_document）的區塊中新增「預覽」按鈕（藍色 outline 樣式），點擊導航至 /listings/[id]/documents/preview。按鈕放在現有「生成」按鈕旁邊。只在 disclosure_document 已生成（generated_documents 中有 disclosure_document 資料）時顯示預覽按鈕。驗證：按鈕顯示正確，點擊導航到預覽頁。[Tool: copilot]

- [x] [P] 7.2 修改 src/middleware.ts（確認 spec「System renders disclosure document as HTML preview with template background」的路由可達性）：確認 /listings/[id]/documents/preview 路徑被現有的 listings 白名單涵蓋（應已自動涵蓋，確認即可）。驗證：未登入存取回 401，已登入存取回 200。[Tool: copilot]

## 8. E2E 驗證

- [x] 8.1 用瀏覽器走完整流程驗證所有 spec 情境：(1) 管理員上傳封面背景圖（驗證 spec disclosure-template-background）→ (2) 建立物件填入基本資料 → (3) 生成不動產說明書 → (4) 點預覽按鈕進入預覽頁（驗證 spec disclosure-html-preview）→ (5) 確認背景圖和欄位正確疊加（驗證 spec disclosure-field-layout）→ (6) 點擊欄位編輯文字 → (7) blur 後確認儲存成功（驗證 spec disclosure-inline-edit）→ (8) 重新載入頁面確認修改持久化。截圖每個步驟。驗證：所有截圖符合 spec 描述。[Tool: sonnet]
