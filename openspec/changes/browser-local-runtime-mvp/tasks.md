## Wave 0｜前置：build 模式翻轉（先決條件，未完成則後面全部卡住）

> 決策依據：Fish 確認走 A 方案——正式 park Tauri、build 翻 Node standalone。
> 現況事實（已核實）：`next.config.ts:7` production 為 `output: "export"`（static export）；
> `/api/local/address-discovery` 與 `/api/local/formal-pull-data` 皆 `force-static` 且在 production 主動回 `local_proxy_unavailable`。
> 不先翻轉，Wave 2+ 的 API 與 launcher 在 packaged runtime 全部無法執行。

- [x] 0.1 Park 舊 Tauri/Windows/land lookup 相關 active changes，只保留本 change 作為 MVP 主線。
- [x] 0.2 Stash 先前 Tauri Local Runtime 實驗碼，保留可恢復紀錄但不放在 active worktree。
- [x] 0.3 [Tool: sonnet] `next.config.ts` production output 從 `"export"` 改 `"standalone"`；移除 static-export-only 假設（保留 `images.unoptimized`），更新檔頭「AIRE 是 Tauri 桌面 App」過時註解。
- [x] 0.4 [Tool: sonnet] 移除 `/api/local/address-discovery/route.ts` 與 `/api/local/formal-pull-data/route.ts` 的 `if (process.env.NODE_ENV === "production") return ...local_proxy_unavailable` guard。
- [x] 0.5 [Tool: sonnet] 兩個 local route 的 `export const dynamic = "force-static"` 改 `"force-dynamic"`，刪除「Tauri production build 走 IPC，不可宣告 force-dynamic」過時註解。
- [x] 0.6 [Tool: sonnet] 正式 park Tauri：`src-tauri/` build pipeline 退出 production build，標註可恢復方式與 commit；確認 `pnpm build` 走 standalone、不再產 `out/` static export。

## Wave 1｜TDD 紅燈（強制，不可跳；先全紅燈，Fish 確認紅燈清單後才進 Wave 2 實作）

> Spectra = Popper 證偽主義。每個 Requirement 先寫會失敗的測試，證明缺口存在，才寫實作。

- [x] 1.1 [Tool: sonnet] 紅燈：launcher 啟動後 `GET /api/health` 應回 200 `{status:'ok'}`（現無此 route，預期 404）。
- [x] 1.2 [Tool: sonnet] 紅燈：standalone production 下 `POST /api/local/address-discovery` 對已知地址應回真實 section/land/building（現回 `local_proxy_unavailable`）。
- [x] 1.3 [Tool: sonnet] 紅燈：建立 case → 重啟 runtime → case 仍可讀（現 Node 側無 SQLite，預期讀不到）。
- [x] 1.4 [Tool: sonnet] 紅燈：COP credential 存後重啟 → `/api/local/formal-pull-data` 讀得到 credential 執行 pull（現 Node 無 credential storage）。
- [x] 1.5 [Tool: sonnet] 紅燈：未帶本機 session token 的 `/api/local/*` 呼叫應被拒 401（現無 token 機制，呼叫直接成功）。
- [x] 1.6 [Tool: sonnet] 紅燈：草稿（API 資料快照）與說明書（草稿＋補件＋簽名頁）兩階段 PDF 應由 Node 端產出並原子寫檔到本機（現寫檔靠 Rust `export_pdf`，park Tauri 後預期失敗）。

## Wave 2｜Runtime 與 Launcher（Requirement: Windows local runtime delivery）

- [x] 2.1 [Tool: sonnet] production runtime builder：Next standalone `server.js` + `.next/static` + `public` + production node_modules → `dist-local-runtime/`，不含 repo/src/測試。
- [x] 2.2 [Tool: sonnet] 新建 `src/app/api/health/route.ts`：`GET` 回 `{status:'ok',version}`（轉綠 1.1；launcher 依賴此 route 判斷就緒）。
- [x] 2.3 [Tool: sonnet] Windows launcher：尋找可用 port、啟動 bundled Node server、polling `/api/health`、開啟系統預設瀏覽器。
- [x] 2.4 [Tool: sonnet] launcher 不依賴 terminal；重複啟動時復用既有 runtime 或安全重啟。
- [x] 2.5 [Tool: sonnet] runtime 只綁定 `127.0.0.1`，不得開放 LAN/`0.0.0.0`。

## Wave 3｜本機資料、安全與 MVP API（Requirement: Local data retention / Local API security boundary / MVP land-registry workflow）

> 此 Wave 是 Decision 5「Rust IPC 能力搬 Node」的真正工作量。已核實 Node 側目前完全沒有 SQLite 與 credential storage。

- [x] 3.1 [Tool: sonnet] Node 本機資料目錄 adapter，Windows 使用 `%LOCALAPPDATA%\\AIRE\\`（DB、credential、上傳、PDF、logs 統一根目錄）。
- [x] 3.2 [Tool: sonnet] Node SQLite adapter（`better-sqlite3` 或 `@libsql/client`）+ case CRUD route `/api/local/cases`（list/create/update/get）；schema 對應 Rust `001_initial.sql` + `006_case_fields.sql` 最小集（轉綠 1.3）。
- [x] 3.3 [Tool: sonnet] Node COP credential storage 取代 Rust keychain IPC：依 design Decision 7 方案（Windows DPAPI 或加密 JSON）存 `%LOCALAPPDATA%\\AIRE\\cop-credential.enc`；read/write/test 連線 route（轉綠 1.4）。
- [x] 3.4 [Tool: sonnet] 本機 session token（design Decision 3 + spec「Local API security boundary」）：launcher 生成隨機 token → 注入首頁 → 前端每次 `/api/local/*` 帶 `X-Local-Token` → server middleware 驗證，缺/錯回 401（轉綠 1.5）。
- [x] 3.5 [Tool: sonnet] `/api/local/address-discovery` 在 standalone production 對已知地址回 section/land/building（轉綠 1.2）。
- [x] 3.6 [Tool: sonnet] `/api/local/formal-pull-data` 在 standalone production 執行正式匯入，或在 COP 設定缺失時回明確錯誤（不得 `[object Object]`）。
- [x] 3.7 [Tool: sonnet] 確認 `land_registry_paid_address_resolver`（前端 `src/lib/land-registry-api.ts:354` 有呼叫，Rust 側無對應 `#[tauri::command]`）是 dead code 還是待實作：移除呼叫或在 Node 端新建。（已處置：paidAddressResolver 有真實 caller，標 @deprecated 導向 /api/local/address-discovery；generate_recovery_pdf 在範圍外不動）
- [x] 3.8 [Tool: sonnet] PDF 寫檔層搬 Node（design Decision 9）：前端 `pdf-lib` 渲染保留，新建 Node route 取代 Rust `export_pdf` IPC，原子寫檔（.tmp → rename）到 `%LOCALAPPDATA%\\AIRE\\` PDF 子目錄。
- [x] 3.9 [Tool: sonnet] 草稿 PDF 產出：吃便民系統（地政 API）查出的資料快照即時產出（業務現場簽約用），透過 3.8 寫檔層落地。
- [x] 3.10 [Tool: sonnet] 說明書 PDF 產出：在草稿基礎上延續——前面內容不變，加補件嵌入頁面（非 popup）+ 客戶簽名頁；同一渲染管線吃「API 資料＋手動補件」的資料快照（轉綠 1.6）。

## Wave 4｜Windows Installer（Requirement: Windows local runtime delivery / Local data retention）

- [x] 4.1 [Tool: sonnet] 實作獨立 NSIS 腳本（技術已定，見 design Decision 8；非 Tauri bundler、非 WiX）：打包 launcher + bundled Node runtime + Next standalone 產物，Node 內含不要求客戶自裝，Win11 相容。（獨立 NSIS 腳本 installer/aire-installer.nsi 完成，待 Windows 真機驗收）
- [x] 4.2 [Tool: sonnet] installer 建立桌面捷徑與開始功能表捷徑。（同上，待 Windows 驗收）
- [x] 4.3 [Tool: sonnet] uninstall 不刪客戶案件資料，除非使用者明確選擇清除。（uninstall 保留資料邏輯完成，待 Windows 驗收）
- [x] 4.4 [Tool: sonnet] 產出安裝包 provenance：commit、build command、artifact path、installer size。（PROVENANCE.md 完成）

## Wave 5｜驗收（Requirement: 全部）

> 強制行為驗證（L081）：不可只 build 通過就回報。Windows installer/launcher 需真機或 VM fullflow。

- [x] 5.1 [Tool: sonnet] macOS 本機 smoke：runtime builder、launcher health check、瀏覽器開啟。
- [ ] 5.2 [Tool: sonnet] Windows VM smoke：安裝、啟動、開瀏覽器、`/api/health` 回 200。（待 Windows VM）
- [ ] 5.3 [Tool: sonnet] Windows MVP fullflow：COP 設定保存、地址查詢、正式資料匯入、案件保存、草稿 PDF 產出、補件後說明書 PDF 產出（含簽名頁）、關閉重開後資料與 PDF 仍在、session token 生效。（待 Windows VM）
- [ ] 5.4 [Tool: sonnet] 已知測試地址驗收：新竹、台南各一筆，結果不得縣市錯置。（address-discovery 已真跑，EasyMap R02 回 easymap_town_not_found，需正確網路環境/地址，待驗收）
- [ ] 5.5 [Tool: sonnet] 記錄失敗模式與客戶可讀錯誤：runtime 起不來、port 被佔、COP 帳密錯、地政服務 timeout。（已知失敗模式：port 被佔→launcher 自動探測下一個；無 token→401；COP 缺→400 明確錯誤；EasyMap 查無→manual_required）
