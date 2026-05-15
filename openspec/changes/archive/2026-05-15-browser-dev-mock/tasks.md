# Tasks: browser-dev-mock

## Group 1: Mock Backend 核心（Task Group 1: Mock backend 核心; D1: Mock dispatch 架構 — safeInvoke 內部條件分支 + D2: Mock store 資料結構 — 單一 MockStore class; Task Group 2: safeInvoke 改造）— 涵蓋 spec「Mock Store Command Coverage」+「Mock Dispatch in Browser Development Environment」

- [x] 1.1 [Tool: Sonnet] 建立 MockStore class + mockInvoke dispatcher（Mock Store Command Coverage）— 新建 `src/lib/mock-backend.ts`，實作 MockStore class 包含所有 22 個 IPC command handler。MockStore constructor 初始化 seed data（2 筆案件、5 筆日誌、3 條法條、預設品牌設定「測試不動產」）。mockInvoke 用 switch-case dispatch 到對應 handler，未知 cmd 拋 Error("Mock not implemented: {cmd}")。匯出 mockInvoke 函式和 MockStore class（供測試 reset）。驗收：`src/lib/__tests__/mock-backend.test.ts` 覆蓋每個 command 的 happy path + reset 後狀態回初始值 + 未知 cmd 拋錯。

- [x] 1.2 [Tool: Copilot] 改造 safeInvoke dev mock 分支（Mock Dispatch in Browser Development Environment）— 修改 `src/lib/tauri-bridge.ts` 的 safeInvoke 函式：在 `!inTauri` 分支內加 `process.env.NODE_ENV === "development"` 條件判斷，成立時 dynamic import mock-backend.ts 呼叫 mockInvoke，不成立時維持拋 NotInTauriError。驗收：更新 `src/lib/__tests__/tauri-bridge.test.ts` 加三個分支測試（dev mock / prod error / tauri real）。

## Group 2: UI 適配（D3: Activation 頁面 mock 環境行為 — 顯示完整啟動流程 + D4: Dashboard 頁面 mock 環境行為 — 移除 TauriRequired 包裹）— 涵蓋 spec「Activation Page Mock Environment Behavior」; Task Group 3: Activation + Dashboard 頁面適配; In Scope / Out of Scope 見 design.md

- [x] [P] 2.1 [Tool: Copilot] TauriRequired 元件 dev bypass（D4: Dashboard 頁面 mock 環境行為 — 移除 TauriRequired 包裹）— 修改 `src/components/TauriRequired.tsx`：當 `process.env.NODE_ENV === "development"` 時直接 render children 不顯示 fallback。驗收：更新 `src/components/__tests__/TauriRequired.test.tsx` 加 dev 環境直接 render children 的測試案例。

- [x] [P] 2.2 [Tool: Copilot] Activation 頁面 dev 環境適配（D3: Activation 頁面 mock 環境行為 — 顯示完整啟動流程; Activation Page Mock Environment Behavior）— 修改 `src/app/activation/page.tsx`：環境判斷改為三態（Tauri → 真 invoke、dev 非 Tauri → mock invoke 顯示序號輸入框、prod 非 Tauri → 顯示桌面 App 提示）。dev 環境下輸入序號 → safeInvoke("activate_license") → mock 成功 → 導向 dashboard。驗收：更新 `src/app/activation/__tests__/page.test.tsx` 加 dev mock 環境啟動流程測試。

## Group 3: 整合驗證（涵蓋 design: task group 1: mock backend 核心（d1 + d2）, task group 2: safeinvoke 改造（d1）, task group 3: activation + dashboard 頁面適配（d3 + d4））

- [x] 3.1 [Tool: Sonnet] 整合驗證 — 執行 `npx vitest run` 全部通過、`pnpm build` 零錯誤。啟動 `pnpm dev` 後在瀏覽器 localhost:3000 完成完整流程：activation 頁輸入序號 → 啟動成功 → dashboard 案件列表顯示 2 筆 seed 案件 → 新增案件成功 → 品牌設定頁載入 → 日誌頁顯示 5 筆紀錄。截圖存到 `.artifacts/browser-dev-mock/` 驗收。
