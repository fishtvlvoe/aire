## Problem

手動測試 AIRE 完整流程（新增案件 → 填表 → 匯出 PDF）時，發現以下問題：

**Bug 類**
- B1：`/dev` 超管頁面 404，`src/app/(dashboard)/dev/` 目錄存在但缺少 `page.tsx`，功能旗標切換無法使用
- B2：`mock-backend` 只把案件存 in-memory，重啟 dev server 後案件全消失，測試流程中斷
- B3：Dashboard layout 未掛 `<Toaster>`，所有 `toast.success()` / `toast.error()` 靜默無效，「儲存變更」按後完全無回饋
- B4：`preview/page.tsx` 直接 `import { invoke } from "@tauri-apps/api/core"`，在瀏覽器 dev 模式下崩潰：`Cannot read properties of undefined (reading 'invoke')`
- B5：`拉謄本` 按鈕（`PullParcelDataButton`）只掛在 `disclosure-form-residential.tsx`，案件主頁面（`cases/[id]/page.tsx`）找不到入口，使用者無從觸發

**UX/功能類**
- F1：`LogoUploader` 只接受 PNG/JPEG，SVG 與 AVIF 被擋，房仲常用的向量 LOGO 無法上傳
- F2：主題卡片（淡雅/科技優雅）灰色預覽區空白，無法比較風格
- F3：主題「預覽」按鈕尚未實作
- F4：新增案件表單「地號」為必填，但部分物件（如公寓）使用者未必知道地號
- F5：「屋主姓名」為必填，但委託初期可能未確認屋主；最低建案需求應為：地址 + 物件類型 + 案件編號
- F6：超管（admin）角色應自動解鎖「實價登錄 MCP Hub」，不需走訂閱付款流程

## Root Cause

- B1：`src/app/(dashboard)/dev/` 只有 `components/` 和 `ux/` 子目錄，缺少 `page.tsx` 入口
- B2：`mock-backend.ts` 的 `cases` 以 `Map` 儲存，`persistState()` 只存 license/sessionUser/appSettings/featureFlags，刻意排除 cases
- B3：`src/app/(dashboard)/layout.tsx` 未引入 `<Toaster />`，Sonner 的 toast 需要 Provider 才能渲染
- B4：`preview/page.tsx` line 5 直接 import Tauri core，沒有 `safeInvoke` 降級分支；browser dev 模式無 Tauri runtime
- B5：`cases/[id]/page.tsx` 未 import `PullParcelDataButton`，且 UI 上無觸發入口

## Proposed Solution

**B1** — 新增 `src/app/(dashboard)/dev/page.tsx`，列出已知 feature flags 並提供 toggle 介面

**B2** — `mock-backend.ts` `persistState()` 加入 cases 序列化到 localStorage；`loadState()` 加入 cases 反序列化，讓案件跨 restart 保持

**B3** — `src/app/(dashboard)/layout.tsx` 引入並掛載 `<Toaster />`（來自 `sonner` 套件）

**B4** — `preview/page.tsx` 改用 `src/lib/safe-invoke.ts` 的 `safeInvoke`（已有 browser mock fallback），移除直接 Tauri import

**B5** — `cases/[id]/page.tsx` 加入 `拉謄本` 操作入口：在「地政資料」卡片區塊內顯示 `PullParcelDataButton`，補上相關說明文字

**F1** — `LogoUploader.tsx` 擴充 `SUPPORTED_MIME` set 加入 `image/svg+xml` + `image/avif`，更新 `accept` 屬性

**F2** — 主題卡片灰色區塊改為渲染對應配色的 swatch（主色、輔色、背景色各一個色塊）

**F3** — 主題「預覽」按鈕觸發 Modal，在 Modal 內用選中的 theme CSS variable 渲染一頁迷你說明書 Demo（含標題、物件資訊佔位符、配色）

**F4** — 新增案件表單移除「地號」的 `required` 驗證，保留欄位但改為選填，placeholder 加入說明文字

**F5** — 移除「屋主姓名」的 `required` 驗證；調整最低建案必填欄位為：地址 + 物件類型 + 案件編號

**F6** — `PremiumUnlockSection.tsx` 偵測 user role 為 `admin` 時，自動呈現「已啟用（管理員）」狀態，繞過訂閱付款邏輯

## Non-Goals

- 不串接真實 Twinkle Hub API（實價登錄 MCP Hub 的後端串接留待獨立 change）
- 不建立 Tauri 端的 mock invoke handler（browser mock 由 `safeInvoke` 現有機制覆蓋）
- 不調整 PDF 匯出的 Rust 端邏輯
- 不修改授權序號驗證流程
- 不改動 SQLite 本機資料庫 schema（此批修改限 UI 層與 mock-backend）

## Success Criteria

- `/dev` 路由可正常訪問，顯示 feature flag toggle 清單，切換後立即反映
- Dev server 重啟後，之前建立的案件仍在列表中
- 點擊「儲存變更」顯示成功 toast；點擊錯誤操作顯示失敗 toast
- 在瀏覽器 dev 模式下點擊「匯出此案件」不崩潰，顯示 mock 匯出回應或友善提示
- 案件頁面可見「拉謄本」按鈕，可點擊（即使 API 回 mock 結果）
- 可上傳 SVG 與 AVIF Logo 不被擋
- 主題卡片顯示配色 swatch
- 主題預覽 Modal 可開啟，呈現主題配色套用後的 Demo 頁面
- 新增案件時，地號與屋主姓名留空可通過驗證
- Admin 角色在設定頁「實價登錄 MCP Hub」卡片顯示「已啟用（管理員）」，不顯示訂閱按鈕

## Impact

- Affected specs: browser-dev-mock, settings-premium-unlock, feature-toggle, customer-logo-upload, dev-super-admin, settings-page
- Affected code:
  - New: `src/app/(dashboard)/dev/page.tsx`
  - Modified: `src/lib/mock-backend.ts`, `src/app/(dashboard)/layout.tsx`, `src/app/(dashboard)/cases/[id]/preview/page.tsx`, `src/app/(dashboard)/cases/[id]/page.tsx`, `src/components/LogoUploader.tsx`, `src/components/settings/PremiumUnlockSection.tsx`, `src/components/ThemeCard.tsx`
