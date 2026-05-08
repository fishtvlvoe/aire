## Context

Electron App 本機測試發現 5 個 UI/UX 問題。UpdateChecker hydration 錯誤、listings 頁面非全螢幕、admin 用戶管理無入口、基本資訊計數 6/7、文件產生設定需權限控制。所有問題都有明確根因，修改範圍集中在 5-6 個檔案。

## Goals / Non-Goals

**Goals:**

- 修復所有 5 個已確認的 UI/UX 問題
- 確保 admin 管理功能可從 Sidebar 進入
- 基本資訊欄位計數準確
- 文件產生設定加入權限控制

**Non-Goals:**

- 不重構 form-renderer 欄位分類邏輯
- 不新增文件類型
- 不調整 AI 生成 prompt

## Decisions

### D1: UpdateChecker SSR 修復

將 `isElectron` 從 render body 移到 `useState(false)` + `useEffect(() => setIsElectron(!!window.electronAPI), [])`。SSR 時始終回傳 null（與 CSR 初始狀態一致），mount 後才檢查 Electron 環境。

### D2: Listings 全螢幕

移除 `src/app/listings/page.tsx` L150 的 `max-w-[1440px]`，保留 `w-full`。

### D3: Sidebar Admin 區塊

在 `src/components/Sidebar.tsx` 的 NAV_ITEMS 底部新增 admin 區塊：用戶管理（/admin/users）、功能設定（/admin/features）。此區塊只在 user.role === 'admin' 時顯示。需要在 Sidebar 元件中取得當前用戶角色（透過 props 或 session hook）。

### D4: 基本資訊欄位計數修復

**根因已確認**：`usage` 欄位有自訂 renderer（FieldVisitForm.tsx L433-480），選中值寫入 `form.utility_type` / `form.utility_other` / `form.utility_notes`，但從不寫入 `form['usage']`。計數器（L246）檢查 `form['usage'].trim() !== ""`，永遠為空字串，導致 filledAll 少 1（顯示 6/7 而非 7/7）。

修法：在 usage 的自訂 renderer 中，選中 radio 時同步寫入 `updateField('usage', selectedOption)`，讓計數器能正確偵測已填。不需要改動 chapter-grouper.ts 的 BASIC_KEYS。

### D5: 文件產生設定權限

文件產生設定頁面（/admin/features）已存在，需確認：(a) 只有 admin 角色可存取（middleware 或頁面內權限檢查）；(b) 5 種文件類型（物調表、銷售 DM、591 PO 文、社群貼文、不動產說明書）都能成功觸發產生。

## Risks / Trade-offs

- D2 移除 max-width 後，超寬螢幕（如 3440px ultrawide）內容可能過度拉伸。在當前產品階段可接受。
- D4 把更多欄位加入 BASIC_KEYS 會讓 keyword-based 分類的彈性降低，但明確歸類比 keyword 猜測更可靠。
