# VideoGo SaaS — MVP 開發規格

> 撰寫日期：2026-04-03
> 依據：01～10 所有討論紀錄與確認決策
> 本文件為開發用規格，可直接拆成 Phase/Task 執行

---

## 1. MVP 範圍定義

### 1.1 MVP 目標

**一句話：用戶進來 → 選路線 → 出片，全程可走通。**

### 1.2 MVP 做 vs 不做

| 做（MVP） | 不做（後續） |
|-----------|-------------|
| 三入口首頁（熱門主題 / 自備內容 / 快速生成） | LINE Mini App |
| 預設角色庫（5-10 個系統角色） | PostGo 多平台發布 |
| 客戶自訂角色（上傳照片 → 自動定妝照 → Element Binding） | 聲音克隆 |
| 趨勢自動抓取（Google Trends / 新聞 API） | 產業分類趨勢 |
| 腳本自動生成 + 分鏡拆分 | 影片模板市集 |
| Kling O3 + Element Binding 影片生成 | 多模型切換（HunyuanCustom 已淘汰） |
| 分段生成 → FFmpeg 拼接 | 即時預覽（先用靜態分鏡圖） |
| 點數系統 + 金流串接 | 月費訂閱（先做點數包） |
| 帳號系統（email + Google OAuth） | LINE 登入 |
| 未登入可體驗到預覽 | — |

### 1.3 入口體驗目標

| 路線 | 用戶完成時間 | 步驟數 |
|------|------------|--------|
| C 快速生成 | < 2 分鐘 | 3 步 |
| B 自備內容 | < 5 分鐘 | 5 步 |
| A 熱門主題 | < 5 分鐘 | 5 步 |

---

## 2. 使用者流程（技術視角）

### 2.1 未登入流程

```
首頁（三入口卡片）
    ↓
任一路線（A/B/C）
    ↓
走到「預覽」步驟（不需登入）
    ↓
點「生成」→ 攔截 → 註冊/登入頁
    ↓
登入後自動回到預覽頁 → 繼續生成
```

技術需求：
- 預覽資料暫存在 localStorage 或 URL params
- 登入後 redirect 回原頁面，帶上暫存 key

### 2.2 路線 A：熱門主題

```
GET /api/trends                → 取得趨勢主題列表（自動抓取快取）
POST /api/trends/:id/angles    → AI 產出切角建議
POST /api/scripts/generate     → 根據切角 + 角色 → 產出腳本
POST /api/scripts/storyboard   → 腳本 → 分鏡
POST /api/videos/preview       → 生成靜態分鏡圖 + 模擬語音（免費）
POST /api/videos               → 提交生成任務（扣點）
```

### 2.3 路線 B：自備內容

```
POST /api/scripts/from-input   → 用戶文字 + 問答答案 → 產出腳本
POST /api/scripts/storyboard   → 腳本 → 分鏡
POST /api/videos/preview       → 靜態分鏡圖 + 模擬語音
POST /api/videos               → 提交生成任務
```

### 2.4 路線 C：快速生成

```
POST /api/videos/quick         → 照片 + 背景 + prompt → 系統自動生成腳本+分鏡+提交
```

路線 C 後端實際上串了 B 的所有步驟，只是前端不顯示中間過程。

---

## 3. 新增/修改 API 設計

以下只列 05 文件未涵蓋的新 API，原有 API（Auth/Credits/Videos/Characters/Payment）沿用。

### Trends（趨勢）— 新增

| Method | Endpoint | 說明 | 需登入 |
|--------|----------|------|--------|
| GET | `/api/trends` | 取得趨勢主題列表（快取 1 小時） | 否 |
| GET | `/api/trends/:id/angles` | 取得 AI 產出的切角建議 | 否 |

### Scripts（腳本）— 擴充

| Method | Endpoint | 說明 | 需登入 |
|--------|----------|------|--------|
| POST | `/api/scripts/generate` | 趨勢切角 + 角色 → 完整腳本 | 否 |
| POST | `/api/scripts/from-input` | 用戶文字 + 問答 → 腳本 | 否 |
| POST | `/api/scripts/storyboard` | 腳本 → 分鏡（含表情/語速/鏡位標註） | 否 |

### Videos（影片）— 擴充

| Method | Endpoint | 說明 | 需登入 |
|--------|----------|------|--------|
| POST | `/api/videos/preview` | 生成靜態分鏡圖 + 模擬語音 | 否 |
| POST | `/api/videos/quick` | 快速生成（照片+背景+prompt，一步到位） | 是 |

### Characters（角色）— 擴充

| Method | Endpoint | 說明 | 需登入 |
|--------|----------|------|--------|
| POST | `/api/characters/auto-setup` | 上傳照片 → 自動定妝照 + Element Binding | 是 |
| GET | `/api/characters/:id/preview` | 預覽角色定妝照效果 | 是 |

### Backgrounds（背景）— 新增

| Method | Endpoint | 說明 | 需登入 |
|--------|----------|------|--------|
| GET | `/api/backgrounds` | 預設背景庫列表 | 否 |

---

## 4. 資料庫 Schema 更新

以下只列新增/修改的 Table，原有 Schema（05 文件的 users/credits/credit_transactions/videos/templates/characters）保留。

### 4.1 趨勢（trends）— 新增

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| title | VARCHAR(255) | 趨勢主題標題 |
| source | ENUM | `google_trends` / `news_api` |
| source_url | VARCHAR(500) | 原始來源 URL |
| angles | JSONB | AI 產出的切角建議陣列 |
| fetched_at | TIMESTAMP | 抓取時間 |
| expires_at | TIMESTAMP | 過期時間（預設 24 小時） |

### 4.2 背景（backgrounds）— 新增

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| name | VARCHAR(100) | 背景名稱（如「現代客廳」「白底棚拍」） |
| image_url | VARCHAR(500) | 背景圖片 URL |
| category | VARCHAR(50) | 分類（如「室內」「戶外」「簡約」） |
| is_active | BOOLEAN | 是否啟用 |

### 4.3 videos 表 — 擴充欄位

| 新增欄位 | 型別 | 說明 |
|---------|------|------|
| entry_type | ENUM | `trending` / `custom_input` / `quick` — 來自哪條路線 |
| trend_id | UUID | FK → trends.id（路線 A 才有，nullable） |
| background_id | UUID | FK → backgrounds.id（路線 C 才有，nullable） |
| user_input | TEXT | 用戶原始輸入文字（路線 B/C） |
| qa_answers | JSONB | 路線 B 的問答結果 |

### 4.4 characters 表 — 擴充欄位

| 新增欄位 | 型別 | 說明 |
|---------|------|------|
| setup_status | ENUM | `uploading` / `processing` / `ready` / `failed` |
| original_photo_url | VARCHAR(500) | 客戶上傳的原始照片 |
| portrait_url | VARCHAR(500) | AI 生成的定妝照（已在 05 定義） |
| element_binding_config | JSONB | Element Binding 設定（自動產出） |
| voice_preset_id | VARCHAR(100) | 選用的預設聲線 ID |

### 4.5 聲線預設（voice_presets）— 新增

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| name | VARCHAR(100) | 聲線名稱（如「溫柔女聲」「穩重男聲」） |
| kling_voice_id | VARCHAR(255) | Kling API 聲音模型 ID |
| gender | ENUM | `male` / `female` |
| style | VARCHAR(100) | 風格描述（如「溫暖」「專業」「活潑」） |
| sample_url | VARCHAR(500) | 試聽音檔 URL |
| is_active | BOOLEAN | 是否啟用 |

---

## 5. 核心服務設計

### 5.1 趨勢抓取服務（TrendFetcher）

```
排程：每 6 小時自動抓取
來源：Google Trends API → 取前 20 筆熱門關鍵字
流程：
  1. 抓取趨勢關鍵字
  2. AI（LLM）為每個關鍵字產出 3-5 個切角
  3. 存入 trends 表（覆蓋過期資料）
快取：前端 GET /api/trends 快取 1 小時
```

### 5.2 腳本生成服務（ScriptEngine）

```
輸入：主題/切角/用戶文字 + 角色資料 + 問答結果
輸出：結構化腳本（JSONB）

腳本結構：
{
  "title": "影片標題",
  "total_duration": 15,
  "segments": [
    {
      "order": 1,
      "duration": 5,
      "narration": "台詞內容",
      "expression": "微笑",
      "voice_speed": "normal",
      "camera_angle": "front-half",
      "scene": "modern living room"
    },
    ...
  ]
}

LLM 選擇：依 routing 規則
  - 腳本生成用 Sonnet（快+便宜）
  - 切角建議用 Haiku（更快更便宜）
```

### 5.3 影片生成管線（VideoPipeline）

```
沿用現有 videogo CLI 的核心邏輯，包裝成服務：

1. 接收任務（from API Server）
2. 載入角色資料（定妝照 + Element Binding + 聲線）
3. 依分鏡逐段呼叫 Kling O3 API
   - 每段 3-5 秒
   - 帶 Element Binding 鎖臉
   - 帶聲線設定
4. 各段影片下載
5. FFmpeg 拼接 + 後製（色調校正）
6. 存檔 + 更新 DB 狀態
7. 通知用戶（Web push / email）
```

### 5.4 角色自動建立服務（CharacterAutoSetup）

```
輸入：客戶上傳的一張照片
流程：
  1. AI 分析照片（臉部偵測、角度判斷）
  2. 自動生成定妝照（修正光線/背景/角度）
     - 工具：可用 fal.ai 的圖像處理 API 或 Kling image generation
  3. 返回定妝照預覽 → 客戶確認
  4. 客戶確認後，自動設定 Element Binding
  5. 客戶選擇預設聲線
  6. 角色狀態更新為 ready
```

---

## 6. 前端頁面清單

### 6.1 公開頁面（不需登入）

| 頁面 | 路由 | 功能 |
|------|------|------|
| 首頁 | `/` | 三入口卡片 + 簡介 |
| 熱門主題 | `/trending` | 趨勢列表 → 選切角 → 選角色 → 腳本 → 預覽 |
| 自備內容 | `/create` | 輸入文字 → 問答 → 選角色 → 腳本 → 預覽 |
| 快速生成 | `/quick` | 選角色 → 選背景 → 輸入 prompt → 預覽 |
| 角色庫瀏覽 | `/characters` | 預設角色卡片（含試看 Demo） |
| 登入/註冊 | `/auth` | Email + Google OAuth |

### 6.2 登入後頁面

| 頁面 | 路由 | 功能 |
|------|------|------|
| 儀表板 | `/dashboard` | 點數餘額 + 最近影片 + 快捷入口 |
| 我的影片 | `/dashboard/videos` | 影片列表 + 下載 + 狀態 |
| 我的角色 | `/dashboard/characters` | 系統角色 + 自建角色管理 |
| 新建角色 | `/dashboard/characters/new` | 上傳照片 → 定妝照預覽 → 確認 → 選聲線 |
| 點數 | `/dashboard/credits` | 餘額 + 消耗紀錄 + 購買 |
| 購買點數 | `/dashboard/credits/buy` | 點數包選擇 + 付款 |

---

## 7. 開發 Phase 拆分

### Phase 1 — 基礎骨架 + 路線 C（快速生成）
**目標：最短路徑走通「上傳 → 出片」**

- [ ] Next.js 專案初始化 + 基礎 UI 框架
- [ ] 帳號系統（Email + Google OAuth）
- [ ] 點數系統（餘額 / 扣點 / 紀錄）
- [ ] 預設角色庫（先放沈知序 + 2-3 個角色）
- [ ] 預設背景庫（5-10 個場景）
- [ ] 預設聲線庫（3-5 個聲線）
- [ ] 路線 C 完整流程（選角色 → 選背景 → 輸入 prompt → 生成）
- [ ] Kling O3 + Element Binding 影片生成（搬移 videogo CLI 邏輯）
- [ ] FFmpeg 拼接 + 後製
- [ ] 影片庫（列表 + 下載）
- [ ] Oracle Cloud VM 部署

### Phase 2 — 路線 B（自備內容）+ 自訂角色
**目標：用戶可以用自己的內容 + 自己的臉**

- [ ] 路線 B 完整流程（輸入 → 問答 → 腳本 → 分鏡 → 預覽 → 生成）
- [ ] 腳本生成服務（LLM 整合）
- [ ] 分鏡自動拆分
- [ ] 客戶自訂角色（上傳照片 → 自動定妝照 → Element Binding）
- [ ] 預覽功能（靜態分鏡圖 + 模擬語音）

### Phase 3 — 路線 A（熱門主題）+ 金流
**目標：自動化內容來源 + 開始收費**

- [ ] 趨勢抓取服務（Google Trends API）
- [ ] AI 切角建議
- [ ] 路線 A 完整流程
- [ ] 金流串接（Payment Adapter）
- [ ] 點數包購買

### Phase 4 — 優化 + 擴展
**目標：提升體驗 + 商業準備**

- [ ] 未登入體驗優化（暫存 → 登入 → 接續）
- [ ] 影片品質優化（多段拼接順暢度）
- [ ] 通知系統（email / Web Push）
- [ ] 數據分析（用戶行為 / 轉換率）
- [ ] LINE Mini App（輕量通知）
- [ ] 月費訂閱方案

---

## 8. 技術決策總覽

| 項目 | 決策 | 來源 |
|------|------|------|
| 前端 | Next.js (App Router) | 05 文件 |
| 資料庫 | PostgreSQL | 05 文件 |
| 影片模型 | Kling O3 Standard + Element Binding | 09 MV 測試 |
| HunyuanCustom | 淘汰 | 09 MV 測試 |
| MV 製作 | 分段生成（3-5 秒/段）→ FFmpeg 拼接 | 09 測試結論 |
| 聲音 | 預設聲線庫（Kling voice） | 10 流程設計 |
| 趨勢來源 | Google Trends API 自動抓取 | 10 流程設計 |
| 部署 | Oracle Cloud VM（免費） | 05 文件 |
| 金流 | Payment Adapter 模式 | 02 文件 |
| LLM（腳本） | Sonnet（生成）/ Haiku（切角） | routing 規則 |
| 影片格式 | 9:16 直式 | 09 文件 |

---

## 9. 風險與待解決項目

| 風險 | 影響 | 對策 |
|------|------|------|
| 客戶上傳照片品質差 | 定妝照品質不穩定 | 上傳時做品質檢查（臉部偵測 + 解析度門檻） |
| Google Trends API 限制 | 趨勢抓取頻率受限 | 快取 + 備用來源（新聞 RSS） |
| Kling API 排隊時間 | 用戶等太久 | 顯示預估時間 + 完成通知 |
| Oracle Cloud 免費方案限制 | 運算不夠 | 備選 Zeabur（$15/月） |
| 單段 5 秒換鏡跳接 | MV 品質不自然 | 每段只做一個動作 + 轉場後製 |

---

## 附錄：與現有文件的關係

| 文件 | 角色 | 本 Spec 是否取代 |
|------|------|----------------|
| 05-技術架構規格 | 底層架構 + Schema 基礎 | 否，本 Spec 擴充它 |
| 10-使用者流程設計 | 產品流程（非技術） | 否，本 Spec 是它的技術實現 |
| 01～04 討論紀錄 | 決策源頭 | 否，本 Spec 引用它們 |
| videogo CLI | 技術原型 | 否，核心邏輯搬移到 SaaS |
