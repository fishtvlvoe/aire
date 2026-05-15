# AIRE 專案 Copilot 指引

## Build / Test / Lint 指令

本專案使用 `pnpm`（`packageManager: pnpm@10.x`）。

| 目的 | 指令 |
| --- | --- |
| 啟動前端開發 | `pnpm dev` |
| 前端建置（Next static export） | `pnpm build` |
| Lint | `pnpm lint` |
| Type check | `pnpm type-check` |
| 單元測試（全部） | `pnpm test` |
| 單元測試（單檔） | `pnpm test -- src/components/__tests__/PdfPreviewer.test.tsx` |
| 單元測試（watch） | `pnpm test:watch` |
| E2E（全部） | `pnpm exec playwright test` |
| E2E（單檔） | `pnpm exec playwright test e2e/smoke.spec.ts` |
| 桌面 App 開發（Tauri） | `pnpm tauri:dev` |
| 桌面 App 打包（Tauri） | `pnpm tauri:build` |
| Rust 測試（全部） | `cargo test --manifest-path src-tauri/Cargo.toml` |
| Rust 測試（單一測試） | `cargo test --manifest-path src-tauri/Cargo.toml mark_completed` |

建議執行順序（一般功能變更）：

1. `pnpm lint`
2. `pnpm type-check`
3. `pnpm test`

## 高層架構（Big Picture）

- AIRE 是 **Tauri + Next.js** 桌面應用。
- `src/` 是前端（Next App Router + React），`src-tauri/src/` 是 Rust 後端與 IPC 命令。
- 前後端透過 Tauri `invoke(...)` 溝通；前端通常集中封裝在 `src/lib/*`，避免在元件內散落 IPC 呼叫。
- Next 設定為 `output: "export"`，打包後輸出到 `out/`，Tauri 以 `frontendDist: ../out` 載入。
- 本機資料儲存在 SQLite（`aire.db`），啟動時由 `db::init_db` 套 migration；路徑由 `paths::ensure_app_dirs()` 建立。
- 主要流程：
  1. 案件管理：`commands/cases.rs` + `db/cases.rs`
  2. 表單草稿：`disclosure-schema-*` + `use-draft-autosave.ts` + `commands/drafts.rs`
  3. PDF：`src/lib/pdf-engine/*`（預覽/渲染）+ `commands/pdf.rs`（寫檔、更新狀態、寫 log）
  4. 授權：`commands/license.rs` + `startup.rs`（啟動決策）

## 專案關鍵慣例（非通用、此專案特有）

- 採用 **Spectra / OpenSpec** 流程：`openspec/specs/`、`openspec/changes/`。有行為或架構變更時，優先走 spectra 指令流。
- **敏感憑證不得寫進 SQLite**：`db/settings.rs` 明確封鎖 `license_key` / `license_token` / `land_registry_api_key`，必須使用 OS keychain（`secrets.rs`）。
- IPC 錯誤維持 `{ code, message }` 形狀，前端依 `code` 做文案映射。
- 表單採「draft 可不完整、completed 要嚴格驗證」的雙 schema 模式（`*SchemaCompleted`）。
- 因 static export 限制，`/cases/[id]` 使用 placeholder `generateStaticParams` + client-side routing 取得真實 ID。
- Icon 來源有 lint 限制：統一使用 `lucide-react`，禁止 `react-icons` 與 `@heroicons/react`。
- 代理文件採漸進載入：先看 `docs/agents/README.md`，再依 domain/workflow 深入，不要一次讀完整包 docs。

## 變更對應測試（最低建議）

| 變更範圍 | 最低測試 |
| --- | --- |
| `src/components/**`、`src/lib/**`（前端邏輯/UI） | `pnpm test -- <相關測試檔>` |
| `src/app/**`（頁面流程） | `pnpm test -- <相關測試檔>`，必要時補 `pnpm exec playwright test e2e/<spec>.ts` |
| `src-tauri/src/commands/**`、`src-tauri/src/db/**`（Rust IPC/資料層） | `cargo test --manifest-path src-tauri/Cargo.toml` |
| `e2e/**` 或跨頁面流程 | `pnpm exec playwright test e2e/<spec>.ts` |
| 影響打包或部署設定（`next.config.ts`、`tauri.conf.json` 等） | `pnpm build` 與必要的 E2E smoke |

## MCP Server（建議先加 Playwright）

此專案有完整 `e2e/` 與 `playwright.config.ts`，最適合先配置 **Playwright MCP**，讓 Copilot 能直接協助：

- 驗證關鍵流程（案件建立、表單填寫、PDF 預覽/下載、授權流程）
- 針對單一 spec 做回歸檢查
- 追蹤失敗截圖、trace、report 輸出（依現有 Playwright 設定）

建議 MCP 工作流：

1. 先啟動桌面開發環境：`pnpm tauri:dev`
2. 優先用 MCP 跑「單一 spec」驗證改動（例如 `e2e/smoke.spec.ts`）
3. 單一 spec 通過後，再視風險擴到完整 `pnpm exec playwright test`
