# AIRE UI/UX Demo Reference

這個資料夾放「昨天討論用的 UI/UX demo 與截圖」，目的是讓產品實作可以直接對照，不再散落在 `mockups/`、`playwright-results/` 或對話裡。

## 直接打開

- `registry-autofill-workbench.html`：主要工作台 demo。這是目前要對齊的 UI/UX 參考。
- `registry-autofill-settings.html`：系統設定 demo。升級功能、資料邊界、費用歸屬、PDF 圖資位置應該放在這類設定頁，不要常駐在案件工作台。

## 截圖

- `screenshots/registry-autofill-workbench-1440.png`：主要工作台桌面版。
- `screenshots/registry-autofill-workbench-768.png`：主要工作台窄版。
- `screenshots/registry-autofill-settings-1440.png`：設定頁 demo。
- `screenshots/old-dom-ux-sdd-workbench-1440.png`：較早的 DOM/UX SDD 截圖，僅供追溯，不是目前主要目標。
- `screenshots/old-house-mvp-workbench-1440.png`：較早的 House MVP 工作台截圖，僅供追溯，不是目前主要目標。

## 對齊重點

- 主案件流程要對齊 `registry-autofill-workbench.html`，不是現在舊版五步 wizard。
- 左側一級選單要有 OPCOS 風格的資料夾/子選單與收合控制。
- 工作台主畫面只放工作任務，不放升級開關、資料邊界說明、費用規則這些低頻設定。
- 新增案件要地址優先，由地政判斷土地/建物；只有查不到或多候選時才人工選。
- 客戶畫面不得顯示 `MOI_API_*`、`COP309`、backend enum、`BASIC`、`pro`、`advanced` 等工程或英文方案字。
- 升級功能、費用歸屬、API 稽核、PDF 圖資位置放在設定/後台/稽核頁。

