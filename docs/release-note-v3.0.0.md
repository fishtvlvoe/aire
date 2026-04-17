# 建安不動產系統 Release Note

## 版本資訊

| 項目 | 內容 |
|---|---|
| 客戶 | 建安不動產 |
| 版本 | v3.0.0 |
| 發布重點 | 三階段作業自動化 + 五種 AI 文件一鍵產出 + Docker 一鍵啟動 |

## 這版可以幫你做什麼

v3.0.0 把日常接案流程整合為「**Pre-commission → 現場勘查 → 文件產出**」三階段，讓業務從接到屋主電話到上架文案、說明書產出更快更穩定。

### 主要功能

1. **三階段自動化流程**
   - 委託前資料整理（Pre-commission）
   - 現場勘查資訊補齊
   - 委託後文件一次產出
2. **5 種 AI 文件輸出**
   - 問卷摘要
   - 591 listing 文案
   - DM 文案
   - 社群貼文
   - 不動產說明書 PDF
3. **可插拔 LLM 後端**
   - 透過 `LLM_BACKEND` 切換：`codex` / `claude-code` / `gemini` / `ollama`
4. **Docker 一鍵啟動（Windows）**
   - 透過 `start.bat` 快速啟動服務
5. **SQLite 資料持久化**
   - 本機資料可持續保存（對應掛載資料夾）

## 安裝需求

- Windows 10/11（已安裝 Docker Desktop）
- 選擇一種 LLM 後端：
  - Codex：需 OpenAI 訂閱帳號
  - Gemini：需 Google 帳號
  - Ollama：可使用本地免費模型

## 安裝與啟動步驟

1. 解壓縮 release zip  
2. 執行 `first-login.bat`（首次設定）  
3. 執行 `start.bat`（日常啟動）  
4. 瀏覽器開啟 `http://localhost:3000`

## 給業務同仁的小提醒

- `first-login.bat` 只需第一次執行（完成登入授權後可重複使用）
- 日常只要執行 `start.bat` 即可開始使用
- 系統啟動後若瀏覽器沒有自動開啟，手動輸入 `http://localhost:3000` 即可
