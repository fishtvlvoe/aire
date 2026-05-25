## Problem

Desktop 設定頁目前把個人資料、品牌 Logo/品牌色、登入密碼、PDF 密碼、未開放方案與預留功能放在同一組畫面。客戶會以為進階款、高級款、Google/空拍/AI 功能已可購買或使用，也會誤解登入密碼與 PDF 開啟密碼是同一件事。

## Root Cause

`/settings` 個人設定仍保留舊版品牌表單與「用於登入 AIRE 與開啟加密 PDF」文案；`/settings?section=plans` 直接渲染所有方案與開發中功能開關，沒有依目前可交付範圍收斂。

## Proposed Solution

- 個人設定只保留個人名稱、Email 與 PDF 開啟密碼。
- 品牌 Logo 與品牌色只由既有「品牌與交付資訊」頁負責，不在個人設定重複出現。
- PDF 開啟密碼文案明確說明與登入密碼分開，首次未設定時可直接建立。
- 方案頁只顯示目前可用的基本款、授權、試用與地政查詢帳號狀態。
- 隱藏進階款、高級款、前往升級按鈕與預留功能開關。

## Non-Goals

- 不實作 opcos.me 方案購買與升級。
- 不在此 change 實作 Desktop auth session bridge。
- 不移除既有品牌與交付資訊頁。

## Success Criteria

- `/settings` 不顯示品牌 Logo/品牌色表單。
- `/settings` 不再說登入密碼同時用於 PDF。
- `/settings?section=plans` 不顯示進階款、高級款、前往升級、預留功能或功能 switch。
- 單元測試與本機 smoke 均驗證上述畫面狀態。

## Impact

- Affected code:
  - Modified: src/app/(dashboard)/settings/page.tsx, src/app/(dashboard)/settings/__tests__/page.test.tsx, src/app/(dashboard)/settings/__tests__/settings-page.test.tsx
  - New: none
  - Removed: none
