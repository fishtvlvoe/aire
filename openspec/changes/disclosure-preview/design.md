## Context

AIRE 系統目前的不動產說明書生成流程是：LLM 生成 Markdown → 套用配色方案 → 轉 HTML 預覽或 Puppeteer 匯出 PDF。預覽使用統一的 HTML 模板，所有客戶共用同一版型。

客戶（如建安不動產）有自己的品牌設計版型（粉金漸層背景、品牌 Logo、企業標語等），希望在系統內直接預覽「品牌版型 + 物件資料」的完整效果，並能即時編輯文字。

現有基礎設施：R2 圖片儲存（已用於 Logo）、feature_flags 表（配色方案、Logo 路徑）、templates 表（預留但尚未啟用）、Puppeteer PDF 匯出。

## Goals / Non-Goals

**Goals:**

- 客戶上傳版型背景圖後，預覽頁能正確渲染「背景 + 欄位文字」
- 預覽中的文字欄位可即時編輯並儲存
- 欄位位置定義為 JSON 設定，管理員可調整數值
- 與現有配色方案、Logo 功能共存，不破壞既有預覽流程

**Non-Goals:**

- 不做拖拉式欄位編輯器
- 不做富文本（粗體、斜體等），僅純文字
- 不重構 Markdown → HTML 的既有流程

## Decisions

### D1: 版型背景圖儲存

背景圖上傳至 R2，路徑格式 `branding/backgrounds/{cover|content}.{ext}`。支援 PNG 和 JPG，單張上限 5MB。DB 用 feature_flags 表新增兩個 key：`doc_bg_cover`（封面頁背景路徑）和 `doc_bg_content`（內容頁背景路徑），值為 R2 公開 URL。

理由：複用現有 R2 + feature_flags 架構，不需新增表。

### D2: 欄位位置定義格式

在 src/lib/branding/field-layouts.ts 定義欄位座標 JSON：

```typescript
interface FieldPosition {
  fieldKey: string;        // 對應 listing 資料的欄位名稱
  label: string;           // 顯示用標籤（如「物件編號」）
  x: number;               // 左邊距（百分比，0-100）
  y: number;               // 上邊距（百分比，0-100）
  width: number;           // 寬度（百分比）
  height: number;          // 高度（百分比）
  fontSize: number;        // 字體大小（px）
  textAlign: 'left' | 'center' | 'right';
  page: 'cover' | 'content';  // 屬於封面頁或內容頁
}
```

使用百分比定位而非絕對像素，確保不同螢幕解析度下位置一致。預設的欄位清單基於不動產說明書(一) 封面：物件編號、物件名稱、委託人、店名、經紀人、經紀人證書、店名（底部）、公司名稱、地址、電話、日期。

理由：百分比定位讓版型在不同裝置上等比縮放，JSON 格式方便未來擴展為 DB 儲存。

### D3: 預覽頁面架構

預覽頁面為獨立 route：src/app/listings/[id]/documents/preview/page.tsx。頁面結構：

```
<PreviewContainer>           // 全頁容器，白色背景
  <PreviewPage page="cover"> // 封面頁（A4 比例容器）
    <BackgroundLayer />      // 背景圖 <img>，width: 100%
    <FieldOverlay>           // 欄位層，absolute positioning
      <EditableField />      // 每個 contentEditable 欄位
      ...
    </FieldOverlay>
  </PreviewPage>
  <PreviewPage page="content"> // 內容頁
    ...同結構
  </PreviewPage>
  <Toolbar>                  // 底部工具列
    <SaveButton />           // 儲存修改
    <BackButton />           // 返回文件列表
  </Toolbar>
</PreviewContainer>
```

A4 比例容器寬度固定為 794px（A4 at 96dpi），高度 1123px，用 transform: scale() 做響應式縮放。

理由：固定 A4 尺寸確保列印和 PDF 匯出時版型不變形。

### D4: contentEditable 即時編輯

每個 EditableField 是一個 div，屬性 contentEditable="true"。使用者點擊即可編輯。onBlur 時觸發自動儲存，呼叫 PATCH /api/documents/disclosure-preview/save，將修改後的欄位值寫回 listings.generated_documents JSON。

不使用 input/textarea 的原因：contentEditable 的文字可以自然換行、字體與背景融合，視覺效果更接近實際文件。

防止 XSS：儲存前用 DOMPurify 或手動 strip HTML tags，只保留純文字。

### D5: 資料流

```
物件資料（listings 表）
  ↓ GET /api/documents/disclosure-preview?listingId=xxx
  ↓ 讀取 listing 欄位 + generated_documents + feature_flags（背景圖 URL）
  ↓ 組合成 { fields: [...], backgrounds: { cover: url, content: url } }
  ↓
預覽頁面渲染
  ↓ 使用者編輯文字
  ↓ onBlur 觸發
  ↓ PATCH /api/documents/disclosure-preview/save
  ↓ body: { listingId, fieldKey, value }
  ↓ 更新 listings.generated_documents JSON 中對應欄位
  ↓
下次預覽或 PDF 匯出時使用更新後的值
```

### D6: 管理員版型設定 UI

在既有的 src/app/admin/(dashboard)/templates/page.tsx 頁面新增「版型背景圖」區塊，位於配色方案和 Logo 之後。包含：
- 封面頁背景圖上傳（預覽縮圖 + 上傳/刪除按鈕）
- 內容頁背景圖上傳（同上）
- 上傳 API：POST /api/admin/templates/background，接收 multipart/form-data，欄位 page=cover|content
- 刪除 API：DELETE /api/admin/templates/background?page=cover|content

複用現有 Logo 上傳的 UI pattern（LogoUploader 元件的設計風格）。
