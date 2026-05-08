## Problem

本機測試 Electron App 發現多個 UI/UX 和功能問題：

1. **UpdateChecker Hydration 錯誤**：UpdateChecker 元件在 render body 中直接讀 `typeof window !== 'undefined'`，SSR 回傳 null 但 CSR 回傳 div，導致 React hydration mismatch 錯誤
2. **Listings 頁面左右空白**：`max-w-[1440px]` 限制容器寬度，超過 1440px 的螢幕兩側出現空白，不是全螢幕
3. **Admin 用戶管理頁面無入口**：`/admin/users` 頁面存在但 Sidebar 沒有連結，管理員找不到用戶管理功能
4. **基本資訊欄位計數 6/7 錯誤**：用途欄位（radio button）選中後值未正確寫入 form state，或 chapter-grouper 的 keyword 比對把 `other_rights`（他項權利登記）分到 legal 章節而非 basic，導致 basic 章節計數為 6/7 而非 7/7
5. **文件產生功能設定需權限控制**：物調表、銷售 DM、591 PO 文、社群貼文、不動產說明書 5 種文件都需要能成功產出，且文件類型的啟用/停用設定只有總管理員可調整

## Root Cause

1. UpdateChecker L8：`const isElectron = typeof window !== 'undefined' && !!window.electronAPI` 在元件 body 執行，非 useEffect 內
2. Listings page L150：`max-w-[1440px]` class
3. Sidebar 的 NAV_ITEMS 沒有 admin 區塊的連結
4. chapter-grouper.ts L46 LEGAL_KEYWORDS 包含「權利」，`other_rights` label「他項權利登記」命中此 keyword 被分到 legal；加上 usage 欄位 type='text' 但 UI 渲染為 radio button，radio 選中值可能未寫入 form state
5. 文件產生 API 缺少管理員權限檢查

## Proposed Solution

1. UpdateChecker 改用 `useState(false)` + `useEffect` 延遲設定 isElectron，確保 SSR/CSR 一致
2. 移除 `max-w-[1440px]`，改用 `w-full`
3. Sidebar 新增 admin 管理區塊（用戶管理、功能設定），僅 admin 角色顯示
4. 修正 chapter-grouper：把 `other_rights` 加入 BASIC_KEYS 或 LEGAL_KEYS 明確歸類；檢查 usage radio button 的 form state 寫入邏輯
5. 文件產生設定頁面加入權限檢查，API route 驗證 admin 角色

## Non-Goals

- 不重構整個 form-renderer 欄位分類系統（只修 basic 章節的計數問題）
- 不調整文件產生的 AI 模型或 prompt（只處理權限和 UI 入口）
- 不新增文件類型（現有 5 種已足夠）

## Success Criteria

1. UpdateChecker 在 dev 模式下不再出現 hydration mismatch 錯誤
2. Listings 頁面在任何螢幕寬度下都是全螢幕，無左右空白
3. Admin 用戶可在 Sidebar 看到「管理」區塊，點擊進入用戶管理頁面
4. 基本資訊章節所有欄位填完後顯示 7/7
5. 文件產生設定頁面只有 admin 角色可存取和修改

## Impact

- Affected code:
  - Modified: src/components/UpdateChecker.tsx, src/app/listings/page.tsx, src/components/Sidebar.tsx, src/lib/form-renderer/chapter-grouper.ts, src/components/forms/FieldVisitForm.tsx
  - New: （視 admin 設定頁面需求而定）
  - Removed: （無）
