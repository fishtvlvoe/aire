# MVP Launch And Follow-up Plan

日期：2026-05-20

目的：整理第一個可賣版本需要完成什麼、哪些已在本 repo 有基礎、哪些要等外部金流 / SaaS / 法律 / 真實 COP 訂閱。

## Minimum Sellable Launch Checklist

### A. 不動產說明書輸出

- [x] 成屋版第 3 步 Page Contract 工作台。
- [x] 地政資料拉取後可讀預覽。
- [x] 謄本 payload 本機保存。
- [x] 物件資料表自動回填可由 API 取得的欄位。
- [x] 生活機能與位置圖合併成摘要頁。
- [x] 第 5 步預覽與下載 PDF 使用同一份 PDF blob。
- [x] 建物現況調查表改為 38 題空白勾選欄。
- [ ] 真實客戶 PDF 人工驗收。
- [ ] 真實 Tauri app 關閉重開後，確認拉過的 `land_registry_data` 仍存在。

### B. 授權與下載

- [x] Rust client 有 `activate_license`、`verify_license`、`get_license_status`。
- [x] license key / token 使用 OS Keychain。
- [x] `device_id` 本機生成且穩定。
- [x] 啟動驗證有 7 天 / 30 天寬限邏輯。
- [ ] 正式 `aire.opcos.me` entitlement backend。
- [ ] 正式安裝檔下載頁。
- [ ] 正式 code signing / notarization。

### C. 隱私與法律

- [x] 本機資料 / 雲端授權邊界文件。
- [x] 客戶網站聲明草稿。
- [x] 無雲端備份責任聲明草稿。
- [ ] 律師審查。
- [ ] 正式 Terms / Privacy Policy。

### D. 金流

- [ ] Basic / Pro / Advanced 價格。
- [ ] 付款 provider。
- [ ] 訂閱 webhook。
- [ ] entitlement 更新與 app sync。

金流不阻擋目前不動產說明書輸出收斂，但會阻擋完全自助購買。

## Existing Code Map

| 面向 | 目前檔案 | 狀態 |
| --- | --- | --- |
| 授權 IPC | `src-tauri/src/commands/license.rs` | 有基礎 |
| OPCOS client | `src-tauri/src/opcos.rs` | 有基礎，正式 base URL 未接 |
| Keychain | `src-tauri/src/secrets.rs` | 有基礎 |
| 啟動寬限 | `src-tauri/src/startup.rs` | 有基礎 |
| License UI | `src/components/settings/LicenseSection.tsx` | dev/mock 與 API 混合，需正式化 |
| Premium UI | `src/components/settings/PremiumUnlockSection.tsx` | 舊 MCP Hub 命名，需改成 AIRE plan |
| Dev flags | `src/components/settings/DevSuperAdmin.tsx` | 開發用途 |
| 本機案件 DB | `src-tauri/src/db/*` | 有基礎 |
| 謄本保存 | `src-tauri/migrations/012_registry_payloads.sql` | 已補 |
| 圖片資產 | `case_assets` migrations / commands | 已擴充 |
| 實價登錄 | `src-tauri/src/commands/real_price.rs` | 有 callable 能力 |
| 地圖 / 空拍 / 街景 | `src-tauri/src/geo_services/*` | 有 callable 能力 |

## Feature Bundle Map

| Bundle | 功能 | Entitlement key |
| --- | --- | --- |
| Base Registry | 地政謄本拉取、保存、預覽、自動回填 | `registry_pull` |
| Base Document | 手動補齊、草稿預覽、PDF 匯出、手動上傳圖片 | `draft_pdf_export` |
| Market | 實價登錄、周邊行情 | `real_price`, `nearby_market` |
| Map | 位置圖、周邊圖、地籍圖 | `location_map`, `cadastral_map` |
| Visual Advanced | 空拍圖、街景/外觀參考、格局圖處理 | `aerial_photo`, `street_view_reference`, `floor_plan_processing` |
| Marketing Advanced | 104、591、社群貼文、DM | `marketing_docs` |

## Shared Disclosure Output Slots

Basic 與 Advanced 使用同一份文件 layout，差別是內容來源。

| Slot | Basic | Pro | Advanced |
| --- | --- | --- | --- |
| 謄本欄位 | API 拉取 | API 拉取 | API 拉取 |
| 實價行情 | 空白 / 手填 | 自動帶入 | 自動帶入 |
| 生活機能 | 手填 / 空白 | 自動摘要 | 自動摘要 |
| 位置圖 | 手動上傳 | 自動產生 + 手動覆蓋 | 自動產生 + 手動覆蓋 |
| 地籍圖 | 手動上傳 | 自動取得 + 手動覆蓋 | 自動取得 + 手動覆蓋 |
| 空拍圖 | 不顯示或空白頁 | 不顯示或空白頁 | 自動取得 |
| 街景 / 外觀參考 | 手動上傳 | 手動上傳 | 自動取得 + 手動覆蓋 |
| 格局圖 | 手動上傳 | 手動上傳 | 格局圖處理 / AI 輔助 |

## Legacy 104 / Marketing Modules

已找到的舊文件：

- `docs/房仲物件流程自動化：產出五種文件與AI語音客服.md`
- `docs/2026-04-16 房仲物件流程自動化：產出五種文件與AI語音客服.md`

文件明確提到：

- 不動產說明書
- 591 PO 文
- 物調表
- 銷售 DM
- FB / 社群平台貼文

目前沒有找到清楚獨立的 `104` 模組定義。先把 `104` 放在 Advanced backlog，不納入不動產說明書 MVP。

## Follow-up Workstreams

### Follow-up 1：Disclosure output acceptance

目的：讓第一個客戶驗收 PDF。

輸入：

- `0520/不動產說明書-bug`
- `0520/不動產說明書`
- 目前新輸出的 PDF

驗收：

- 客戶看得懂
- 現場可手寫
- 缺資料留空白
- 謄本可抓到的資料有自動帶入
- PDF 預覽和下載一致

### Follow-up 2：Entitlement backend

目的：把 mock feature flags 改成 SaaS plan entitlement。

驗收：

- 客戶改方案後 App 自動開功能。
- App 本機 cache entitlement。
- Super admin 只在 development 可覆蓋。
- Cloud entitlement 不接收案件內容。

### Follow-up 3：Payment

目的：完成自助付款與訂閱。

驗收：

- checkout 成功建立 license / seat。
- webhook 更新 plan。
- app sync 後功能自動變動。

### Follow-up 4：Legal / privacy launch package

目的：完成付費上線必備的法律文字。

驗收：

- Terms
- Privacy Policy
- first-use acknowledgment
- no-cloud-backup notice
- license transfer terms

## Deferred / External Blockers

| 項目 | 為什麼不能在本輪假裝完成 |
| --- | --- |
| 完整 opcOS 登入中心 | 不是 AIRE MVP 必要前置，且會拖慢第一版 |
| 正式金流 | 需要選 provider、定價、webhook schema |
| 律師審查 | 需要外部法律專業 |
| 真實 COP 訂閱能力 | 需要實際 token / 套餐權限 |
| 真實 Tauri DB 持久化手動驗收 | 需要桌面 app 以真實操作關閉重開驗證 |
| 104 模組 | 目前文件沒有清楚定義，先列 Advanced backlog |
