## Context

建安不動產（客戶 A）已提供完整資料集合：
- 13 種物件類型的現場必問清單 + 秘書後補清單（.docx）
- 建物物調表母版（.dot）+ 土地物調表母版（.docx）
- 16 份不動產說明書 PDF 範本（合併成一份完整 16 章模板）
- 欄位總表（建物版 + 土地版）標記「固定顯示 / 需估算 / 留空回填」

v2 已封存，可繼承 `src/lib/` 的核心模組（property-types、db、pdf-generator、codex-provider）。v3 是 v2 架構的升級，不是從零開始，但 UI 層幾乎全重寫。

部署目標：客戶 Windows 電腦裝 Docker Desktop，雙擊 `start.bat` 啟動，首次登入客戶自備的 Codex CLI 帳號後永久免登，資料持久化在宿主機。

## Goals / Non-Goals

### Goals

1. **Docker 容器打包可在 Windows 執行**（宿主 Docker Desktop + WSL2）
2. **容器內建 Codex CLI**，客戶登入一次即可長期使用
3. **13 種物件類型全實作**，不再砍半
4. **三階段流程**：委託前 UI + 公開資料查詢（爬蟲可延後）→ 簽委託（不介入）→ 委託後填表產 5 份文件
5. **5 份文件一鍵產出**：1 PDF（不動產說明書）+ 4 MD（物調表/591/DM/FB 5 平台）
6. **資料持久化**：SQLite + uploads 綁定宿主機 volume，容器刪除資料不丟
7. **繼承 v2 可用 code**：不重寫 lib 核心層

### Non-Goals

- 雲端 SaaS / 多租戶（v3 單機）
- 授權鎖機（v3 先不做）
- AI 語音客服、影片生成、VR/AR（獨立案子）
- 競爭力比價報告（v4 再評估）

## Decisions

### D1. Codex CLI 放容器內（不走 bridge、不 mount 宿主 codex）

**決策**：Dockerfile 直接 `RUN` 安裝 Codex CLI，容器內跑 `codex exec`。首次啟動引導客戶 `codex login`，token 存於 `/root/.codex/auth.json`，mount 到宿主 volume 持久化。

**理由**：
- 跨平台（Windows/Mac/Linux 同一套 image）
- 不需宿主網路橋接或路徑轉換（Windows Docker mount 路徑坑多）
- 客戶只需登入一次
- 無法 mount 宿主 Windows `.exe` 到 Linux 容器（架構不相容）

**Trade-off**：image 變大約 200MB，但客戶只下載一次，可接受。

### D2. 不動產說明書：合併 16 頁附件為單一模板 + Puppeteer PDF

**決策**：16 份 PDF 實為「一份完整說明書+附件包的 16 個分頁」（經 Copilot OCR 萃取確認，見 `docs/extracted-dossier-schema.md`）。合併為單一模板（建物版、土地版各一套），結構為：
- 封面 + 法規告知
- 產權調查表（建物/土地標示、權利）
- 現況調查表（土地版特有 p1~p4）
- 稅費/規費計算
- 成交行情/周遭設施（附錄）

AI 產 Markdown → CSS 排版 → Puppeteer 印 PDF。

**理由**：
- Copilot 萃取結論：16 份 = 一份說明書的分頁模板，不是 16 個範例
- 建物類 7 種共用建物版模板、土地類 6 種共用土地版模板
- 繼承 v2 `src/lib/pdf-generator/dossier.ts`
- CSS 控制版面（分頁、頁碼、表格線、建安 LOGO 頁首）
- 稅費概算是**系統計算**（非 AI 生成），依公告地價/現值/持分/期間/物價指數等規則推算

**Trade-off**：模板升級需重新渲染，但客戶格式相對穩定。

### D3. 其他 4 份文件全部 MD（物調表、591、DM、FB 貼文）

**決策**：除不動產說明書外，所有產出為 Markdown。

**理由**：
- AI 可讀 + 人可讀（客戶要求）
- 表格支援（| 語法）
- 重生成不失真（純文字結構）
- 複製到 591、FB 等平台符號自動忽略，等同純文字效果
- 不需要版面控制（這幾份都是業務自用或複製貼上）

### D4. 階段一 v3 第一版：UI + 手動貼 > 全自動爬蟲

**決策**：階段一 UI（輸入姓名/地址/地號）v3 必做；自動爬蟲實作分為：
- v3 Phase 3：繼承 v1 POC 已驗證的網站（若有）
- 無法 port 的站點：先開欄位讓秘書手動查完貼入
- v3.1 再補全自動化

**理由**：
- 爬蟲風險高（反爬、驗證碼、網站改版）
- 先讓業務流程跑起來比自動化重要
- v1 POC 已有部分可繼承，但不 block v3 上線

### D5. 容器內資料持久化用 volume mount，不是 named volume

**決策**：宿主機建立 `%USERPROFILE%\建安AI\data\` 資料夾，容器啟動時 mount：
- `./data/db` → `/app/data/db`（SQLite）
- `./data/uploads` → `/app/data/uploads`（現場照片、謄本掃描）
- `./data/outputs` → `/app/data/outputs`（產出 PDF、MD）
- `./data/codex` → `/root/.codex`（Codex 登入 token）

**理由**：
- 宿主機資料夾客戶看得到、可備份
- 客戶換電腦只要把資料夾拷過去即可
- named volume 客戶不會管理

### D6. 13 種類型全開，schema 差異化但共用 UI 元件

**決策**：13 種類型的 field schema 各自定義，但 form-renderer 統一渲染。v2 已有架構（`src/lib/form-renderer`），v3 擴充 schema 檔到 13 份。

**類型清單**：
- 建物類（7）：公寓、大樓華廈、透天別墅、套房、店面、廠房、農舍
- 土地類（6）：農地、建地/住宅地、商業地、工業地、鄉村區建地、其他土地

### D7. Windows 啟動腳本：批次檔 + PowerShell

**決策**：提供 `start.bat`：
```
1. 檢查 Docker Desktop 是否運行（未運行則提示啟動）
2. docker compose up -d
3. 等待服務就緒（health check）
4. 打開預設瀏覽器到 http://localhost:3000
```

首次啟動另有 `first-login.bat`，引導 codex login 流程。

**理由**：Windows 用戶不需要學 Docker 指令，雙擊即可。

### D8. 欄位總表 metadata：sourceType + displayMode

**決策**：每個欄位 schema 新增兩個屬性：
- `sourceType`: `'deed' | 'onsite' | 'secretary' | 'public-data'`（謄本/現場/秘書/公開資料）
- `displayMode`: `'fixed' | 'estimate' | 'blank'`（固定顯示/需估算/留空回填）

**理由**：
- 客戶提供的欄位總表就是這樣分類
- UI 可根據 displayMode 顯示不同樣式（需估算=黃框、留空=灰框）
- AI 產文件時可依 sourceType 決定要不要寫

### Implementation Distribution Strategy

| 代理 | 負責任務類別 | 理由 |
|------|------------|------|
| **Copilot CLI (gpt-5.2)** | 核心業務邏輯、API routes、文件產出器、Codex prompt | 免費額度、精準度高 |
| **Cursor-agent** | 13 種 type schema 擴充、UI 頁面重寫、Tailwind | 零 token、本機偵察強 |
| **Codex CLI** | TDD 測試撰寫、Docker 配置、容器內驗證 | 有 shell 執行能力 |
| **Kimi MCP** | Code Review（3+ 檔案 diff）、架構一致性檢查 | 大 context、CR 強 |
| **Gemini CLI** | 爬蟲目標網站研究、Codex CLI 最新語法查詢 | 上網能力 |

**Token 預算**：每 Phase 目標 ≤ 30K Anthropic tokens（大部分派給免費/訂閱制工具）。

**並行策略**：
- Phase 1 與 Phase 2 可高度並行（docker 獨立於業務邏輯）
- Phase 3 依賴 Phase 2 的資料流（先做 UI 再接爬蟲）

## Risks / Trade-offs

### R1. Codex CLI 容器內在 Windows Docker Desktop + WSL2 能不能跑
- **風險**：WSL2 下的 Linux 容器執行 Codex CLI，登入瀏覽器 callback 可能遇到網路隔離
- **Mitigation**：Phase 1 先做 spike 驗證（在 Mac Docker 驗證 + 找一台 Windows 驗證），若不可行改 bridge 模式

### R2. 16 章模板結構還沒完全萃取（Copilot 任務待完成）
- **風險**：不動產說明書結構未完全確認，若客戶實際期待跟假設差異大需大改
- **Mitigation**：Phase 2 前 Copilot 萃取必須完成；萃取完成後直接 review 給客戶確認

### R3. 爬蟲繼承 v1 POC 可用性未知
- **風險**：v1 POC 可能已過期（網站改版），繼承成本可能 = 重寫
- **Mitigation**：Phase 3 先派 cursor-agent 盤點 v1 POC，評估可用性；實在不行改「秘書手動貼」模式

### R4. 客戶電腦規格不確定
- **風險**：舊電腦跑 Docker + Puppeteer 可能很慢
- **Mitigation**：start.bat 加資源檢查（記憶體 < 8GB 警告）；image 盡量瘦身

### R5. 資料安全（客戶資料不能外流）
- **Mitigation**：
  - 所有資料只存本機 SQLite + 宿主 volume
  - Codex CLI 呼叫走客戶自己的 OpenAI 帳號（OpenAI 有資料不訓練選項）
  - 容器無外部對外服務暴露（只綁 localhost）

### R6. 客戶後續要 SaaS 化
- **Mitigation**：架構保留多租戶抽象（workspaceId 欄位），但 v3 先 hardcode 單租戶

## Inherited Code from v2

經 cursor-agent 掃描 `src/` 後分類如下：

### 100% 可直接搬用（lib 核心層）

- src/lib/property-types/ — 13 種類型 registry + schemas（v3 把 available 從 6 開到 13）
- src/lib/db/ — listing workflow 狀態機骨架（draft → field-visit-complete → ready-for-generation → documents-ready）
- src/lib/pdf-generator/dossier.ts — Markdown → PDF 能力（給不動產說明書用）
- src/lib/document-generator/codex-provider.ts — 容器內執行 Codex CLI 的機制（貼合 v3 Docker 方向）
- src/app/api/listings/[id]/field-visit/route.ts — 階段三表單 API
- src/app/api/listings/[id]/supplementary/route.ts — 秘書後補 API

### 小幅修改可用

- src/lib/property-types/index.ts — available flag 從 6 種開到 13 種
- src/lib/form-renderer/index.ts — schema key 組法修 bug、type 定義補 file
- src/lib/document-generator/types.ts — 7+ 份文件模型改為 v3 的 5 份
- src/app/api/listings/[id]/generate/route.ts — 輸出欄位對齊 v3
- src/app/api/listings/[id]/pdf/route.ts — 文件 type map 改 v3 命名
- src/components/forms/FieldVisitForm.tsx — 支援 13 類（目前只 2 類）
- src/components/forms/SupplementaryForm.tsx — 對齊 v3 秘書後補欄位

### 砍掉重寫（不符 v3 架構）

- src/app/listings/page.tsx — 硬編假資料，不是 workflow UI
- src/app/listings/new/page.tsx — 建立物件是 TODO，未串 API
- src/app/listings/[id]/fill/page.tsx — placeholder 欄位，非 schema-driven
- src/app/listings/[id]/generating/page.tsx — 假進度 + 列 7 份（v3 只要 5 份）
- src/app/listings/[id]/documents/page.tsx — 假預覽 + 文件集合不符 v3
- src/components/outputs/SocialPostTabs.tsx、ShortVideoScript.tsx、MarketingFlowGuide.tsx — 綁定多平台/短影音舊邏輯，偏離 v3

## Migration Plan

1. v2 已 archive，code 保留不動
2. v3 新 Phase 1：建 Docker 基礎設施（不影響既有 code）
3. v3 Phase 2：在既有 `src/lib/` 上擴充，不 break 既有功能
4. v3 Phase 3：新增階段一模組，獨立於既有流程

每 Phase 結束都可部分 deliverable（Phase 1 可獨立交付 Docker image，Phase 2 可獨立交付文件產出器），降低整體 risk。

## Open Questions（待解決）

- ~~**OQ1**：16 章具體結構？~~ ✅ **已解決**：Copilot 已萃取，見 `docs/extracted-dossier-schema.md`。結構為「一份說明書+附件包」（建物版 5 大段、土地版 6 大段含現況調查表）
- **OQ2**：v1 POC 爬蟲位置？（Phase 3 開始前 cursor-agent 考古）
- **OQ3**：建安 LOGO 圖檔、字型授權？（客戶提供，Phase 2 前需到位）
- **OQ4**：客戶電腦規格最低要求？（寫到安裝指南）
