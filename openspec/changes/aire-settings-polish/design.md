## Context

AIRE v0.1.0 sidebar 有 4 個平級項目（案件管理、品牌設定、日誌、設定），但品牌設定和日誌邏輯上是設定的子功能。日誌頁 5 筆固定 mock 資料。設定頁有未完成的 placeholder 區塊。

目前路由結構：
- `/cases` — 案件管理（sidebar 項目 1）
- `/settings/branding` — 品牌設定（sidebar 項目 2）
- `/settings/logs` — 日誌（sidebar 項目 3）
- `/settings` — 設定（sidebar 項目 4）

## Goals / Non-Goals

**Goals:**
- Sidebar 精簡為 2 個頂層項目
- 設定頁內用 tabs 切換子功能（一般設定 / 品牌設定 / 操作日誌）
- 日誌接真實操作紀錄
- 品牌主題增加到 5 個
- 設定頁 placeholder 統一處理

**Non-Goals:**
- 案件詳情/列表重設計（另一個 change）
- 真正的地政 API 連線測試
- 教學影片內容製作

## Decisions

### D1: Sidebar 精簡為兩層

Sidebar 只保留「案件管理」和「設定」。點「設定」進入 `/settings`，頁面內用 tabs 切換：

| Tab | 名稱 | 對應原路由 |
|-----|------|-----------|
| general | 一般設定 | `/settings` |
| branding | 品牌設定 | `/settings/branding` |
| logs | 操作日誌 | `/settings/logs` |

路由保持不變（`/settings`, `/settings/branding`, `/settings/logs`），sidebar 導航改為只顯示 `/settings`，tabs 在設定頁內切換子路由。

替代方案：
- 用 URL query params（`/settings?tab=branding`）→ 不利書籤和分享
- 全部塞同一頁（無子路由）→ 頁面太大

### D2: 日誌接真實操作紀錄

在 `mock-backend.ts` 新增 `operation_logs` 陣列和 `add_log(action, detail)` 方法。案件 CRUD（create/update/delete）、PDF 匯出等動作自動呼叫 `add_log`。日誌頁讀 `list_logs` 取得真實紀錄。

每筆 log 結構：`{ id, timestamp, action, detail, user_email }`

替代方案：
- 用 localStorage 存 → 跟 mock-backend 分離，不一致
- 完全不做，等 SQLite → 測試階段沒紀錄不利除錯

### D3: 品牌主題擴充

從 2 個增到 5 個：

| 主題 ID | 名稱 | 主色 | 風格 |
|---------|------|------|------|
| minimal | 淡雅 Minimal | #f5f5f5 | 現有 |
| tech-elegant | 科技優雅 Tech Elegant | #1a1a2e | 現有 |
| professional | 專業沉穩 Professional | #2c3e50 | 深藍灰，商務感 |
| fresh | 清新自然 Fresh | #27ae60 | 綠色系，自然風 |
| warm | 溫暖親切 Warm | #e67e22 | 橘色系，親和力 |

### D4: 「敬請期待」統一提示元件

建立 `ComingSoonCard` 元件，接收 `title` prop，渲染統一的灰色提示卡片（圖示 + 「敬請期待」文字）。用於申請說明區和教學影片區。

### D5: 測試連線 tooltip

disabled 的「測試連線」按鈕加 `title="請先填入 Client ID 和安全碼"` 屬性。當 Client ID 和安全碼都有值時按鈕啟用，移除 tooltip。

## Implementation Contract

### Sidebar 行為
- `layout.tsx` 的 sidebar 導航列表只渲染「案件管理」（icon: FileText, href: /cases）和「設定」（icon: Settings, href: /settings）
- 原有「品牌設定」和「日誌」sidebar 項目移除

### 設定頁 tabs 行為
- `/settings` 頁面頂部渲染 `SettingsTabs` 元件（3 個 tab）
- 點 tab 導航到對應子路由（`/settings`, `/settings/branding`, `/settings/logs`）
- 當前路由對應的 tab 顯示為 active 狀態

### 日誌行為
- `mock-backend.ts` 的 `create_case`、`update_case`、`delete_case`、PDF 匯出函式呼叫 `add_log`
- `/settings/logs` 頁面呼叫 `list_logs` 取得紀錄，按 timestamp DESC 排序顯示
- 每筆顯示：時間、操作類型、詳細說明

### 接受標準
- Sidebar 只有 2 個項目 → 點「設定」→ 看到 tabs → 切換 tab 功能正常
- 建立/修改/刪除案件後 → 日誌頁出現對應紀錄（非 mock）
- 品牌設定頁顯示 5 個主題卡片
- 設定頁「申請說明」和「教學影片」區顯示「敬請期待」卡片
- 「測試連線」按鈕 hover 顯示 tooltip

### 範圍界限
- **In scope**: sidebar、設定頁 tabs、日誌真實資料、品牌主題擴充、placeholder 處理、tooltip
- **Out of scope**: 案件相關頁面、PDF 模板、地政 API 連線邏輯

## Risks / Trade-offs

- [日誌在 mock-backend] 瀏覽器重整日誌清空 → 已知 dev 模式限制，正式版 SQLite 持久化
- [品牌主題色值] 目前只定義主色，完整色彩系統需要 design token → 先用主色 + 自動生成淺/深變體

## Migration Plan

無需遷移。路由結構不變，只改 sidebar 導航和頁面內 tabs。

## Open Questions

無
