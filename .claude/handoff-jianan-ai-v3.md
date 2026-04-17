---
name: handoff-jianan-ai-v3
description: 建安不動產 AI 系統 v3.0.0 — Docker image 待 rebuild/push + 剩餘任務清單
type: project
---

# 建安不動產 AI 系統 v3 交接

**狀態：** 不動產說明書 16 章 PDF 功能已完成並 archive，Docker image 尚未 rebuild + push（disclosure 功能是新加的，image 需要重建）
**日期：** 2026-04-18

## 做了什麼

### 這個 session 完成的事
- **Spectra change `disclosure-pdf-16-chapter`** 全部 15 個任務完成，已 archive
- `CodexDocumentGenerator.generate()` 呼叫 `generateBuildingDossier` / `generateLandDossier` 取代佔位符 `'[PDF 由任務 10 實作]'`
- `isLandType(propertyType)` helper：農地/建地/商業地/工業地/鄉村區建地/其他土地 → true
- `generateDossierPDF()` 改為回傳 `Uint8Array`（不寫磁碟），供 API route stream 給瀏覽器
- PDF route (`/api/listings/[id]/pdf?type=disclosure`) 使用 Puppeteer 輸出 A4 PDF
- documents 頁面修正：PDF 連結加 `?type=disclosure`；所有文件類型（含 disclosure）都有「重新產生」按鈕
- 單元測試：`isLandType` 9 cases + `five-documents.test.ts` 16 章非佔位符驗證
- 已 `git commit`（15 files, 614 insertions）

### 之前 session 已完成（`containerized-three-stage-automation-v3`）
- Docker 容器化（Dockerfile、docker-compose.yml、start.bat、first-login.bat、安裝說明.md）
- 13 種物件類型全開、欄位 metadata（sourceType/displayMode）
- 9 章節 Tab UI、表單動態渲染
- Pre-commission 三階段工作流（委前查詢 → 現場勘查 → 產文件）
- 5 份文件生成系統（物調表、591 PO 文、銷售 DM、社群貼文、不動產說明書）
- Docker build + tag `fishandy1213/jianan-ai:v3.0.0`（但 **disclosure 功能加完後尚未重建**）

## 還沒做的

### 最優先（下一個 session 先做）
- [ ] **重建 Docker image 並推送**
  ```bash
  docker build --platform linux/amd64 -t fishandy1213/jianan-ai:v3.0.0 .
  docker push fishandy1213/jianan-ai:v3.0.0
  ```
  注意：Dockerfile 已存在，只需 rebuild。build 需 5–15 分鐘。

- [ ] **任務 19.3**：寫 release note（功能摘要 + 安裝步驟）— `[Tool: copilot-gen]`
  內容包含：v3 新功能（三階段流程、13 種類型、5 份文件、16 章 PDF）、安裝步驟（first-login.bat → start.bat）、已知限制（Codex 需手動登入一次）

### 需 Fish 實際操作（暫緩）
- [ ] **任務 5.1**：e2e 容器內登入 Codex → `codex exec "hello"` 成功 — 需要 Windows 環境驗證
- [ ] **任務 16.6**：mock 站點 + LLM fallback 測試
- [ ] **任務 20.1**：建安不動產現場實機安裝（Fish 需親自在場）
- [ ] **任務 20.2**：業務 + 秘書跑一個真實物件
- [ ] **任務 20.3**：客戶簽驗收單

## 關鍵決策

1. **Docker image tag**：`fishandy1213/jianan-ai:v3.0.0`，Docker Hub 帳號 `fishandy1213`，本機已登入
2. **Codex CLI 登入**：容器內需用戶第一次手動執行 `docker exec -it jianan-ai-app-1 codex login`（OAuth 互動式），`first-login.bat` 有引導步驟
3. **LLM backend**：`.env` 的 `LLM_BACKEND` 控制（codex/claude-code/gemini/ollama），預設 codex
4. **資料持久化**：SQLite 放 `./data/db/app.sqlite`，volume mount 到宿主機
5. **土地版 vs 建物版**：`isLandType()` 判斷，已在 `codex-provider.ts` export

## 改了哪些檔案（這個 session）

```
src/lib/document-generator/codex-provider.ts        # isLandType + 呼叫 dossier generators
src/lib/pdf-generator/dossier.ts                    # 回傳 Uint8Array，不寫磁碟
src/app/api/listings/[id]/pdf/route.ts              # disclosure 用 generateDossierPDF
src/app/listings/[id]/documents/page.tsx            # PDF URL + 重新產生按鈕
src/lib/document-generator/__tests__/five-documents.test.ts  # 16 章驗證
src/lib/document-generator/__tests__/land-type.test.ts       # isLandType 9 cases（新增）
src/lib/pdf-generator/__tests__/dossier.test.ts     # Uint8Array mock 更新
openspec/specs/property-dossier/spec.md             # 同步 delta spec
openspec/specs/disclosure-document-generation/      # 新 spec（archive 建立）
openspec/changes/archive/2026-04-18-disclosure-pdf-16-chapter/  # 已 archive
```

## Spectra 狀態

- `disclosure-pdf-16-chapter`：已 archive ✓
- `containerized-three-stage-automation-v3`：未 archive（5.1、16.6、19.3、20.x 未完成）
  → 等 Docker push + release note 完成後再 archive
