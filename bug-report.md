# AIRE Bug Report — 全站測試
> 測試日期：2026-05-19 | 環境：localhost:3000（瀏覽器）| 帳號：admin

---

## 已修復

### Bug #1 + #2 ✅ FIXED — Tauri invoke 在瀏覽器環境崩潰

**現象**
- `loadDraft` 失敗：`[loadDraft] failed: TypeError: Cannot read properties of undefined (reading 'invoke')`
- autosave 每 15 秒觸發：`[useDraftAutosave] save failed: TypeError: ...` → UI 顯示「儲存失敗」

**根因**
- `use-draft-autosave.ts`、`KeyinSplitPage.tsx` 等 7 個檔案直接 `import { invoke } from "@tauri-apps/api/core"`
- 瀏覽器環境 `invoke` 是 `undefined`，所有 IPC 呼叫拋 TypeError

**修復**（commit: `fix: 全面換用 safeInvoke`）
- 全部換用 `safeInvoke` from `@/lib/tauri-bridge`（dev 模式走 mock-backend，Tauri 走真實 IPC）
- `listen("tauri://close-requested")` 改成 `isTauriEnv()` 判斷後動態 import
- mock-backend 補 `get_draft` alias + 修 `loadDraft` 回傳 `{ payload_json: string }` 正確格式
- 影響檔案：`use-draft-autosave.ts`、`KeyinSplitPage.tsx`、`RealtorLicenseField.tsx`、`export-pdf.ts`、`pdf-blocks/logo-upload.ts`、`sync-status/page.tsx`、`mock-backend.ts`

---

## 未修復（待處理）

### Bug #3 🔴 HIGH — 拉謄本授權 dialog 無驗證 feedback

**位置**：案件 → Step 2 地政資料 → 拉謄本 → 授權同意 dialog

**現象**：checkbox 未勾選時點「確認查詢」按鈕，無任何視覺 feedback（無 toast、無 shake、無紅色提示）。用戶不知道要先勾 checkbox。

**預期行為**：應顯示驗證錯誤或讓按鈕在未勾選時保持 disabled。

---

### Bug #4 🔴 HIGH — TriState toggle 點擊無反應（現況/附件 tab）

**位置**：案件 → keyin 頁面 → 現況 tab（漏水滲水、重大裝修、違章增建）+ 附件 tab（附權狀影本、附建物平面圖）

**現象**：點是/否/未知按鈕視覺無變化，`_formValues.condition_leakage` 始終為 `"unknown"`。

**根因（已確認）**
- `CaseWizardStep3Disclosure.tsx` 傳 `onChange={setPayload}` 給子組件
- `DisclosureFormResidential` 中 `form.watch()` → 觸發 `onChange(values)` → `setPayload` → `initialPayload` prop 改變 → `useEffect` 觸發 `form.reset()` → 值被還原
- 雙向回饋迴圈：watch → reset → watch → reset...

**修復方向**：
1. 移除 render body 中 `const watched = form.watch()`（line 180），改只用 `useEffect` 的 subscription
2. 或：`useEffect` 中加 `if (deepEqual(form.getValues(), initialPayload)) return` 防止無謂 reset

---

### Bug #5 🟡 MEDIUM — 品牌設定全部資料 refresh 後消失

**位置**：設定 → 品牌設定

**現象**：
- Logo 上傳後點「儲存品牌資訊」顯示 toast「品牌資訊已儲存」，但 refresh 後 Logo 消失
- 業務員姓名、公司名稱等文字欄位同樣 refresh 後清空

**根因推測**：
- `brandingApi.saveBrandText()` 走 mock-backend 的 `save_brand_text_settings`，應有 localStorage 持久化
- Logo 可能走 `upload_logo` command，mock 的 `uploadLogo` 可能未把 bytes 納入持久化 snapshot
- 需查 `persistState()` 是否包含 logo 和 brandText

**修復方向**：查 mock-backend 的 `PersistedMockState` 是否包含 `brandText`；logo 需確認 mock 是否將 bytes 序列化進 localStorage。

---

### Bug #6 🟡 MEDIUM — 授權管理：任意格式字串可能直接啟用

**位置**：設定 → 一般設定 → 授權管理

**現象**：
- `TEST-LICENSE-123` → 顯示「序號無效」
- `AIRE-TEST-2026-ADMIN` → 直接顯示「已啟用」（綠色）

**問題**：序號驗證是純 client-side 的格式比對（非後端驗證），某些格式直接通過，存在安全疑慮。

**修復方向**：序號驗證應透過 `safeInvoke("activate_license", { serial_key })` 呼叫後端，不能只做 client-side 格式判斷。

---

### Bug #7 🟢 LOW — 地政 API 設定儲存無 feedback

**位置**：設定 → 一般設定 → 地政 API 設定 → 儲存

**現象**：填入 Client ID + 安全碼，點「儲存」按鈕後無任何 toast 或錯誤提示。（測試連線有正確顯示「連線成功（延遲 470ms）」）

**修復方向**：`saveLandApiSettings` 完成後應顯示 toast。

---

## 功能測試結果（全站）

| 功能 | 結果 |
|------|------|
| 案件列表 | ✅ 正常 |
| 新增案件（Wizard Step 1-5） | ✅ 步驟流程正常 |
| Step 1 基本資料（表單） | ✅ 欄位填寫正常 |
| Step 2 地政資料（拉謄本） | ✅ UI 正常，⚠️ Bug #3（授權 dialog 無驗證） |
| Step 3 揭露資料（TriState） | 🔴 Bug #4（toggle 無反應） |
| Step 4 實價登錄（MCP Hub） | ✅ 顯示 MCP 資訊 |
| Step 5 預覽匯出（匯出 PDF） | ✅ Toast 觸發（Tauri 環境才真正產生 PDF） |
| Key-in 頁面（autosave） | ✅ 修復後正常（Bug #1/#2 已修） |
| 草稿還原 | ✅ 修復後「已還原草稿」toast 正常 |
| 設定 > 授權管理 | ⚠️ Bug #6（任意格式字串可啟用） |
| 設定 > 地政 API | ⚠️ Bug #7（儲存無 feedback） |
| 設定 > 品牌設定 Logo | 🔴 Bug #5（refresh 後消失） |
| 設定 > 品牌設定文字資訊 | 🔴 Bug #5（refresh 後消失） |
| 設定 > 品牌設定主題預覽 | ✅ Dialog 正常 |
| 設定 > 操作日誌 | ✅ 顯示（Mock 模式無資料，符合預期） |

---

## 優先修復順序

1. **Bug #4** — TriState toggle 完全無用（core 功能壞掉）
2. **Bug #1/#2** — ✅ 已修
3. **Bug #3** — 拉謄本授權 UX 問題
4. **Bug #5** — 品牌設定無持久化
5. **Bug #6** — 授權序號安全性
6. **Bug #7** — 小 UX 缺漏
