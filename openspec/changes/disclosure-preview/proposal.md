## Why

目前不動產說明書的預覽流程是：Markdown 生成 → 套配色方案 → 轉 HTML 顯示。這個流程有兩個痛點：

1. **沒有客製化版型**：所有客戶共用同一套 HTML 模板，只能換配色和 Logo，無法呈現各仲介品牌的專屬設計（如建安不動產的粉金漸層風格）
2. **文字不能即時編輯**：預覽是唯讀的，業務想修改用詞必須回到編輯頁改欄位、重新生成、再預覽，來回切換浪費時間

客戶希望在 HTML 預覽頁面直接看到「自家品牌版型 + 物件資料」的完整效果，並且能像 Word 一樣直接點擊文字修改內容。

## What Changes

1. **版型背景上傳**：在文件樣式設定頁（src/app/admin/(dashboard)/templates/page.tsx）新增「版型背景圖」上傳區，客戶可上傳自訂背景圖（存到 R2），支援多頁版型（封面頁、內容頁）
2. **HTML 預覽渲染**：在不動產說明書功能（src/app/listings/[id]/documents/page.tsx）新增「預覽」按鈕，點擊後開啟全頁預覽，背景層顯示客戶版型圖片，欄位層以 CSS absolute positioning 疊加在背景上
3. **contentEditable 即時編輯**：預覽中的每個文字欄位都是 contentEditable 區塊，使用者可直接點擊修改文字內容
4. **儲存編輯結果**：編輯後的文字透過 API 存回資料庫，下次預覽或匯出 PDF 時使用修改後的內容
5. **欄位座標定義**：每個版型有對應的欄位位置設定（JSON），定義各欄位在背景圖上的 x, y, width, height、字體大小、對齊方式

## Non-Goals

- 不做拖拉式欄位位置編輯器（本期採固定座標，由管理員在設定中手動調整數值）
- 不做富文本編輯（粗體、斜體、字體切換等），僅支援純文字修改
- 不重構現有的 Markdown → HTML 生成流程，版型預覽是獨立的渲染路徑
- 不做版型設計工具，客戶自行用設計軟體製作背景圖後上傳

## Capabilities

### New Capabilities

- `disclosure-template-background`: 管理員可上傳、管理不動產說明書的版型背景圖（封面頁 + 內容頁），背景圖儲存於 R2，支援 PNG/JPG 格式，單張上限 5MB
- `disclosure-html-preview`: 在不動產說明書功能頁新增預覽按鈕，點擊後以全頁 HTML 渲染版型背景 + 物件欄位資料，欄位以 CSS absolute positioning 定位在背景圖上
- `disclosure-inline-edit`: 預覽頁面的文字欄位支援 contentEditable 即時編輯，編輯後自動儲存修改內容至資料庫
- `disclosure-field-layout`: 版型的欄位位置定義（JSON 格式），描述每個欄位在背景圖上的座標、尺寸、字體大小和對齊方式

### Modified Capabilities

- `document-generation-settings`（既有）: 文件樣式設定頁新增「版型背景圖管理」區塊，與現有配色方案和 Logo 並列

## Impact

- Affected specs: disclosure-template-background（新增）、disclosure-html-preview（新增）、disclosure-inline-edit（新增）、disclosure-field-layout（新增）、document-generation-settings（修改）
- Affected code:
  - New: src/app/listings/[id]/documents/preview/page.tsx, src/app/api/documents/disclosure-preview/route.ts, src/app/api/admin/templates/background/route.ts, src/app/api/documents/disclosure-preview/save/route.ts, src/lib/branding/field-layouts.ts, src/components/DisclosurePreview.tsx, src/components/DisclosureFieldOverlay.tsx
  - Modified: src/app/admin/(dashboard)/templates/page.tsx, src/app/listings/[id]/documents/page.tsx, src/lib/db/schema.ts, src/middleware.ts
  - Removed: (none)
