# OPCOS 法規條文同步規格

> 規範 OPCOS 雲端（Twinkle Hub）整理與發布不動產法規 dataset 的格式，以及 AIRE 桌面 App 同步消費此 dataset 的契約。
> 本文件供 Fish 整理 Twinkle Hub 端的法規資料時依循；AIRE 端的同步邏輯與 UI 已於 `docs/ux-patterns.md`「法規告知 + 證號驗證 v1」章節描述。

## 一、OPCOS 法規 dataset 整理規範

### 1.1 資料來源

| 法規 | 主管機關 | 官方來源 URL |
| --- | --- | --- |
| 不動產經紀業管理條例 | 內政部地政司 | https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=D0060091 |
| 不動產經紀業申報資料申報內容項目 | 內政部 | https://law.moj.gov.tw/ （以最新公告為準） |
| 不動產說明書應記載事項 | 內政部 | https://law.moj.gov.tw/ （以最新公告為準） |

### 1.2 整理流程

1. **抓取原文**：自官方來源複製完整條文（含章節編號），不擷取片段。
2. **轉 Markdown**：使用 `#` 表示章、`##` 表示節、`###` 表示條，內文保留條號（如 `第 1 條`）。
3. **版本標記**：每次更新需記錄 `version_date`（最近一次修正日期）、`effective_date`（生效日）兩個欄位，採 ISO 8601 格式（`YYYY-MM-DD`）。
4. **雙年制顯示**：AIRE 端顯示版本日期需民國年 + 西元並列（見 ux-patterns.md (c)），但 dataset 儲存只用西元。
5. **節錄原則**：條例全文照搬，不做摘要、不改述。註解可加在 `notes` 欄位。
6. **存放位置**：Twinkle Hub 倉庫 `data/legal-clauses/<law_id>.json`，依下方 schema 序列化。
7. **發布方式**：commit 至 Twinkle Hub `main` 分支即視為發布；AIRE 透過 `OPCOS_LEGAL_CLAUSES_ENDPOINT` 拉取 JSON。

### 1.3 更新節奏

- 主管機關修法 → 1 個工作日內更新 dataset。
- 每季（3、6、9、12 月）巡查一次官方公告，確認 dataset 與官方一致。
- 每次更新 dataset → bump `version_date`，AIRE 端會偵測差異並提示重新匯出。

### 1.4 品質檢查 checklist

- [ ] `law_id` 與下方清單一致
- [ ] `version_date` 與官方公告修正日相符
- [ ] `content_markdown` 與官方條文逐字比對無誤
- [ ] `source_url` 可開啟並顯示同一版本內容
- [ ] 三個法規均已更新（不可只更新其中一個）

## 二、AIRE 期望的 JSON Schema

AIRE 透過 `OPCOS_LEGAL_CLAUSES_ENDPOINT` 取得單一法規或全部法規清單。Endpoint 回應格式 **必須** 符合以下 schema。

### 2.1 單筆法規物件

```json
{
  "law_id": "real_estate_brokerage_act",
  "title": "不動產經紀業管理條例",
  "content_markdown": "# 第一章 總則\n\n## 第 1 條\n為管理不動產經紀業...\n\n## 第 2 條\n...",
  "version_date": "2024-03-15",
  "effective_date": "2024-04-01",
  "source_url": "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=D0060091",
  "issuing_authority": "內政部地政司",
  "notes": "本次修正新增第 X 條"
}
```

### 2.2 欄位定義

| 欄位 | 型別 | 必填 | 說明 |
| --- | --- | --- | --- |
| `law_id` | string (snake_case) | ✓ | 全域唯一識別碼，見「三、law_id 清單」 |
| `title` | string | ✓ | 中文法規全名 |
| `content_markdown` | string | ✓ | Markdown 格式條文內容（UTF-8、保留章節結構） |
| `version_date` | string (ISO 8601) | ✓ | 最近一次修正日期 |
| `effective_date` | string (ISO 8601) | ✓ | 生效日；若與 `version_date` 相同則重複填寫 |
| `source_url` | string (URL) | ✓ | 官方來源連結 |
| `issuing_authority` | string | ✓ | 主管機關全名 |
| `notes` | string | ✗ | 整理備註，不會顯示於 PDF |

### 2.3 列表 endpoint 回應

```json
{
  "version": "2024-03-15",
  "items": [
    { "law_id": "...", "title": "...", "version_date": "...", "source_url": "..." }
  ]
}
```

- `version`：取所有 items 中最大的 `version_date`，AIRE 用此值判斷是否需要重新拉取單筆內容。
- `items`：摘要清單，不含 `content_markdown`（節省頻寬）。

### 2.4 容錯約定

- AIRE 端會將最後一次成功拉取的回應快取至本機 SQLite。
- 連線失敗 → 使用本機快取，並於 UI 顯示「離線中（cached_at <date>）」（見 ux-patterns.md (b)）。
- 回應 schema 不符 → 視為失敗，回退至上一份成功快取，並寫入錯誤日誌。

## 三、三條法規 law_id 清單

AIRE Phase 1 同步以下三條法規，`law_id` 為固定字串，OPCOS 端不得擅自更名（否則 AIRE 會視為新法規而非更新）。

| law_id | title | 備註 |
| --- | --- | --- |
| `real_estate_brokerage_act` | 不動產經紀業管理條例 | 母法 |
| `real_estate_brokerage_filing_items` | 不動產經紀業申報資料申報內容項目 | 子法（申報項目） |
| `real_estate_disclosure_required_items` | 不動產說明書應記載事項 | 子法（說明書記載事項） |

未來新增法規（如預售屋買賣定型化契約應記載事項）需於本文件追加 `law_id`，並通知 AIRE 端同步更新 schema 驗證清單。
