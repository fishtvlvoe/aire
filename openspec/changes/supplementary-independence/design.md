## Context

目前建立物件流程中嵌有「補件資料」tab 和「前去補件」按鈕。補件是事後補充動作，不應與初次建立流程綁定。現有 `supplementary-form` 和 `supplementary-field-completeness` specs 定義了補件表單欄位和完成度計算，但入口依附於建立流程。

## Goals / Non-Goals

**Goals:**

- 從建立流程完全移除補件相關 UI（tab + 按鈕）
- 在列表頁新增補件狀態 icon 欄位，一眼識別缺件狀態
- 提供獨立補件入口（點 icon 或獨立路由）

**Non-Goals:**

- 不修改補件表單本身的欄位邏輯（只改入口）
- 不做補件進度百分比顯示（只用三態 icon）
- 不做缺件推播通知

## Decisions

### D1：三態 icon 定義

| 狀態 | icon | 條件 |
|------|------|------|
| 有缺件 | ⚠️ 橘色三角驚嘆 | 有必填欄位未填且物件已進入「進行中」以上狀態 |
| 補齊 | ✅ 綠色勾 | 所有必填補件欄位已填寫 |
| 未開始 | ── 灰色橫線 | 物件仍在「草稿」狀態，尚未進入補件階段 |

### D2：獨立路由

- 補件頁面路由：`/listings/[id]/supplement`
- 點擊列表 icon → 導航至此路由
- 補件完成後返回列表頁

### D3：移除範圍

- 移除 `src/app/listings/[id]/page.tsx` 中的補件 tab
- 移除「前去補件」按鈕
- 建立流程只保留基本資料 + 謄本資料

## Implementation Distribution Strategy

| 任務類型 | 代理 | 理由 |
|---------|------|------|
| 移除現有 UI + 新增 icon + 路由 | Copilot CLI | UI 元件修改 |
| 狀態計算邏輯 | Copilot CLI | 業務邏輯 |
| E2E 測試 | Sonnet 子代理 | 整合驗證 |

預估 Token：約 8K
