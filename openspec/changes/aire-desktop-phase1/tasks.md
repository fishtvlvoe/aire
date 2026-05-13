# AIRE Desktop Phase 1 — 任務清單

## Group 1：Tauri + Next.js 整合 spike（依 design.md D1：Tauri + Next.js 整合方式 — Static Export 模式）

- [x] 1.1 [Tool: copilot] 初始化專案骨架（capability: desktop-shell - Requirement: Tauri shell with Next.js frontend；依 D1：Tauri + Next.js 整合方式 — Static Export 模式 與 Interface / Data Shape 章節）：建立 `package.json` 設定 next@16 + react@19 + @tauri-apps/api、`next.config.ts` 設 `output: 'export'` 與 `images.unoptimized: true`、`tsconfig.json` 含 path aliases、`src-tauri/Cargo.toml` 含 tauri@2 + rusqlite + reqwest + keyring + serde + tokio、`src-tauri/tauri.conf.json` 中 `build.frontendDist: '../out'`。完成驗證：`pnpm install` 無錯、檔案皆存在。
- [x] 1.2 [Tool: copilot] Hello World 整合 spike（capability: desktop-shell - Requirement: IPC bridge between frontend and Rust）：在 `src-tauri/src/main.rs` 註冊 `greet(name: String) -> String` 命令；在 `src/app/page.tsx` 用 `invoke('greet', { name: 'AIRE' })` 顯示回傳值；`pnpm tauri dev` 開窗看到字串；`pnpm tauri build` 在 macOS arm64 產出 `.dmg`、在 Windows x64（GitHub Actions）產出 `.msi`。
- [x] 1.3 [Tool: copilot] 應用資料目錄初始化（capability: desktop-shell - Requirement: Application data directory）：實作 `src-tauri/src/paths.rs` 暴露 `app_data_dir()` 回傳跨平台路徑（macOS `~/Library/Application Support/aire/`、Windows `%APPDATA%\aire\`）；首次啟動建立目錄與 `logs/` 子目錄。驗證：刪除目錄後重啟，目錄重建。
- [x] 1.4 [Tool: copilot] 主視窗初始狀態（capability: desktop-shell - Requirement: First-run window state；依 Behavior（使用者觀察到的行為））：在 `src-tauri/tauri.conf.json` 設定 `app.windows[0]` 為 `width=1280, height=800, minWidth=1280, minHeight=800, center=true, title='AIRE <version>'`，其中 `<version>` 從 `Cargo.toml` 注入。驗證：dev mode 啟動，視窗置中、最小尺寸 1280x800、標題含版本號。

## Group 2：SQLite schema 與 migrations（依 design.md D2：SQLite Schema 與 Migration 策略）

- [x] 2.1 [Tool: copilot] [P] 建 migration 檔（capability: local-database - Requirement: SQLite database initialization、Cases table schema、Disclosure drafts table schema、Settings key-value store）：寫 `src-tauri/migrations/001_initial.sql` 含四張表（cases、disclosure_drafts、settings、operation_log）+ 索引 + CHECK constraints + `PRAGMA user_version = 1`，schema 完全依 design.md D2 DDL。
- [x] 2.2 [Tool: copilot] Migration runner（capability: local-database - Requirement: SQLite database initialization）：`src-tauri/src/db/mod.rs` 暴露 `init_db(path: &Path) -> Result<Connection>`，讀 `user_version` pragma、列舉 `migrations/` 下未套用的 .sql 檔（按檔名排序）依序 exec、每套用一個更新 `user_version`。單元測試：fresh DB 套到 v1、已是 v1 不重複套。
- [x] 2.3 [Tool: copilot] Cases CRUD repository（capability: local-database - Requirement: Cases table schema、Boundary handling on database errors）：在 `src-tauri/src/db/cases.rs` 寫 `insert_case`、`get_case`、`list_cases`、`update_case`、`delete_case`，回傳 `Result<T, DbError>`，`DbError` 含 `code` 與 `message`。空表 `list_cases` 回 `Ok(vec![])`。
- [x] 2.4 [Tool: copilot] Drafts repository（capability: local-database - Requirement: Disclosure drafts table schema）：在 `src-tauri/src/db/drafts.rs` 寫 `upsert_draft(case_id, payload_json, schema_version)` 用 `INSERT OR REPLACE`、`get_draft(case_id) -> Result<Option<DraftData>>`，刪除 case 後相應 draft 自動 cascade。
- [x] 2.5 [Tool: copilot] Settings repository（capability: local-database - Requirement: Settings key-value store）：在 `src-tauri/src/db/settings.rs` 寫 `get_setting(key)`、`set_setting(key, value)` 用 `INSERT OR REPLACE`，自動更新 `updated_at`。

## Group 3：OS keychain 與憑證儲存（依 design.md D4：API Key 與 Token 的本機安全儲存）

- [x] 3.1 [Tool: copilot] Keyring 封裝（capability: secure-credential-storage - Requirement: OS-native credential storage、Credential retrieval boundary cases；依 D4：API Key 與 Token 的本機安全儲存）：`src-tauri/src/secrets.rs` 用 `keyring` crate 暴露 `get_credential(name) -> Result<Option<String>, CredError>`、`set_credential(name, value)`、`delete_credential(name)`；service name 寫死為 `"aire"`；缺值回 `Ok(None)`、keychain 鎖定回 `Err(LOCKED)`。
- [x] 3.2 [Tool: copilot] [P] 憑證寫失敗錯誤路徑（capability: secure-credential-storage - Requirement: Keychain write failure surfaces explicit error）：activate 流程偵測到 `set_credential` 失敗時，回傳 `ActivationError { code: 'CREDENTIAL_STORE_UNAVAILABLE' }` 並不寫 `settings`。單元測試用 mock keyring 觸發失敗。
- [x] 3.3 [Tool: copilot] [P] 確認憑證不存 SQLite（capability: secure-credential-storage - Requirement: No plaintext credentials in SQLite；依 Scope Boundaries 章節）：在 `src-tauri/src/db/settings.rs` 加白名單檢查 — 拒絕對 key 為 `license_key`、`license_token`、`land_registry_api_key` 的 `set_setting` 呼叫，回 `Err(SettingsError::ReservedKey)`；單元測試確認嘗試寫入會被拒、且 `aire.db` 中 `settings` 表查不到任何敏感 key。

## Group 4：序號啟用與驗證（依 design.md D3：序號驗證流程與離線容錯）

- [x] 4.1 [Tool: copilot] OPCOS HTTP client（capability: license-activation - Requirement: License activation flow、License verification on startup）：`src-tauri/src/opcos.rs` 用 `reqwest` 包 `verify_license(key, device_id)` 與 `activate_license(key, device_id, device_name, os_version)`，base URL 取自環境變數 `OPCOS_API_BASE_URL`（預設 `https://opcos.example.com`），timeout 10 秒。
- [x] 4.2 [Tool: copilot] device_id 生成（capability: license-activation - Requirement: License activation flow）：首次啟動產生 UUID v4 存 `settings.device_id`，後續啟動讀回；單元測試確認跨重啟值不變。
- [x] 4.3 [Tool: copilot] License IPC commands（capability: license-activation - Requirement: License activation flow、Remote revocation handling）：`src-tauri/src/commands/license.rs` 暴露 `activate_license(key)`、`verify_license()`、`get_license_status()`；activate 成功寫入 keychain + settings；verify 收 401/403 設 `license_status='revoked'`。
- [x] 4.4 [Tool: sonnet] 啟動序列與離線寬限（capability: license-activation - Requirement: License verification on startup、Offline grace period）：`src-tauri/src/startup.rs` 實作完整啟動決策樹（已啟用 < 7 天直入 / 7-30 天嘗試 verify / > 30 天強制重驗 / 撤銷跳啟用畫面），所有路徑寫 `operation_log`。多分支邏輯複雜，附單元測試覆蓋 design.md D3 表格 5 列。
- [x] 4.5 [Tool: copilot] 啟用畫面 UI（capability: license-activation - Requirement: License activation flow）：`src/app/activation/page.tsx` 含序號輸入框 + 啟用按鈕；錯誤訊息對應 design.md D3 的 409/422 文案；成功後 `router.push('/cases')`。

## Group 5：案件 CRUD 與列表（依 case-management spec）

- [x] 5.1 [Tool: copilot] Cases IPC commands（capability: case-management - Requirement: Create case flow、Edit case page、Delete case）：`src-tauri/src/commands/cases.rs` 暴露 `list_cases`、`get_case`、`create_case`、`update_case`、`delete_case`；create 自動產 UUID + 時間戳；delete 寫 `operation_log` action=`case_delete`。
- [x] 5.2 [Tool: copilot] [P] 案件列表頁（capability: case-management - Requirement: Case list view）：`src/app/cases/page.tsx` 用 `invoke('list_cases')` 取資料；空表顯示 `尚無案件，按右上角「新增案件」開始`；表格欄位翻譯成中文（`成屋`/`土地`、`草稿`/`已完成`/`已匯出`）；`updated_at` 用 `Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei' })` 格式化。
- [x] 5.3 [Tool: copilot] [P] 新增案件頁（capability: case-management - Requirement: Create case flow）：`src/app/cases/new/page.tsx` 含 `property_type` 選擇器（radio：`成屋`/`土地`）+ 必填欄位（地號、地址、屋主姓名）；客戶端用 zod 驗證；提交成功後 `router.push('/cases/<new-id>')`。
- [x] 5.4 [Tool: copilot] [P] 編輯與刪除頁（capability: case-management - Requirement: Edit case page、Delete case、Case status transitions）：`src/app/cases/[id]/page.tsx` 載入 case 顯示 header + 對應表單；含 `刪除` 按鈕 + 確認 modal、`標示為完成` 按鈕（draft → completed 才顯示）。
- [x] 5.5 [Tool: copilot] 狀態轉換邏輯（capability: case-management - Requirement: Case status transitions）：在 `cases` IPC 加 `mark_completed(case_id)` 命令，拒絕從 `exported` 或 `completed` 倒退回 `draft`；按鈕僅在 `draft` 狀態顯示。

## Group 6：說明書表單 — 成屋（依 disclosure-form-residential spec 與 design.md D6：表單草稿自動儲存）

- [ ] 6.1 [Tool: sonnet] 成屋欄位 schema 與 zod 驗證（capability: disclosure-form-residential - Requirement: Residential disclosure form fields、Field validation rules）：`src/lib/disclosure-schema-residential.ts` 定義所有欄位 key + 型別 + zod schema（負數拒、小數限 2 位、tri-state booleans 用 `'true' | 'false' | 'unknown'`）；驗證表參考 spec 內 5 列表格。粒度大需推理。
- [ ] 6.2 [Tool: copilot] 成屋表單 5 個 Tab UI（capability: disclosure-form-residential - Requirement: Residential disclosure form fields）：`src/components/disclosure-form-residential.tsx` 用 Radix Tabs 實作 `標示`/`權利`/`稅費`/`現況`/`附件` 5 個 tab；切換 tab 不重 mount 子元件、值保留。
- [ ] 6.3 [Tool: copilot] [P] 草稿自動儲存 hook（capability: disclosure-form-residential - Requirement: Draft autosave）：`src/lib/use-draft-autosave.ts` 暴露 React hook，1000ms debounce 後呼叫 `invoke('save_draft', ...)`；視窗關閉時用 Tauri `onCloseRequested` 事件強制 flush；UI 右上角狀態指示器顯示 `已儲存 HH:mm:ss` 或 `儲存失敗，已保留輸入`。
- [ ] 6.4 [Tool: copilot] 載入既有草稿（capability: disclosure-form-residential - Requirement: Form reload from saved draft）：開啟既有案件時呼叫 `invoke('get_draft', { case_id })`，將 `payload_json` 填入表單；缺欄位用 schema 預設值。

## Group 7：說明書表單 — 土地（依 disclosure-form-land spec）

- [ ] 7.1 [Tool: sonnet] 土地欄位 schema 與 zod 驗證（capability: disclosure-form-land - Requirement: Land disclosure form fields、Field validation rules）：`src/lib/disclosure-schema-land.ts` 定義土地欄位（land_lot_no、land_area、share_ratio 等）+ zod schema（share_ratio 介於 0-1）；驗證表參考 spec 6 列表格。
- [ ] 7.2 [Tool: copilot] [P] 土地表單 4 個 Tab UI（capability: disclosure-form-land - Requirement: Land disclosure form fields）：`src/components/disclosure-form-land.tsx` 用 Radix Tabs 實作 4 個 tab；共用 Group 6 的 autosave hook 與 reload 邏輯。

## Group 8：PDF 產出器（依 disclosure-pdf-render spec 與 design.md D5：PDF 產出器選型 — pdf-lib + 既有底板疊圖）

- [ ] 8.1 [Tool: copilot] PDF 底板與字型資源（capability: disclosure-pdf-render - Requirement: PDF template overlay rendering、Embedded Traditional Chinese font）：從 `不動產說明書/` 複製 19 頁底板 PDF 到 `src/resources/templates/residential.pdf` 與 `land.pdf`；下載 Noto Sans TC Regular、用 `pyftsubset` 產出 5000 字子集化字型存 `src/resources/fonts/NotoSansTC-Subset.ttf`，目標 < 2MB。
- [ ] 8.2 [Tool: sonnet] PDF 座標表（capability: disclosure-pdf-render - Requirement: PDF template overlay rendering）：`src/lib/pdf-layout.ts` 匯出 `residentialLayout` 與 `landLayout`，每筆 `{ field, page, x, y, size }`；先做封面 + 第一頁找對座標再類比後續頁。每頁需視覺校對。
- [ ] 8.3 [Tool: copilot] PDF 渲染器（capability: disclosure-pdf-render - Requirement: PDF template overlay rendering、Embedded Traditional Chinese font）：`src/lib/pdf-renderer.ts` 暴露 `renderDisclosurePdf(case, payload) -> Promise<Uint8Array>`，用 pdf-lib + fontkit 載入底板、嵌入字型子集、按座標表 drawText。
- [ ] 8.4 [Tool: copilot] PDF 匯出 IPC + 系統檔案對話框（capability: disclosure-pdf-render - Requirement: Output file path and post-export behavior、Failure modes during export）：`src-tauri/src/commands/pdf.rs` 收前端傳來的 PDF bytes + 目標路徑（前端先用 `@tauri-apps/plugin-dialog` 開檔案對話框取得），寫檔成功更新 `cases.status='exported'` 寫 `operation_log`；失敗按照 spec 的失敗矩陣回 4 種錯誤碼。
- [ ] 8.5 [Tool: copilot] 匯出後 UI 行為（capability: disclosure-pdf-render - Requirement: Output file path and post-export behavior）：匯出成功 toast 顯示 `匯出成功` + `開啟所在資料夾` 按鈕（用 `revealItemInDir`）；失敗顯示對應錯誤訊息。

## Group 9：Operation log（依 operation-log spec）

- [ ] 9.1 [Tool: copilot] [P] Log writer（capability: operation-log - Requirement: Operation log table、Log writes are non-blocking、No personally identifiable information in payload）：`src-tauri/src/log.rs` 暴露 `write_log(action, payload, result)`；非同步寫入（spawn tokio task）；payload redaction 白名單只允許 `case_id`、`device_id`、`output_path`、`reason`；寫失敗只印 stderr 不 propagate。
- [ ] 9.2 [Tool: copilot] [P] Log 查詢 IPC（capability: operation-log - Requirement: Log retention）：`src-tauri/src/commands/log.rs` 暴露 `list_recent_logs(limit)` 用 `SELECT * FROM operation_log ORDER BY ts DESC LIMIT ?`；單元測試確認用了 `idx_op_log_ts` 索引（EXPLAIN QUERY PLAN 出現 INDEX）。

## Group 10：UI 設計系統 — 與 OPCOS 對齊（依 design.md D7：UI 設計系統 — 與 OPCOS 共用視覺 token）

- [ ] 10.1 [Tool: copilot] [P] 抽 OPCOS 設計 token（capability: ui-design-system - Requirement: Shared design tokens with OPCOS；依 D7：UI 設計系統 — 與 OPCOS 共用視覺 token）：等 OPCOS Phase 1 完工後，讀 `Development/ST/upstream/apps/saas/tailwind.config.ts` 的 `theme.extend`，抽出 colors / fontFamily / borderRadius / boxShadow 寫成 `src/styles/design-tokens.json`；在 AIRE 的 `tailwind.config.ts` 用 `import tokens from './src/styles/design-tokens.json'` 套入 `theme.extend`。驗證：AIRE 用 `bg-primary` 的元素渲染顏色與 OPCOS 同一 class 視覺一致。
- [x] 10.2 [Tool: copilot] [P] Icon 與字型統一（capability: ui-design-system - Requirement: Icon library uniformity）：安裝 `lucide-react`、`@fontsource/noto-sans-tc`、`@fontsource/inter`、`@fontsource/jetbrains-mono`；`src/app/layout.tsx` import 字型 CSS；ESLint 規則 `no-restricted-imports` 禁 `react-icons` 與 `@heroicons/react`；自訂 ESLint rule（或 grep CI script）禁 JSX 字面值含 emoji。
- [x] 10.3 [Tool: copilot] Atomic 元件（capability: ui-design-system - Requirement: Atomic component styling consistency）：在 `src/components/ui/` 寫 `Button.tsx`、`Input.tsx`、`Card.tsx`、`Tabs.tsx`、`Dialog.tsx`，全部用 token-based Tailwind class（`bg-primary`、`rounded-md` 等），禁 inline style、禁 hard-coded hex；附單頁 demo 路由 `/dev/components` 列出所有元件樣態。
- [ ] 10.4 [Tool: sonnet] 視覺對齊驗收（capability: ui-design-system - Requirement: Visual parity verification with OPCOS）：寫 `docs/visual-parity-checklist.md` 列至少 3 列（主按鈕、輸入框、卡片）；用 Playwright 對 OPCOS dashboard 與 AIRE 案件列表各截 1280x800 圖；視覺對照每列填 `match` / `drift` / `mismatch`，drift 或 mismatch 須修正後重檢。

## Group 11：UX 互動模式 — 與 OPCOS 對齊（依 design.md D8：UX 互動模式 — 與 OPCOS 共用行為規則）

- [ ] 11.1 [Tool: sonnet] UX patterns 文件化（capability: ux-interaction-patterns - Requirement: Three-state UI for async operations、Draft autosave behavior、Confirmation dialog triggers、Error message tone and content、Toast notification policy、Keyboard shortcut conventions；依 D8：UX 互動模式 — 與 OPCOS 共用行為規則）：寫 `docs/ux-patterns.md`（繁中）含 6 大類規則與範例 — (1) 三態 UI 模板（loading/empty/error） (2) autosave 策略 (3) confirmation 觸發表（含「會 / 不會跳」對照） (4) error message 模板（網路/權限/驗證/儲存/遠端拒絕） (5) toast vs banner vs modal 政策 (6) keyboard shortcut table。文件要可讓 OPCOS 端也參考。
- [x] 11.2 [Tool: copilot] UX atomic 元件（capability: ux-interaction-patterns - Requirement: Three-state UI for async operations、Draft autosave behavior、Toast notification policy）：在 `src/components/ux/` 寫 `LoadingState.tsx`、`EmptyState.tsx`、`ErrorState.tsx`、`ConfirmDialog.tsx`、`Toaster.tsx`、`AutosaveIndicator.tsx`，全部依 `docs/ux-patterns.md` 規則實作；附 demo 路由 `/dev/ux` 展示所有元件樣態。
- [x] 11.3 [Tool: copilot] [P] 鍵盤快捷鍵系統（capability: ux-interaction-patterns - Requirement: Keyboard shortcut conventions）：寫 `src/lib/keyboard-shortcuts.ts` 用 `useEffect` + `keydown` 事件監聽全域；註冊 Cmd/Ctrl+N、Cmd/Ctrl+S、Cmd/Ctrl+,、Esc、Cmd/Ctrl+K（K 為 stub）；macOS 用 Cmd、Windows 用 Ctrl 自動判斷；附單元測試覆蓋 5 個快捷鍵。
- [ ] 11.4 [Tool: sonnet] UX 互動驗收 checklist（capability: ux-interaction-patterns - Requirement: Three-state UI for async operations、Confirmation dialog triggers、Error message tone and content、Toast notification policy）：寫 `docs/ux-acceptance-checklist.md` 列至少 12 項手動驗收項目（例如：開啟空 cases 看到正確 empty card / 刪除案件跳 modal 含正確文案 / 拔網路看到錯誤訊息符合模板 / 匯出 PDF 跳成功 toast 3 秒消失 / 按 Esc 關 modal）；每項標記 pass / fail / N/A。

## Group 12：驗收與打包（依 design.md Acceptance Criteria 與 Scope Boundaries 章節）

- [ ] 12.1 [Tool: sonnet] 端到端驗收（capability: case-management、disclosure-form-residential、disclosure-form-land、disclosure-pdf-render）：跑完整流程 — 啟動 → 啟用測試序號（mock OPCOS API）→ 新增 1 件成屋 + 1 件土地 → 填欄位 → 關閉重開確認草稿保留 → 匯出 PDF → 視覺校對 PDF 與既有 19 頁底板對齊。整合多模組，附驗收清單與截圖證據。
- [ ] 12.2 [Tool: copilot] GitHub Actions 打包 workflow（capability: desktop-shell - Requirement: Tauri shell with Next.js frontend）：`.github/workflows/release.yml` 含 macOS arm64 + Windows x64 兩個 job，每個 job 跑 `pnpm install` → `pnpm tauri build` → upload artifact（.dmg / .msi）；artifact 命名含 `${name}-${version}-${arch}.${ext}` 避免覆蓋（L064）。
- [ ] 12.3 [Tool: copilot] [P] README 與安裝指南（capability: desktop-shell）：寫 `README.md`（開發者）與 `docs/install-guide.md`（Fish 到客戶現場用的安裝 SOP），含啟用流程、常見問題、聯絡方式。
