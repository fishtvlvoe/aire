# AIRE UX 互動模式手冊

> 對齊 opcOS 平台的 UX 互動規範。
> 適用範圍：AIRE 桌面 App（Tauri + Next.js）的所有 UI 互動行為。
> 文件供 OPCOS 雲端網頁與 AIRE 桌面 App 共同參考，未來新 App 也依此規範。

## 一、三態 UI（loading / empty / error）

所有非同步資料載入的畫面 **必須** 明確呈現三種狀態，禁止讓使用者看到空白螢幕。

### 模板對照

| 頁面 | Loading | Empty | Error |
| --- | --- | --- | --- |
| 案件列表 `/cases` | 置中 spinner + 「載入案件中」 | 卡片 + 「尚無案件，按右上角『新增案件』開始」 + 主要 CTA | 紅色卡片 + 錯誤原因 + 「重試」按鈕 |
| 案件詳情 `/cases/[id]` | Skeleton（5 條灰色 block） | n/a（表單一律渲染） | 紅色 banner「儲存失敗，已保留輸入」（暫時性） |
| 啟用畫面 `/activation` | inline spinner 在啟用按鈕內 | n/a | 啟用畫面下方紅色文字提示具體原因 |
| 匯出 PDF | toast「匯出中...」 | n/a | toast「匯出失敗：<原因>」 |

### Loading State 元件規格

```tsx
<LoadingState label="載入案件中" />
// 高 200px、寬 100%、置中 spinner + 標籤
```

### Empty State 元件規格

```tsx
<EmptyState
  title="尚無案件"
  description="按右上角「新增案件」開始"
  action={<Button>新增案件</Button>}
/>
// 卡片樣式、padding 48px、置中、可選 action
```

### Error State 元件規格

```tsx
<ErrorState
  reason="無法連線本機資料庫"
  onRetry={refetch}
/>
// 紅色邊框卡片、padding 24px、「重試」按鈕在右下
```

## 二、草稿自動儲存

所有多欄位表單（成屋說明書、土地說明書）**必須** 用 debounce 自動儲存策略，避免使用者輸入到一半失去資料。

### 規則

- Debounce：1000 毫秒
- 觸發：表單欄位有任何改動 → 1 秒後呼叫 IPC `save_draft`
- 強制 flush：視窗關閉前（Tauri `onCloseRequested` 事件）
- 視覺指示器：右上角顯示三種狀態：
  - 成功：`已儲存 14:35:22`（Asia/Taipei 時區，秒數）
  - 處理中：`儲存中`
  - 失敗：`儲存失敗，已保留輸入`（紅色）

### 失敗處理

- 表單 in-memory state 保留不清空
- 下一個 debounce 週期自動重試
- 不阻擋使用者繼續輸入（不彈 modal）

## 三、確認對話框（Modal）觸發政策

只有以下情境 **才** 跳 modal：

| 情境 | 是否跳 modal | 理由 |
| --- | --- | --- |
| 儲存欄位 | ✗ | 可逆、不破壞性 |
| 標示案件為完成（`draft` → `completed`） | ✗ | 可逆（編輯可回 draft） |
| **刪除案件** | ✓ | 不可逆、會 cascade 刪 disclosure_drafts |
| **解綁本裝置授權** | ✓ | 影響網路端狀態、不可逆 |
| 匯出 PDF | ✗ | 不破壞性 |
| 切換表單 tab | ✗ | 保留 state |

### Modal 元件規格

```tsx
<ConfirmDialog
  title="刪除此案件？"
  description="案件資料與草稿將永久刪除，無法復原。"
  destructive
  confirmLabel="確定刪除"
  cancelLabel="取消"
  onConfirm={handleDelete}
/>
```

- 預設焦點：`取消` 按鈕（避免誤觸 Enter）
- Esc 鍵：等同 cancel
- `destructive` 旗標 → 確認按鈕變紅色

## 四、錯誤訊息文案模板

**禁止** 暴露給使用者：stack trace、英文錯誤碼、JSON dump、HTTP status code 數字。

### 模板對照

| 失敗類別 | 模板 | 範例 |
| --- | --- | --- |
| 網路斷線 | `無法連線 <服務>，請檢查網路` | `無法連線 opcOS，請檢查網路` |
| 權限不足 | `<操作>需要 <角色>權限` | `修改設定需要老闆權限` |
| 欄位驗證 | `<欄位名>：<原因>` | `地號：為必填` |
| 儲存失敗 | `儲存失敗：<原因>，已保留輸入` | `儲存失敗：磁碟空間不足，已保留輸入` |
| 遠端拒絕 | `<服務>回應：<reason>` | `opcOS 回應：序號已綁定其他電腦` |

## 五、Toast / Banner / Modal 政策

| 訊息類型 | 使用 | 自動消失 | 範例 |
| --- | --- | --- | --- |
| 成功提示 | Toast（右下，綠） | ✓ 3 秒 | 「匯出成功」 |
| 警告提示 | Toast（右下，黃） | ✓ 5 秒 | 「網路暫時不穩，已重試」 |
| 自動儲存 | 右上角 indicator | n/a | 「已儲存 14:35:22」 |
| 嚴重錯誤（授權撤銷） | 跳轉啟用畫面 + inline banner | ✗ 需手動操作 | 啟用畫面紅色說明文字 |
| 確認危險動作 | Modal | ✗ 需點按鈕 | 「刪除此案件？」 |

**禁止**：用 toast 顯示嚴重錯誤（會自動消失，使用者可能錯過）。

## 六、鍵盤快捷鍵約定

對齊 opcOS 平台慣例。macOS 用 Cmd、Windows 用 Ctrl（自動偵測平台）。

| 快捷鍵 | 行為 | 可用頁面 |
| --- | --- | --- |
| `Cmd/Ctrl + N` | 新增案件 | `/cases`、`/cases/[id]` |
| `Cmd/Ctrl + S` | 強制 flush 草稿自動儲存 | `/cases/[id]` |
| `Cmd/Ctrl + ,` | 開啟設定 | 全域 |
| `Esc` | 關閉 modal / 取消 | 當 modal 開啟時 |
| `Cmd/Ctrl + K` | 開啟命令面板（Phase 1 stub） | 全域 |

### 實作位置

`src/lib/keyboard-shortcuts.ts` 用 `useEffect` + `keydown` 全域監聽。

## 七、與 opcOS 雲端網頁的同步

本文件規範 AIRE 桌面 App 的 UX，但 opcOS 雲端網頁（管理後台、客戶 portal）**應該** 遵守同一份規則。差異點：

- **桌面 App 限定**：視窗關閉前強制 flush（Tauri `onCloseRequested`）、IP 鎖定相關錯誤
- **雲端網頁限定**：多人即時行為（不適用桌面 App）、響應式 breakpoint

未來 opcOS Design System 公開化後，這份文件會抽到 `design-system/docs/ux-patterns.md` 共用。

## 八、驗收 checklist 對應

驗收時依本文件規則檢查每個畫面，項目見 `docs/ux-acceptance-checklist.md`。

## 法規告知 + 證號驗證 v1

> 適用：成屋說明書 / 土地說明書 / 預售屋說明書共用的「法規告知頁」與「不動產經紀人證號驗證」流程。
> 與 OPCOS 雲端同步法規 dataset 與經紀人證號驗簽，本節定義 UI / 文案規範。

### (a) 證號驗證五態 UI

證號驗證以「即時 + 快取」雙模式運行；UI 狀態以下表為單一事實來源。所有狀態 **必須** 同時包含 icon、顏色、文案三要素，不得只用顏色傳達含義（無障礙）。

| 狀態 | Icon（lucide-react） | 顏色 token | 文案 | 補充行為 |
| --- | --- | --- | --- | --- |
| 已驗證 | `BadgeCheck` | `--color-success` (#16a34a) | `已驗證：<姓名>（證號 <license_id>），<發證機關> <issue_date>` | 顯示綁定的經紀公司名稱（若有） |
| 證號不存在 | `BadgeX` | `--color-danger` (#dc2626) | `查無此證號，請確認輸入是否正確或聯絡 opcOS 客服` | 阻擋繼續匯出 PDF（disabled 主按鈕） |
| 過期 | `BadgeAlert` | `--color-warning` (#f59e0b) | `證號已過期（有效期至 <expiry_date>），請至內政部更新` | 不阻擋匯出，但於 PDF 頁尾加紅字註記 |
| 離線（無法連線雲端） | `WifiOff` | `--color-neutral` (#6b7280) | `離線中，目前顯示本機快取（<cached_at>），連線後將自動重新驗證` | 顯示 `重新驗證` 按鈕 |
| 驗證逾時 | `Clock` | `--color-warning` (#f59e0b) | `驗證逾時（>5 秒），請稍後再試或檢查 opcOS 服務狀態` | 顯示 `重試` 按鈕；逾時門檻 5000ms |

實作元件：

```tsx
<LicenseVerificationBadge
  status="verified" | "not_found" | "expired" | "offline" | "timeout"
  payload={{ name, licenseId, issuer, issueDate, expiryDate, cachedAt }}
  onRetry={refetch}
/>
```

### (b) 同步失敗 banner（OPCOS 統一格式）

法規 dataset 與證號 endpoint 兩者皆透過 OPCOS 雲端同步。任一同步失敗，於 `/cases/[id]` 頁面頂端顯示統一 banner，沿用「三、Toast / Banner / Modal 政策」中的 banner 樣式。三態如下：

| 狀態 | 顯示位置 | 樣式 | 文案 | 行為 |
| --- | --- | --- | --- | --- |
| Loading | 頁首下方 inline banner | 灰色背景 + 旋轉 icon | `正在同步 opcOS 法規條文與證號資料...` | 不阻擋操作 |
| Empty（首次啟動未同步） | 頁首下方 inline banner | 藍色背景 + Info icon | `尚未同步法規資料，按右側『立即同步』下載最新版本` | 顯示 `立即同步` CTA |
| Error | 頁首下方 inline banner | 紅色背景 + AlertCircle icon | `法規資料同步失敗：<reason>。將使用本機快取版本（<version_date>）` | 顯示 `重試同步` 按鈕；不阻擋 PDF 匯出 |

實作元件：

```tsx
<OpcosSyncBanner
  resource="legal_clauses" | "realtor_license"
  state="loading" | "empty" | "error"
  reason={errorMessage}
  cachedVersion={versionDate}
  onRetry={triggerSync}
/>
```

容錯原則：
- 離線狀態 → 一律使用本機快取，並於 PDF 法規頁加註「本版本為 <version_date> 之快取，請於連線後重新匯出以取得最新法規」。
- 證號離線 → 不阻擋匯出，但於 PDF 頁尾加紅字「證號未經即時驗證（離線）」。

### (c) PDF 法規告知頁版面規格

所有主題（成屋 / 土地 / 預售屋）共用 **同一份法規告知頁**，固定置於 PDF 最末 4 頁，所有版面元素如下：

| 項目 | 規格 |
| --- | --- |
| 頁數 | 固定 4 頁（不隨案件變動） |
| 位置 | PDF 文件最末（簽章頁之前） |
| 紙張 | A4 直向（210mm × 297mm） |
| 邊界 | 上 25mm、下 20mm、左 20mm、右 20mm |
| 頁首 | 左：`opcOS / AIRE — 法規告知`（10pt 灰）；右：`第 X 頁 / 共 Y 頁` |
| 頁尾 | 左：`版本：<version_date>（民國 <ROC>/西元 <CE> 年）`；中：`資料來源：opcOS 法規資料庫`；右：`匯出時間 <YYYY-MM-DD HH:mm>` |
| 版本日期格式 | **雙年制**：`民國 113 / 2024-03-15`（民國年 + 西元日期並列） |
| 字型 | Noto Sans TC 11pt 內文、14pt 章節標題、10pt 頁首頁尾 |
| 章節順序 | 1. 不動產經紀業管理條例（節錄）→ 2. 不動產經紀業申報資料申報內容項目 → 3. 不動產說明書應記載事項 → 4. 經紀人簽章與證號驗證註記 |
| 簽章區 | 第 4 頁底部 1/3，含經紀人姓名、證號、簽名欄、日期欄、`已驗證 / 離線 / 過期` 狀態浮水印 |

驗收：
- 不論案件複雜度，匯出後法規頁固定 4 頁不增減
- 頁首頁尾於所有 4 頁出現位置一致
- 證號狀態浮水印與「(a) 五態 UI」狀態一一對應
