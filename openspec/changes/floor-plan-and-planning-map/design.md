## Context

AIRE 說明書 PDF 目前缺少建物格局圖（平面配置）和土地規劃圖（地籍/分區）兩個圖頁。業務手邊已有 JPG/PNG 圖檔，需要一個簡單的直接上傳路徑，不走 AI 轉換流程。

現有 `CaseRow` 沒有圖片欄位。PDF block 有 `fieldSketchFloorPlan`（AI 轉換結果），但不適用於直接上傳的情境。

## Goals / Non-Goals

**Goals:**
- 在 wizard Step 3 新增上傳區塊（建物版「格局圖」、土地版「規劃圖」）
- 上傳後儲存至 case，PDF 匯出時自動嵌入圖頁
- 相容 web mock 模式和 Tauri 桌面模式

**Non-Goals:**
- 不取代 `fieldSketchFloorPlan` AI 轉換流程
- 不支援多張圖
- 不做圖片裁切/旋轉

## Decisions

### 儲存機制

**Tauri 桌面版**：新增兩個 IPC 指令：
- `save_floor_plan_photo(case_id: str, bytes: Vec<u8>, mime: str)` → 儲存至 `<app_data>/<case_id>/floor_plan.<ext>`
- `get_floor_plan_photo(case_id: str)` → 回傳 `{ bytes: Vec<u8>, mime: str } | null`

**Web mock 模式**：將 base64 字串存入 `CaseRow.land_registry_data` 下的 `floor_plan_photo` key（格式：`{ base64: string, mime: string }`）。`casesApi.update()` 合併 `land_registry_data` 保存。

### CaseDossierData 擴充

新增欄位：
```typescript
floorPlanPhoto?: Uint8Array | null   // 建物格局圖 / 土地規劃圖（二合一）
```

`assembleDossierData`：
1. 嘗試 `safeInvoke("get_floor_plan_photo", { case_id })`（Tauri）
2. catch → 從 `caseRow.land_registry_data.floor_plan_photo.base64` 解 base64 取 bytes（web mock）

### PDF 圖頁

新建 `src/lib/pdf-blocks/floor-plan-photo-page.tsx`：
- 元件名：`FloorPlanPhotoPage`
- 標題：建物版「格局圖」、土地版「規劃圖」（由 `title` prop 傳入）
- 圖片：使用 `uint8ToDataUrl(bytes)` 轉 data URL（與現有 location-map / aerial-photo 一致）
- 無圖時：顯示「請上傳格局圖」佔位

`document.tsx` 插入位置：
- 建物版 `BuildingPages`：`ExteriorPhotoPage` 之後、`FieldSketchFloorPlanPage` 之前
- 土地版 `LandPages`：`ExteriorPhotoPage` 之後

### UI 上傳元件

在 `CaseWizardStep3.tsx` 的揭露資料表單最下方新增一個 `PhotoUploadBlock` 子元件：
- `<input type="file" accept="image/jpeg,image/png">` 選檔
- 選檔後讀取 bytes 呼叫 `casesApi.update()` 或 IPC 儲存
- 顯示縮圖預覽（`URL.createObjectURL`）和「清除」按鈕

## Implementation Contract

### 行為
- 業務在 Step 3 上傳一張 JPG/PNG → 縮圖即時顯示 → 刷新後仍保留 → PDF 匯出時出現對應圖頁
- 未上傳時：PDF 圖頁顯示佔位文字，不報錯

### 介面／資料型態
- `CaseDossierData.floorPlanPhoto?: Uint8Array | null`
- `FloorPlanPhotoPage` props: `{ photo: Uint8Array | null; title: string }`
- Web mock 儲存格式: `land_registry_data.floor_plan_photo = { base64: string, mime: "image/jpeg" | "image/png" }`
- Tauri IPC: `save_floor_plan_photo({ case_id, bytes, mime })` / `get_floor_plan_photo({ case_id })` → `{ bytes, mime } | null`

### 失敗模式
- IPC 取圖失敗 → `floorPlanPhoto = null`，PDF 顯示佔位，不中斷產生流程
- 上傳超過 10MB → 前端顯示錯誤「圖片大小不超過 10MB」，不儲存

### 驗收標準
- 上傳 JPG 後刷新頁面：縮圖仍顯示（已持久化）
- 點「匯出 PDF」：下載的 PDF 在正確位置出現格局圖頁，圖片非佔位
- `npm run build` 0 errors
- 未上傳時匯出 PDF：圖頁顯示佔位文字，無 exception

### 範圍邊界
- In scope: `FloorPlanPhotoPage`、`CaseDossierData.floorPlanPhoto`、`assembleDossierData` 讀取邏輯、Step 3 上傳 UI
- Out of scope: Rust IPC 實作（由桌面版 Wave 另行處理）、多張圖、格局圖 AI 轉換

## Risks / Trade-offs

- **SQLite 大小**：web mock 存 base64 於 `land_registry_data` JSON 欄位，一張 5MB JPEG ≈ 6.7MB base64，SQLite 可接受但效能稍差。正式 Tauri 版用磁碟檔案，不影響 DB 大小。
- **Uint8Array 轉換**：從 `land_registry_data.floor_plan_photo.base64` 解析需要 `atob()`（瀏覽器）或 `Buffer.from(b64, "base64")`（Node），兩者行為一致。
