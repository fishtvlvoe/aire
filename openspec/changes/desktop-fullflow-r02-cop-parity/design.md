## Context

AIRE 的資料能力已經往地址優先、R02 候選、COP 查詢、費用紀錄與補件物調前進，但目前 UI 將技術流程直接暴露給客戶。客戶不需要理解 R02、便民系統、COP、API、Helper 或 JSON；他只需要知道地址輸入後，哪些地段、地號、建號需要確認，確認後系統可以產出物調、補件、預覽與 PDF。

這次以 DP 降噪原則作為 UI 決策基準：前台只保留客戶做決策需要的資訊，底層來源、解析、API、錯誤原文與 JSON 留在紀錄與除錯層。

## Goals / Non-Goals

**Goals:**

- Desktop App 成為本期主要交付，macOS 與 Windows 均需可打包與驗收。
- `新增案件` 成為地址查詢與資料確認唯一入口。
- `查詢紀錄` 從操作頁降級為管理與追溯頁。
- `系統設定` 承接授權、方案、試用到期與客戶 COP 憑證狀態。
- 前台客戶流程不顯示技術詞，降低認知負荷。
- 正式地政查詢前必須確認地段、地號與建號；重複查詢使用快取省費。

**Non-Goals:**

- 不讓 SaaS 在本期承擔完整地政查詢與 PDF 交付。
- 不移除後台/除錯所需 JSON、錯誤碼與 API 細節。
- 不改變客戶 COP 憑證歸屬：正式查詢仍由客戶自己的權限負擔。

## Decisions

### Decision: New case is the only customer-facing lookup entry

客戶只從 `新增案件` 輸入地址。地址補齊與候選來源在後台執行，UI 只顯示地段、地號、建號、資料確認與下一步按鈕。

Alternatives Considered:

- 在 `查詢紀錄` 提供 R02 Helper 表單：會讓管理頁變成操作頁，也暴露不必要技術概念。
- 讓使用者自己去 R02 查完再貼回：操作門檻高，且客戶會誤以為 R02 是產品主流程。

### Decision: Query records are for audit only

`查詢紀錄` 只顯示歷史查詢、費用、錯誤、快取與明細，不提供地址/R02 輸入表單。它服務管理者與客服追溯，不是客戶每天新增案件的入口。

Alternatives Considered:

- 查詢紀錄同時承擔查詢與除錯：單頁功能混雜，造成認知負荷與操作分歧。

### Decision: System settings owns entitlement and authorization

方案、試用到期、授權狀態與客戶 COP 憑證狀態都歸到 `系統設定`。這些是帳號與權限問題，不應出現在查詢紀錄頁。

### Decision: Technical language is hidden from customer workflow

客戶操作頁禁止顯示以下詞彙：R02、便民系統、COP、API、Helper、adapter、parser、payload、JSON。需要顯示時改用任務語言，例如 `地址資料補齊`、`資料確認`、`查詢紀錄`、`授權尚未完成`。

### Decision: Desktop packaging is part of acceptance

本期完成不只看瀏覽器 mock，也要驗證 Desktop App build。macOS 與 Windows 的可啟動、可操作、可產出流程都必須留下測試報告。

## Implementation Contract

- `新增案件` 顯示地址輸入，並在同頁顯示地段、地號、建號確認欄位。
- 地址補齊成功時，前台顯示 `已自動補齊，請確認資料`；多候選時顯示 `請選擇正確資料`；失敗時顯示 `需要人工補填資料`。
- 正式查詢按鈕只有在必要資料確認後可用。
- `查詢紀錄` 不顯示 SaaS 試用狀態、不顯示 R02 Helper、不顯示地址輸入表單。
- `系統設定` 顯示方案/試用/授權狀態與客戶 COP 憑證狀態。
- 前台 customer-facing routes 的文字掃描不得命中禁用技術詞。
- 查詢 run 仍保存 candidate JSON、正式查詢 JSON、費用、錯誤與 cache metadata，但 JSON 明細只在管理/除錯 UI 展開。

## Risks / Trade-offs

- [Risk] 技術資訊藏太深，客服 debug 不便 → Mitigation: 查詢紀錄 detail 保留錯誤碼、JSON 與 API rows，但預設收合。
- [Risk] Desktop 與 SaaS 體驗短期不一致 → Mitigation: 本期明確標示 Desktop 為完整交付，SaaS 只作入口與授權。
- [Risk] R02 候選流程仍需人工貼回或桌面 helper → Mitigation: 前台用 `地址資料補齊` 包裝，不把來源名稱交給客戶理解。

## Rollback Plan

若新增案件流程不穩，保留舊查詢紀錄 detail 與既有 backend commands，但隱藏新正式查詢入口，讓使用者回到人工輸入地段、地號、建號後再正式查詢。
