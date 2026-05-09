# AIRE 核心系統架構與代碼深度審計報告 (CR-2026-05-08)

**審計對象：** AIRE 專案全體源碼  
**審計日期：** 2026-05-08  
**報告等級：** 深度技術審計 (Technical Audit - Deep Dive)

---

## 0. 執行摘要 (Executive Summary)
本專案在測試覆蓋率與模組化設計上表現優異，但在**規範強制執行 (Mandates Enforcement)**、**認證路徑一致性**以及**OCR 核心解析邊界**上存在顯著風險。特別是 API 非同步觸發機制中的認證缺失，將導致生產環境功能失效。

---

## 1. 規範合規性審計 (Mandate Compliance)

| 規範編號 | 規範內容 | 狀態 | 問題描述與代碼位置 |
| :--- | :--- | :--- | :--- |
| **#1** | 嚴禁無稽核硬刪除 | ⚠️ 警告 | `src/lib/db/index.ts` 中的 `deleteListing` 執行物理刪除且無內建 Audit Log，產生數據消失風險。 |
| **#5** | 變動前驗證 Schema | ❌ 違規 | `src/app/api/listings/route.ts` 缺乏 Zod 等強型別驗證，髒資料易滲入 JSON 欄位。 |
| **#7** | 變動需考慮 Audit | ❌ 違規 | `updateSupplementaryData` (補充資料更新) 完全缺乏 Audit Log，無法追蹤法律文件的修改軌跡。 |

---

## 2. 架構與安全性風險 (Architecture & Security)

### 2.1 身份驗證雙軌制混亂 (Auth Inconsistency)
*   **代碼位置：** `src/lib/auth.ts` vs `src/app/api/auth/[...nextauth]/route.ts`
*   **風險：** 系統同時維護 SQLite Session 與 Next-Auth JWT。API 路由對權限檢查的實現不一，增加漏洞風險。
*   **建議：** 應統一認證中心，避免開發者在 `getCurrentUser()` 與 `getServerSession()` 之間產生選擇錯誤。

### 2.2 非同步觸發認證失效 (Auth Trigger Failure)
*   **代碼位置：** `src/app/api/listings/[id]/attachments/route.ts` (L167)
*   **風險：** 上傳附件後使用 `void fetch(...)` 觸發 OCR 解析，但**未傳送認證憑證 (Session/Token)**。
*   **後果：** 在生產環境下，該觸發會因 401 Unauthorized 而失效，導致自動 OCR 功能斷裂。

---

## 3. 核心業務邏輯缺陷 (Business Logic & OCR)

### 3.1 OCR 正則表達式的「邊界潰縮」
*   **代碼位置：** `src/lib/ocr/parsers/land-parser.ts` (L54)
*   **問題：** 地號解析正則 `(\d{4,5}-\d{3,4})` 無法匹配無支號的老舊地段（如純四位地號 `1234`）。
*   **後果：** 關鍵法律資訊遺失，導致文件生成錯誤。

### 3.2 稅費計算的「魔術數字」硬編碼
*   **代碼位置：** `src/lib/document-generator/tax-calculator.ts`
*   **問題：** 契稅 6%、印花稅 0.05% 等數字直接寫死。
*   **風險：** 稅制政策變動時，必須重新編譯並發布整個桌面客戶端，無法動態調整。

---

## 4. 資料一致性與效能 (Data & Performance)

### 4.1 附件刪除的「非原子性」操作
*   **代碼位置：** `src/app/api/listings/[id]/attachments/route.ts` (L204+)
*   **問題：** 刪除附件與更新 `extracted_data` JSON 欄位不在同一個資料庫交易 (Transaction) 中。
*   **後果：** 可能產生「附件已刪但 OCR 數據殘留」的殭屍狀態，導致 PDF 生成引擎崩潰。

### 4.2 FTS5 虛擬表同步阻塞
*   **代碼位置：** `src/lib/db/schema.ts` (L140+)
*   **問題：** `listings` 表的大型 JSON 更新會頻繁觸發 FTS5 全文檢索重新索引。
*   **後果：** 當資料量大時，會產生明顯的 SQLite WAL 鎖定，造成前端響應延遲。

---

## 5. 建議修正路徑 (Action Plan)

1.  **[優先級：極高]** 修正 `attachments` 路由中的非同步 `fetch`，確保傳送認證 Header。
2.  **[優先級：高]** 重構 `src/lib/db/index.ts`，將 `writeAuditLog` 移入資料庫寫入層，實現自動稽核。
3.  **[優先級：高]** 引入 Zod Schema 對 API Input 進行全面體檢。
4.  **[優先級：中]** 將 OCR Parser 從純正則改為 Token-based 解析，處理地號邊界案例。
5.  **[優先級：中]** 將稅率常數外部化至配置文件。

---
報告人：Gemini CLI Agent
狀態：待處理 (Pending Review)
