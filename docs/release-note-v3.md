# 建安 AI 系統 v3.0.0 Release Note

**發布日期：** 2026-04-18  
**Docker Image：** `fishandy1213/jianan-ai:v3.0.0`

---

## 本版重點功能

### 1. Docker 容器化 — 一鍵安裝，無需技術背景

業務員電腦不需安裝 Node.js 或開發環境。只需安裝 Docker Desktop，執行兩個批次檔即可完成部署。

- `first-login.bat`：首次安裝，下載 image、設定資料夾、完成 AI 後端登入
- `start.bat`：每次日常啟動，自動偵測 Docker、啟動容器、開啟瀏覽器

資料儲存於本機 `%USERPROFILE%\建安AI\data\`，重新啟動不遺失。

### 2. 三階段委託流程

委託物件從接觸到簽約，系統貫穿完整流程：

| 階段 | 名稱 | 說明 |
|------|------|------|
| 階段一 | 委託前查詢 | 輸入屋主資料，自動查詢謄本/地籍圖/實價登錄；無法自動查的，業務手動貼上 AI 解析 |
| 階段二 | 現場勘查 | 9 章節動態表單，依物件類型顯示對應欄位，秘書事後補充欄位 |
| 階段三 | 產文件 | 點一下自動生成 5 份文件 |

### 3. 13 種物件類型全支援

公寓、大廈、透天厝、別墅、辦公室、套房、店面、廠房、農地、建地、商業地、工業地、鄉村區建地、其他土地，每種類型有對應的欄位 schema 與表單。

### 4. 5 份文件一鍵生成

| 文件 | 格式 | 說明 |
|------|------|------|
| 物調表 | Markdown | 物件詳細調查報告 |
| 591 PO 文 | Markdown | 591 房屋網刊登文案 |
| 銷售 DM | Markdown | 紙本或電子 DM 文案 |
| 社群貼文 | Markdown | Facebook + LINE + Instagram + 短影音腳本 |
| 不動產說明書 | **PDF** | 16 章完整格式，含建安 LOGO 頁眉頁腳 |

每份文件均可獨立重新產生，不影響其他文件。

### 5. 不動產說明書 — 16 章 PDF（本版新增）

符合不動產說明書法規格式，自動依物件類型切換建物版或土地版章節：

- 建物版：16 章（含建物資料、謄本摘要、建物現況、管理費、附近公共設施等）
- 土地版：16 章（含地籍資料、地號、使用分區、地形地貌等）

A4 橫式排版，Puppeteer 輸出，可直接列印或傳 PDF。

### 6. AI 後端可切換

| 後端 | 帳號需求 |
|------|---------|
| `codex`（預設） | OpenAI ChatGPT Plus 或 API 付費帳號 |
| `claude-code` | Anthropic Claude Code 訂閱 |
| `gemini` | Google Gemini CLI 登入 |
| `ollama` | 本地免費，需先啟動 Ollama |

---

## 安裝步驟

### 系統需求

- Windows 10 / 11（64 位元）
- RAM 8 GB 以上
- 磁碟 10 GB 以上可用空間
- 網路（首次安裝）

### 完整安裝流程

1. 安裝 [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
2. 重新開機，確認 Docker Desktop 已啟動（底部顯示「Engine running」）
3. 將 `docker/` 資料夾內以下四個檔案複製到客戶電腦：
   - `compose.yaml`
   - `first-login.bat`
   - `start.bat`
   - `安裝說明.md`
4. 雙擊 **`first-login.bat`**（僅需執行一次）
   - 自動拉取 Docker image（約 5–15 分鐘，視網路速度）
   - 提示登入 AI 後端（預設：OpenAI，瀏覽器 OAuth 授權）
5. 首次安裝完成後，日後每次使用只需雙擊 **`start.bat`**

### 詳細說明

見同資料夾 `安裝說明.md`，包含 AI 後端切換說明與疑難排解。

---

## 已知限制

- **Codex 後端容器內首次登入需要互動**：`first-login.bat` 會引導使用者執行 `docker exec -it jianan-ai-app-1 codex login`，需要手動完成一次 OAuth。後續啟動自動使用已儲存的 token。
- **平台限制**：目前僅支援 Windows 10 / 11。macOS 版本規劃中。
- **謄本/地籍圖自動查詢**：部分政府網站有反爬蟲保護，無法自動查取時系統自動切換「手動貼上 + AI 解析」模式。

---

## 後續規劃

- SaaS 化：多店家帳號隔離，雲端部署
- 自動帶入謄本解析結果至說明書章節
- 物件照片 AI 說明文字生成
