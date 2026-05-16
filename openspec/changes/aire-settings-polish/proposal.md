## Summary

設定頁、sidebar、日誌、品牌設定的 UX 打磨與結構重整，解決第一輪測試發現的 6 項問題（I-008, I-009, I-017, I-018, I-019, I-020）。

## Motivation

AIRE v0.1.0 設定相關頁面有多項 placeholder 和結構問題：sidebar 把品牌設定/日誌跟設定平級顯示（邏輯上是子功能）、日誌頁全是 mock 資料、品牌設定只有 2 個主題、設定頁有未完成的「申請說明」和「教學影片」區塊、「測試連線」按鈕灰色卻沒說明原因。這些問題讓產品顯得半成品。

## Proposed Solution

1. **Sidebar 重構**：只保留「案件管理」和「設定」兩個頂層項目。品牌設定、日誌移入設定頁作為子頁籤（tabs）
2. **日誌接真實資料**：mock-backend 新增操作紀錄功能，案件 CRUD / 匯出等動作自動寫入日誌，日誌頁讀真實紀錄
3. **品牌設定增加主題**：從 2 個增加到至少 5 個主題選項（新增：專業沉穩 Professional、清新自然 Fresh、溫暖親切 Warm）
4. **設定頁 placeholder 處理**：「申請說明」和「教學影片即將上線」改為統一的「敬請期待」提示卡片
5. **測試連線 tooltip**：disabled 按鈕加 tooltip「請先填入 Client ID 和安全碼」

## Non-Goals

- 不實作忘記密碼功能
- 不處理案件詳情頁/列表（在 `aire-ux-wizard-refactor` change）
- 不實作真正的地政 API 連線測試邏輯（只修 tooltip UX）
- 不新增教學影片實際內容

## Impact

- Affected specs: `sidebar-navigation`（修改）、`settings-page`（修改）、`audit-log`（修改）、`settings-land-api-section`（修改）
- Affected code:
  - New: `src/components/SettingsTabs.tsx`, `src/components/ComingSoonCard.tsx`
  - Modified: `src/app/(dashboard)/layout.tsx`, `src/app/(dashboard)/settings/page.tsx`, `src/app/(dashboard)/settings/branding/page.tsx`, `src/app/(dashboard)/settings/logs/page.tsx`, `src/lib/mock-backend.ts`
  - Removed: `src/app/(dashboard)/brand/page.tsx`（若品牌設定是獨立路由，改為設定子頁後移除）, `src/app/(dashboard)/logs/page.tsx`（同理）
- Dependencies 新增: 無
- 環境變數新增: 無
