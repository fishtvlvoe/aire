## Summary

補齊 v3.0 交付後缺少的基礎設施與品質項目，讓系統達到可正式交付的完整度。

## Motivation

目前核心業務流程已 100% 貫通（委託前 → 現勘 → 補充 → AI 文件生成 → PDF 下載），但有 4 個面向尚未補齊：

1. **無 CI/CD**：推送到 GitHub 後沒有自動測試和 build 驗證，品質無法持續保障
2. **PDF 排版粗糙**：物調表（survey）和銷售 DM（sales-dm）使用 `<pre>` 標籤排版，不夠專業
3. **品牌未到位**：`layout.tsx` 的 metadata 還是 Next.js 預設的 "Create Next App"
4. **.env.example 不完整**：缺少 `LLM_BACKEND`、`DATABASE_PATH`、`CHROMIUM_PATH` 等生產必要變數，新開發者或客戶部署時會困惑

## Proposed Solution

### 1. CI/CD Pipeline（GitHub Actions）

建立 `.github/workflows/ci.yml`：
- 觸發條件：push to main、PR
- 步驟：checkout → setup Node 22 → npm ci → npm run test → npm run build
- 環境變數：`DATABASE_PATH=:memory:`（與 vitest.config.ts 一致）
- Puppeteer 處理：`PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`，apt 安裝 chromium-browser，設 `PUPPETEER_EXECUTABLE_PATH`

### 2. PDF 模板專業化

為 survey 和 sales-dm 兩種 PDF 類型建立專屬 HTML/CSS 模板（參考既有 dossier 模板架構）：
- A4 格式、Noto Serif TC 字體
- 頁首頁尾（logo、頁碼、日期）
- 表格化排版（取代 `<pre>` 純文字）
- 透過 Puppeteer 渲染為 PDF

### 3. 品牌 metadata

修改 `src/app/layout.tsx`：
- `metadata.title` → "建安 AI 房產文件系統"
- `metadata.description` → "三段式 AI 房產文件自動產出系統"
- 視需要更新 favicon

### 4. .env.example 補全

新增缺少的環境變數，含中文說明，方便新開發者或客戶設定。

## Non-Goals

- **不**做 Dockerfile 優化（gemini-cli 重複安裝）：原本提及「可順手修」，現移交給 hybrid-architecture Wave 3 一併處理（避免兩個 change 同時動 Dockerfile 造成 merge 衝突）
- **不**改動既有業務邏輯（fill 流程、document generators、API routes）
- **不**重寫 dossier 模板（已存在且運作正常）
- **不**新增 LLM backend（adapter 已支援多後端）
- **不**新增 disclosure 16 章內容（v3.0 已完成）

## Capabilities

### Modified Capabilities

- `container-deployment`: 新增 ci-cd-pipeline requirement
- `document-generation`: 新增 professional-pdf-templates requirement

## Impact

- 影響的 specs：container-deployment（modified）、document-generation（modified）
- 影響的程式碼：
  - New: `.github/workflows/ci.yml`
  - New: `src/lib/pdf-generator/templates/survey.html`、`survey.css`
  - New: `src/lib/pdf-generator/templates/sales-dm.html`、`sales-dm.css`
  - Modified: `src/app/layout.tsx`（metadata）
  - Modified: `.env.example`（新增變數說明，**保留 DATA_API_URL 由 hybrid-architecture 追加**）
  - Modified: `src/app/api/listings/[id]/pdf/route.ts`（survey/sales-dm 改用新模板）
  - Removed: 無
- 對其他 change 的依賴：
  - 依賴 fix-failing-tests 完成（CI/CD 上線時測試必須全綠）
  - 與 hybrid-architecture Wave 3 協調 Dockerfile / .env.example（本 change 預留位置，不衝突）
