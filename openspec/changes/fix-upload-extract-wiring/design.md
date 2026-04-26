## Context

PhotoUploadClassifier 是「照片/文件」tab 的上傳元件，目前只把選檔結果存入表單 state（`form.photos`），從未發出任何 HTTP 請求。attachments API 的 `ALLOWED_TYPES` 也只有 `market_research` 和 `field_visit`，不接受謄本等文件類型。導致整條 upload → extract → autofill 流程只在模擬環境下通過，真實 UI 操作完全斷路。

## Goals

1. attachments API 接受謄本/權狀/合約/地籍圖等 OCR 文件類型
2. PhotoUploadClassifier 選檔後立即 POST 上傳到 server（fire-and-forget）
3. FieldVisitForm 把 `listingId` 往下傳給 PhotoUploadClassifier

## Non-Goals

- 不改 extract 路由的觸發機制（現有的 fire-and-forget 邏輯不動）
- 不改 LLM Vision / OCR pipeline 本身
- 不改上傳 UI 視覺

## Design

### 1. attachments API — 擴充 ALLOWED_TYPES

**檔案**：`src/app/api/listings/[id]/attachments/route.ts`

```typescript
const ALLOWED_TYPES = [
  'market_research',
  'field_visit',
  'transcript',
  'title-deed',
  'contract',
  'cadastral-map',
];
```

無其他邏輯更動。

### 2. PhotoUploadClassifier — 加 listingId + 上傳邏輯

**檔案**：`src/components/PhotoUploadClassifier.tsx`

新增 prop：
```typescript
interface Props {
  listingId?: number;   // 新增
  // ...現有 props
}
```

在 `onClassified`（或等效的 onChange handler）觸發後，若 `listingId` 存在，立即發出：

```typescript
const uploadFile = async (file: File, category: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', category);   // attachments API 欄位名稱
  await fetch(`/api/listings/${listingId}/attachments`, {
    method: 'POST',
    body: formData,
  }).catch(console.error);  // fire-and-forget，不 block UI
};
```

`category` 由 `PhotoUploadClassifier` 現有的分類邏輯決定（pdf → `transcript`，圖片 → `market_research`）。若分類結果不在 ALLOWED_TYPES 內，預設為 `transcript`。

### 3. FieldVisitForm — 傳入 listingId

**檔案**：`src/components/forms/FieldVisitForm.tsx`

從 props 或 context 取得 `listingId`，傳給 `<PhotoUploadClassifier listingId={listingId} />`。

`listingId` 來源：FieldVisitForm 已從 URL params 或父元件接收，直接穿透即可。

## Error Handling

- 上傳失敗（網路錯誤、4xx/5xx）：`console.error` 記錄，不阻斷 UI 流程
- `listingId` 為 undefined（例如草稿未儲存）：跳過上傳，行為與現在相同
- 分類未知文件類型：fallback 至 `transcript`

## Sequence

```
用戶選檔
  → PhotoUploadClassifier.onChange
  → [if listingId] fetch POST /api/listings/{id}/attachments
  → server 觸發 extract（現有邏輯）
  → useExtractStatus 輪詢（現有邏輯）
  → 欄位自動帶入（現有邏輯）
```
