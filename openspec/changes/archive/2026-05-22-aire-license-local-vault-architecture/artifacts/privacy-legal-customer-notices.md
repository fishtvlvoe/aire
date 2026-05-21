# Privacy / Legal Customer Notices

日期：2026-05-20

目的：整理 AIRE local-vault 架構的對外說明草稿。這不是正式法律意見，付費上線前仍需律師審查。

## Local-vault Whitepaper Outline

### 1. AIRE 的角色

AIRE 是不動產說明書製作工具與授權軟體。

- AIRE Cloud 管理帳號、授權、付款、裝置綁定與更新。
- AIRE App 在客戶自己的電腦上處理案件資料。
- 不動產案件資料、謄本、照片、調查內容與 PDF 輸出留在客戶本機。

### 2. 資料處理邊界

雲端只知道：

- Email / 帳號
- 使用者姓名
- 密碼雜湊或 auth provider ID
- 授權序號 / license ID
- 綁定裝置 ID
- 訂閱方案
- 最低必要使用紀錄

雲端不知道：

- 客戶查詢哪個地址
- 客戶查詢哪個地段、地號、建號
- 所有權人或共有人姓名
- 謄本內容
- 現場調查答案
- 上傳照片
- 產出的不動產說明書 PDF

### 3. 本機儲存

案件資料保存在客戶自己的電腦。

- 授權金鑰使用 OS Keychain / Windows Credential Manager 類型的系統憑證儲存。
- 案件資料使用本機 SQLite / local vault。
- 上線版需確認正式 App 啟動路徑使用加密 DB。

### 4. 離線與網路

AIRE 不能完全離線使用，因為地政 API、地圖、實價登錄等資料查詢需要網路。

但授權可有短期離線寬限：

- 最近 7 天內驗證成功：可進入主流程。
- 7 到 30 天：可進入但提示重新驗證。
- 超過 30 天：需重新驗證。

### 5. 備份責任

因 AIRE 不上傳客戶案件資料，AIRE Cloud 不會保存可還原的案件備份。

因此：

- 客戶電腦損壞、硬碟故障、誤刪資料，可能導致案件資料遺失。
- 客戶需自行安排本機備份。
- AIRE 可提供匯出/匯入或本機備份工具，但不承諾雲端代管備份。

## Customer-facing Website Statement

建議放在 `aire.opcos.me`：

> AIRE 採本機優先架構。您下載並啟用 AIRE 後，不動產案件資料會在您的電腦上處理與保存。AIRE Cloud 只負責帳號、授權、方案與更新，不會上傳或保存您的地址、地號、所有權人、謄本、照片或產出的不動產說明書 PDF。

短版：

> 您的不動產案件資料只存在您的電腦中；AIRE Cloud 不會保存案件內容。

## First-use Acknowledgment Draft

首次啟用或第一次建立案件時顯示：

```text
我了解並同意：

1. AIRE 是本機運作的不動產說明書工具。
2. 我的案件資料、謄本、照片與輸出 PDF 會保存在本機電腦。
3. AIRE Cloud 僅保存帳號、授權、方案、裝置綁定與必要使用紀錄。
4. AIRE Cloud 不會保存我的案件內容，也無法替我還原未備份的案件資料。
5. 若因電腦損壞、重灌、硬碟故障或誤刪導致資料遺失，需由我自行負責備份與復原。
```

## No-backup Responsibility Notice

建議放在網站 FAQ、首次啟用與設定頁：

> 為保護客戶與屋主資料隱私，AIRE 不會把不動產案件內容上傳到 AIRE Cloud，也不會代為保存案件備份。若您的電腦或儲存裝置損壞，且沒有自行備份，案件資料可能無法復原。請定期備份您的本機資料。

## Data Retention Matrix

| 類別 | 範例 | 儲存位置 | 保存期間 | 備註 |
| --- | --- | --- | --- | --- |
| 帳號資料 | Email、使用者姓名 | AIRE Cloud | 帳號有效期間及法定必要期間 | 密碼不得明文保存 |
| 密碼資料 | 密碼雜湊 / auth provider id | AIRE Cloud | 帳號有效期間 | 需使用安全 hash / auth provider |
| 授權資料 | license ID、serial、status | AIRE Cloud | 授權有效期間及必要稽核期間 | 不含案件內容 |
| 裝置資料 | device ID、seat ID | AIRE Cloud + 本機 | 授權有效期間 | 用於一機一授權 |
| 方案資料 | Basic / Pro / Advanced | AIRE Cloud + 本機 cache | 訂閱有效期間 | 用於功能開關 |
| 最小使用紀錄 | license check、feature count | AIRE Cloud 或本機 | 最短可行期間 | 不含地址、地號、PDF |
| 本機案件資料 | 地址、地號、謄本、照片、PDF | 客戶電腦 | 客戶自行決定 | AIRE Cloud 不保存 |
| 本機操作紀錄 | case create、pdf export | 客戶電腦 | 客戶自行決定 | 雲端不得上傳案件內容 |

## Legal Review Required

付費上線前需律師審查：

1. 台灣個資法告知義務。
2. AIRE Cloud 是否構成個資處理者或僅授權服務提供者。
3. 「不上傳案件資料」的技術與契約描述。
4. 客戶自行備份責任是否足夠明確。
5. IP / device binding / license transfer 條款。
6. 密碼、第三方 auth provider、付款資料的責任界線。
7. 地政 API、實價登錄、地圖圖資的資料來源與使用限制揭露。
