## ADDED Requirements

### Requirement: Neighborhood chapter integrates market research data

不動產說明書「周邊環境」章節 SHALL 引用物件的 `market_summary` 欄位內容與 `type: "market_research"` 的附件。

當 `market_summary` 為非空字串時，章節 SHALL 渲染該內容為「周邊行情摘要」段落；附件 SHALL 以圖片或 PDF 連結形式嵌入或附在章節末尾。當 `market_summary` 為空且無 `market_research` 附件時，章節 SHALL 顯示「待補」（與其他空欄位章節一致行為）。

系統 SHALL NOT 嘗試自動產生周邊行情內容，所有周邊行情資料僅來自業務人工填寫的 `market_summary` 與上傳的附件。

#### Scenario: Listing has market summary and attachments

- **WHEN** 系統為一個 `market_summary = "同社區近三月成交 3 件..."` 且有 2 張 `market_research` 附件的物件生成不動產說明書
- **THEN** 「周邊環境」章節 SHALL 渲染 market_summary 文字
- **AND** 章節末尾 SHALL 嵌入或連結 2 張附件

#### Scenario: Listing has neither market summary nor attachments

- **WHEN** 系統為一個 `market_summary = NULL` 且無 `market_research` 附件的物件生成不動產說明書
- **THEN** 「周邊環境」章節 SHALL 顯示「待補」
- **AND** PDF 預覽頁 SHALL 在預覽列表標示此章節為待補狀態

#### Scenario: Listing has only market summary, no attachments

- **WHEN** 系統為一個 `market_summary = "周邊成交價穩定"` 且無 `market_research` 附件的物件生成說明書
- **THEN** 章節 SHALL 渲染 market_summary 文字
- **AND** 章節 SHALL NOT 顯示「待補」（已有摘要即視為已填寫）

#### Scenario: System attempts auto-generation (negative case)

- **WHEN** 開發者試圖在 `neighborhood.ts` section generator 內加入 LLM prompt 自動產生周邊環境內容
- **THEN** Code Review SHALL 拒絕該變更
- **AND** spec 明確要求周邊環境章節僅引用人工填寫的資料，避免幻覺與法律風險
