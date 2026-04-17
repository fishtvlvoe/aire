## Why

建安不動產（以及未來要販售給其他房仲店家）需要一套**本機安裝**的三階段自動化系統，取代電秘書的文書工作，賺回每月 7 萬元以上的人力成本。

系統以 Docker 容器打包，裝在客戶 Windows 電腦，使用客戶自備的 Codex CLI 帳號（不收 API key、資料不外流），讓業務從「接到屋主電話」一路到「產出五份文件」全程自動化。

v2 因範圍與架構定義不清被廢棄（詳見 `archive/2026-04-17-three-stage-listing-workflow-v2/`），v3 重新定義：

1. **範圍擴大**：13 種物件類型全實作（v2 妥協為 6 種）
2. **產出簡化**：5 份文件（v2 錯誤加到 7 份）
3. **部署模式明確**：Docker 容器 + 容器內建 Codex CLI + 客戶首次登入（v2 未定義）
4. **三階段流程明確**：委託前 → 簽委託（人工）→ 委託後

## What Changes

### 🎯 Core Architecture

- **Docker 容器化部署**：Next.js + SQLite + Puppeteer + **容器內建 Codex CLI** + 中文字型 + 模板
- **Codex 使用方式**：容器啟動首次要求客戶 `codex login`，OAuth token 持久化到宿主機掛載資料夾，之後永久免登
- **Windows 一鍵啟動**：提供 `start.bat`，雙擊 → 啟動容器 → 開瀏覽器
- **資料持久化**：SQLite + uploaded 檔案存宿主機掛載資料夾，容器移除資料不丟

### 🎯 三階段流程

**階段一：委託前（Pre-Commission）**
- UI：業務接到屋主電話，輸入屋主姓名 + 地址（或地號）
- 自動查詢公開資料：謄本、地籍圖、使用分區、實價登錄
- 自動填入物件基本資料（待回填欄位也先建立）
- **v3 第一版**：UI + 欄位就緒；爬蟲繼承 v1 POC，逐站 port（無法 port 的先手動貼）

**階段二：簽委託（人工環節，系統不介入）**

**階段三：委託後產文件（Post-Commission）**
- UI：選物件類型（13 種）→ 填「現場必問清單」→ 填「秘書後補清單」→ 一鍵產文件
- 同時產出 5 份文件：
  1. **不動產說明書 PDF**（建安固定格式，建物/土地各一份模板，16 章結構）
  2. **物調表 MD**（業務帶看自用）
  3. **591 PO 文 MD**（複製貼上直接上 591）
  4. **銷售 DM 文案 MD**（後續套版印 DM）
  5. **FB 貼文 + 圖片提示詞 MD**（5 平台：FB/IG/Threads/Line/YT Community）

### 🎯 13 種物件類型（全實作）

**建物類（7 種）**：公寓、大樓華廈、透天別墅、套房、店面、廠房、農舍
**土地類（6 種）**：農地、建地/住宅地、商業地、工業地、鄉村區建地、其他土地

### 🎯 輸出格式決策

| 文件 | 格式 | 理由 |
|------|------|------|
| 不動產說明書 | PDF | 客戶要簽名，建安固定版面 |
| 物調表 | MD | 業務自用，AI 可讀可再生 |
| 591 PO 文 | MD | 複製貼上 591 平台 |
| 銷售 DM 文案 | MD | 後續套版彈性高 |
| FB 5 平台貼文 | MD | 複製貼上各社群平台 |

**設計原則**：除了不動產說明書必須固定版面，其他全部 MD（AI 可讀、人可讀、可再生）。

## Non-Goals（明確排除）

- ❌ 雲端部署 / SaaS 多租戶（資安考量，v3 單機；未來可能轉 SaaS 再評估）
- ❌ AI 語音客服（獨立新創案子，不混進來）
- ❌ 影片自動生成 / 短影音剪輯（吉梦負責）
- ❌ VR/AR 環景整合（願景太遠）
- ❌ 全自動競爭力比價報告（先不做，v4 評估）
- ❌ LINE Bot 介面（v3 用 Web UI）
- ❌ 授權鎖機 / 硬體綁定（v3 先不做，未來轉 SaaS 後用帳號綁定）
- ❌ 點數計費（客戶用自己 Codex 帳號，成本客戶扛）
- ❌ 委託中階段（簽委託是人工，系統不介入）
- ❌ 可編輯式 PDF 表單（不動產說明書系統產出鎖定版 PDF）

## Capabilities

### New Capabilities

- `container-deployment`：Docker 打包、Windows 啟動腳本、Codex 容器內登入流程、資料持久化
- `pre-commission-lookup`：階段一 UI + 公開資料查詢（繼承 v1 POC 爬蟲，逐站 port）
- `five-documents-generator`：5 份文件一鍵產出協調器（涵蓋不動產說明書 PDF、物調表 MD、591 PO 文 MD、銷售 DM 文案 MD、FB 5 平台貼文 MD）

### Modified Capabilities（v2 已存在，v3 擴充）

- `property-type-registry`：從 6 種擴充到 13 種
- `field-visit-form`：支援 13 類 + 章節分群 + displayMode 樣式
- `supplementary-form`：支援 13 類 + 顯示 pre-commission 資料為參考
- `listing-workflow`：新增 pre-commission state

### v2 Code 繼承說明（僅說明，不是新 capability）

v2 已實作的 code 多數可繼承，詳細清單見 design.md 的「Inherited Code」段落。概要：

- **100% 可直接搬用（lib 核心層）**：property-types、db、pdf-generator、document-generator/codex-provider、listing API routes
- **小幅修改可用**：form-renderer、FieldVisitForm、SupplementaryForm 等（擴 13 類）
- **砍掉重寫**：所有 app/listings UI 頁面（假資料）、SocialPostTabs、ShortVideoScript（v3 不做短影音）

## Impact

### 新增檔案
- `docker/`（Dockerfile、compose.yaml、start.bat、安裝說明）
- `src/lib/codex-client/`（容器內 Codex CLI wrapper）
- `src/lib/pre-commission/`（階段一爬蟲與查詢）
- `src/lib/document-generator/md/`（4 份 MD 產出器）
- `src/app/pre-commission/`（階段一 UI）
- `openspec/specs/container-deployment/`
- `openspec/specs/pre-commission-lookup/`
- `openspec/specs/five-documents-generator/`

### 修改檔案
- `src/lib/property-types/`（補 7 種類型 schema）
- `src/lib/db/schema.ts`（新增 pre-commission 欄位）
- `src/app/api/listings/`（新增階段一 endpoints）

### 繼承檔案（不動）
- `src/lib/document-generator/codex-provider.ts`
- `src/lib/form-renderer/`
- 既有 form 相關元件

## Implementation Strategy

v3 範圍大、需並行執行。考慮拆為 3 個並行 sub-change：

- `v3-container-deployment`（獨立，可先動）
- `v3-five-documents`（依賴 property-types 擴充）
- `v3-pre-commission-lookup`（依賴 v1 POC code 考古）

但初期評估 3 個強耦合（共享 DB schema、Codex client），**建議單一 change 分 Phase 執行**：

- **Phase 1**：容器化基礎設施 + Codex 登入流程（可獨立驗證）
- **Phase 2**：13 種類型補完 + 5 份文件產出器（核心變現功能）
- **Phase 3**：階段一爬蟲與公開資料查詢（繼承 v1 POC）

詳見 `design.md` 的 Implementation Distribution Strategy。
