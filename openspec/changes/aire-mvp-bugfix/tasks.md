## 1. App Icon 替換（對應 design D1: App Icon 替換策略，in scope 第一項）

- [x] [P] 1.1 設計 AIRE 品牌 icon source（1024x1024 PNG），藍底 #2563EB + 白色 A 字樣，存為 `src-tauri/icons/aire-source.png`。執行 `pnpm tauri icon src-tauri/icons/aire-source.png` 產生所有平台尺寸。驗證：`ls src-tauri/icons/` 看到更新後的 icon.icns、icon.ico、各尺寸 png，且 `pnpm tauri dev` 啟動後 macOS Dock icon 為 AIRE 品牌圖示。對應 design D1: App Icon 替換策略、Implementation Contract Task Group 1: Icon 替換。 [Tool: copilot]

## 2. Tauri Bridge 建立（對應 design D2: Tauri 環境偵測 — 非同步偵測 + 快取、D3: 統一 IPC 呼叫封裝 — safeInvoke、D5: 瀏覽器環境錯誤呈現，Implementation Contract Task Group 2: tauri-bridge.ts）

- [x] 2.1 建立 `src/lib/tauri-bridge.ts`，exports：`isTauriEnv(): Promise<boolean>`（非同步偵測 + 模組層快取）、`safeInvoke<T>(cmd, args?): Promise<T>`（Tauri 環境走 invoke，非 Tauri 拋 NotInTauriError）、`class NotInTauriError extends Error`。偵測邏輯：動態 import `@tauri-apps/api/core`，檢查 `typeof invoke === "function"`，3 秒超時視為非 Tauri。驗證：vitest 測試 `src/lib/__tests__/tauri-bridge.test.ts` 覆蓋 Tauri 環境（mock invoke 為 function）和瀏覽器環境（mock invoke 為 undefined）兩條路徑。對應 design D2、D3。 [Tool: sonnet]

- [x] 2.2 建立共用元件 `src/components/TauriRequired.tsx`：Card 容器、AIRE 標題、「此功能需在 AIRE 桌面 App 中使用」文字、「請開啟 AIRE 桌面應用程式以使用完整功能」說明。驗證：vitest 測試確認元件渲染指定文字。對應 design D5。 [Tool: copilot]

## 3. Activation 頁修正（對應 design D4: Activation 頁環境偵測修正，Implementation Contract Task Group 3: Activation 頁修正）

- [x] 3.1 修改 `src/app/activation/page.tsx`：將同步 `"__TAURI__" in window` 改為 `isTauriEnv()` 非同步偵測。新增 loading 狀態（偵測中顯示 Spinner），偵測完成後依結果顯示序號表單或「請在桌面 App 中開啟」。驗證：vitest 測試 mock `isTauriEnv` 回傳 true → 渲染 form、回傳 false → 渲染提示訊息。對應 design D4、spec license-activation-ui "Async Tauri Environment Detection"。 [Tool: sonnet]

## 4. IPC 呼叫改用 safeInvoke（對應 design D3: 統一 IPC 呼叫封裝 — safeInvoke，spec "Graceful IPC Fallback in Browser"，in scope 第四項）

- [x] [P] 4.1 實作 Graceful IPC Fallback in Browser 於 cases-api：修改 `src/lib/cases-api.ts` 的 `invokeIpc` 改用 `safeInvoke` from `@/lib/tauri-bridge`，移除內部的動態 import 邏輯。驗證：vitest 測試 mock safeInvoke，確認 `casesApi.list()` 在非 Tauri 環境拋出 NotInTauriError（非 TypeError）。對應 design D3、spec "Graceful IPC Fallback in Browser"。 [Tool: copilot]

- [x] [P] 4.2 修改 `src/lib/log.ts`：`listRecentLogs` 改用 `safeInvoke` from `@/lib/tauri-bridge`，移除內部的動態 import。驗證：vitest 測試確認瀏覽器環境下 listRecentLogs 回傳空陣列（catch NotInTauriError 後 graceful fallback）。對應 design D3。 [Tool: copilot]

- [x] [P] 4.3 修改 `src/components/LogoUploader.tsx` 和 `src/components/ThemeSelector.tsx`：invoke 呼叫改用 `safeInvoke`。驗證：vitest 測試確認非 Tauri 環境不拋 TypeError。對應 design D3。 [Tool: copilot]

## 5. 頁面層 fallback UI（對應 design D5: 瀏覽器環境錯誤呈現，Implementation Contract Task Group 4: 各頁面 fallback，out of scope 不含 mock data）

- [x] [P] 5.1 修改 `src/app/(dashboard)/cases/page.tsx`：catch block 偵測 NotInTauriError，渲染 `<TauriRequired />`。驗證：瀏覽器 localhost:3000/cases 顯示友善提示（非 TypeError）+ vitest 測試。對應 design D5、spec "Cases Page in Browser"。 [Tool: copilot]

- [x] [P] 5.2 修改 `src/app/(dashboard)/settings/branding/branding-content.tsx`：LogoUploader 和 ThemeSelector 的錯誤狀態渲染 `<TauriRequired />`。驗證：瀏覽器 localhost:3000/settings/branding 顯示友善提示 + vitest 測試。對應 design D5、spec "Branding Page in Browser"。 [Tool: copilot]

- [x] [P] 5.3 修改 `src/app/(dashboard)/settings/logs/page.tsx`：catch block 偵測 NotInTauriError，渲染 `<TauriRequired />`。驗證：瀏覽器 localhost:3000/settings/logs 顯示友善提示 + vitest 測試。對應 design D5、spec "Logs Page in Browser"。 [Tool: copilot]

## 6. 整合驗證

- [x] 6.1 執行 `pnpm build` 確認零 TypeScript 錯誤。執行 `npx vitest run` 確認所有測試通過。瀏覽器 localhost:3000 走訪 /activation、/cases、/settings/branding、/settings/logs 確認全部顯示友善提示（非 TypeError）。驗證：build 0 errors、vitest 全過、截圖 4 頁確認。 [Tool: sonnet]
