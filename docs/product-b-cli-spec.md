# 產品線 B：AI 房仲影片自動生成 CLI — 開發規格書

> 日期：2026-03-25
> 狀態：開發前 Spec（含架構設計 + TDD 規劃 + 嘴砲架構師壓力測試）
> 用途：Claude Code Team Agent 開發執行分工

---

## 目錄

1. [逐字稿決策摘要](#一逐字稿決策摘要)
2. [系統架構與運作模式](#二系統架構與運作模式)
3. [CLI 核心流程](#三cli-核心流程)
4. [客戶素材規格](#四客戶素材規格)
5. [Prompt 架構設計](#五prompt-架構設計)
6. [TDD 開發流程](#六tdd-開發流程)
7. [假資料測試策略](#七假資料測試策略)
8. [Tech Stack](#八tech-stack)
9. [嘴砲架構師壓力測試](#九嘴砲架構師壓力測試)
10. [開發時程預估](#十開發時程預估)
11. [待確認問題清單](#十一待確認問題清單)
12. [成本結構](#十二成本結構)

---

## 一、逐字稿決策摘要

> 從 5 份客戶會議逐字稿提取的核心開發決策

### 已確認決策

| # | 決策 | 來源 |
|---|------|------|
| D1 | 產品線 B 優先開發（影片自動生成），產品線 A（物件分析報告）延後 | 逐字稿 4, 5 |
| D2 | Phase 0 只做 CLI，不做 Web UI 和剪輯介面 | 討論確認 |
| D3 | 客戶直接用 Cursor / Claude Code 環境執行 CLI 指令 | 討論確認 |
| D4 | 放棄即夢（Jimeng）— 需大陸實名認證，台灣用戶合規問題 | 討論確認 |
| D5 | 改用可靈（Kling Avatar v2）透過 fal.ai 第三方 API | 成本分析確認 |
| D6 | 影片結構 = 開場鉤子 + 物件介紹 + CTA，約 3-3.5 分鐘 | 逐字稿 5 |
| D7 | 腳本必須含 Prompt 提示詞，依客戶指定的人物架構撰寫 | 討論確認 |
| D8 | 先生成文字腳本 → 客戶審核 → 審核通過才生成影片 | 逐字稿 5 |
| D9 | 數位人為 AI 生成虛擬角色（非真人），亞洲臉孔 | 討論確認 |
| D10 | 數位人只佔 2 段（開場+結尾 ~30 秒），其餘用照片動態 + 文字動畫 | 成本優化確認 |
| D11 | 後續影片發布透過 PostGo 系統處理 | 逐字稿 5 |
| D12 | Phase 1 客戶自用 → Phase 2 開放其他房仲（SaaS） | 逐字稿 4 |
| D13 | 分級定價：Level 0 ($699) → Level 5 ($6,500) → Level 10 (天文數字) | 逐字稿 4 |
| D14 | 影片段落要可個別檢視（客戶可能自行微調拼接） | 討論確認 |

### 客戶核心需求（原話摘錄）

**從逐字稿 5：**
- 「我只要把藤本丟進去就好」— 客戶想要最簡單的輸入方式
- 「我現在簽的東西，如果我現在電腦開始在生成...我全部都自帶在生成」— 自動化是核心
- 「一天你們拋個三個小時我就可以三個小時處理我可能要五六天不睡覺才能做完的東西」— 時間節省 = 核心價值

**從逐字稿 3：**
- 「可執行半自動流程、保留經驗護城河」— 系統輔助但不取代專業判斷
- 「以5年級仲介為目標用戶」— 有經驗的仲介，不是新手

**從逐字稿 1：**
- 「以地址啟動」— 地址是一切流程的起點
- 「門牌辨識，圖片轉文字」— 未來可支援拍照輸入

**從逐字稿 2：**
- 「轉換成提示詞」— 客戶理解並重視 Prompt 工程
- 「Windows 主機」— 客戶使用 Windows 環境

---

## 二、系統架構與運作模式

### 2.1 整體架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                    CLI 核心系統                                │
│                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐  │
│  │ 1. 輸入   │──▶│ 2. 腳本   │──▶│ 3. 審核   │──▶│ 4. 生成   │  │
│  │   模組    │   │   引擎    │   │   閘門    │   │   管線    │  │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘  │
│       │              │              │              │          │
│   地址/照片/     Claude API     輸出 MD 檔     ┌────┴────┐    │
│   物件資料       生成腳本      客戶審核修改   │         │    │
│                                            TTS    Kling   │
│                                           語音    Avatar  │
│                                            │         │    │
│                                            └────┬────┘    │
│                                                 │          │
│                                          ┌──────┴──────┐   │
│                                          │ 5. FFmpeg    │   │
│                                          │    合成引擎   │   │
│                                          └──────┬──────┘   │
│                                                 │          │
│                                          ┌──────┴──────┐   │
│                                          │ 6. 輸出      │   │
│                                          │  MP4 + 片段   │   │
│                                          └─────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 模組說明

| 模組 | 功能 | 輸入 | 輸出 |
|------|------|------|------|
| 1. 輸入模組 | 解析地址、照片、物件資料 | 地址字串 + 照片目錄 + config.json | 結構化物件資料 |
| 2. 腳本引擎 | Claude API 生成三段式腳本 | 物件資料 + Prompt 範本 | script.md (人讀) + script.json (機讀) |
| 3. 審核閘門 | 等待客戶確認/修改 | script.md | approved-script.json |
| 4. 生成管線 | TTS 語音 + Kling Avatar 數位人 | 核准腳本 + 角色圖 + 照片 | 音頻 MP3 + 影片片段 MP4 |
| 5. FFmpeg 合成 | 拼接片段 + 轉場 + 字幕 + 音樂 | 所有片段 + 配置 | 最終 MP4 + 個別片段 |
| 6. 輸出 | 多格式輸出 + 片段儲存 | 最終 MP4 | 9:16 / 16:9 / 1:1 MP4 |

### 2.3 資料流向

```
[地址] ──▶ [物件資料 JSON]
               │
               ▼
[Prompt 範本] + [物件資料] ──▶ [Claude API] ──▶ [腳本 MD + JSON]
                                                      │
                                               [客戶審核修改]
                                                      │
                                                      ▼
                                              [核准腳本 JSON]
                                                      │
                                    ┌─────────────────┼──────────────┐
                                    ▼                 ▼              ▼
                              [TTS 語音]      [Kling Avatar]   [照片處理]
                              每段台詞→MP3    角色圖+音頻→MP4   Ken Burns
                                    │                 │              │
                                    └─────────┬───────┘              │
                                              │                      │
                                              ▼                      │
                                    [FFmpeg 合成引擎] ◀──────────────┘
                                              │
                                    ┌─────────┼──────────┐
                                    ▼         ▼          ▼
                              [9:16 MP4] [16:9 MP4] [1:1 MP4]
                                    +
                              [個別片段 MP4 目錄]
```

---

## 三、CLI 核心流程

### 3.1 完整指令集

```bash
# === Step 1: 初始化專案 ===
rev init "台南市東區XX路XX號"
# 建立專案目錄結構，生成 config.json 範本

# === Step 2: 放入素材 ===
# 客戶手動將照片放入 ./photos/ 目錄
# 編輯 config.json 填入物件資訊

# === Step 3: 生成腳本 ===
rev script generate
# 呼叫 Claude API，輸出 script.md + script.json
# script.md 為客戶可讀版本（含 Prompt 標記）

# === Step 4: 客戶審核 ===
# 客戶直接編輯 script.md，修改文字內容
# 修改完成後：
rev script approve
# 將修改後的 script.md 同步回 script.json

# === Step 5: 生成影片 ===
rev video generate
# 依序執行：TTS → Kling Avatar → 照片動態 → FFmpeg 合成
# 顯示即時進度條

# === Step 6: 檢視結果 ===
rev video preview
# 列出所有生成的片段和最終影片
# 輸出路徑：./output/final-9x16.mp4, ./output/segments/

# === 輔助指令 ===
rev video regenerate --segment 3
# 重新生成指定片段

rev video export --aspect 16:9
# 重新輸出不同比例

rev status
# 查看當前專案狀態
```

### 3.2 專案目錄結構

```
project-台南市東區XX路/
├── config.json          # 物件資訊設定檔
├── photos/              # 客戶提供的照片
│   ├── exterior-01.jpg
│   ├── interior-01.jpg
│   └── ...
├── avatar/              # 數位人角色圖
│   └── character.png    # AI 生成的虛擬角色全身照
├── music/               # 背景音樂（可選）
│   └── bgm.mp3
├── scripts/             # 腳本檔案
│   ├── script.md        # 人讀版（客戶審核用）
│   ├── script.json      # 機讀版（系統用）
│   └── prompt-template/ # Prompt 範本
├── segments/            # 生成的影片片段
│   ├── 01-hook.mp4
│   ├── 02-brand.mp4
│   ├── 03-exterior.mp4
│   ├── 04-avatar-intro.mp4
│   ├── 05-interior.mp4
│   ├── 06-data.mp4
│   ├── 07-avatar-summary.mp4
│   ├── 08-environment.mp4
│   └── 09-cta.mp4
├── audio/               # TTS 生成的音頻
│   ├── 01-hook.mp3
│   ├── 04-avatar-intro.mp3
│   └── 07-avatar-summary.mp3
└── output/              # 最終輸出
    ├── final-9x16.mp4
    ├── final-16x9.mp4
    ├── final-1x1.mp4
    └── thumbnail.jpg
```

### 3.3 影片段落結構（3 分鐘版本）

| # | 段落 | 時長 | 類型 | 生成方式 | 預估成本 |
|---|------|------|------|---------|---------|
| 1 | 開場鉤子 | 5s | 文字動畫 | FFmpeg drawtext + 背景照片 | $0 |
| 2 | 品牌卡 | 5s | Logo 動畫 | FFmpeg overlay + fade | $0 |
| 3 | 物件外觀 | 30s | 照片輪播 | FFmpeg Ken Burns + crossfade | $0 |
| 4 | 數位人開場介紹 | 15s | AI 數位人 | Kling Avatar v2 (fal.ai) | ~$0.84 |
| 5 | 室內展示 | 40s | 照片輪播 | FFmpeg Ken Burns + zoom pan | $0 |
| 6 | 數據亮點 | 15s | 資訊卡片 | FFmpeg 圖文動畫 | $0 |
| 7 | 數位人總結 | 15s | AI 數位人 | Kling Avatar v2 (fal.ai) | ~$0.84 |
| 8 | 周邊環境 | 20s | 地圖/街景 | FFmpeg 照片動態 | $0 |
| 9 | CTA 結尾 | 15s | 聯絡資訊 | FFmpeg 圖文 + QR Code | $0 |
| | **合計** | **~160s** | | | **~$1.68** |

> **只有段落 4 和 7 需要 Kling Avatar API（共 30 秒），其餘全部用 FFmpeg 本地生成。**

---

## 四、客戶素材規格

### 4.1 必要素材

| 素材 | 格式 | 解析度 | 數量 | 說明 |
|------|------|--------|------|------|
| 物件外觀照片 | JPG/PNG | ≥1080×1920 (9:16) 或 ≥1920×1080 (16:9) | 3-5 張 | 正面、側面、全景 |
| 室內照片 | JPG/PNG | 同上 | 5-10 張 | 客廳、臥室、廚房、浴室等 |
| 數位人角色圖 | PNG | ≥1024×1024 | 1 張 | AI 生成的虛擬角色半身/全身照 |
| 物件資訊 | JSON/文字 | — | 1 份 | 地址、坪數、價格、特色等 |

### 4.2 選用素材

| 素材 | 格式 | 說明 |
|------|------|------|
| 背景音樂 | MP3 | 客戶 Artlist 訂閱下載，或系統內建 |
| Logo | PNG (透明背景) | 品牌浮水印 |
| 周邊環境照 | JPG/PNG | 學區、公園、交通站點 |
| 既有腳本 | MD/TXT | 客戶過往影片腳本作為風格參考 |

### 4.3 數位人角色圖生成

客戶沒有現成角色時的生成流程：

```bash
# 用 Claude 生成 Midjourney/Seedance 提示詞
rev avatar prompt --style "台灣女性房仲 30歲 專業套裝"

# 輸出提示詞範例：
# "Professional Taiwanese female real estate agent, 30 years old,
#  wearing navy business suit, confident smile, frontal portrait,
#  studio lighting, clean white background, photorealistic, 8K"

# 客戶到 Midjourney / 即夢 生成圖片後放入 ./avatar/ 目錄
```

> **重要限制**：Kling Avatar **不能使用真人照片**（ByteDance/Kuaishou 政策），必須使用 AI 生成的角色圖。

---

## 五、Prompt 架構設計

### 5.1 腳本生成 Prompt 結構

```
[系統角色設定]
你是一位資深房仲行銷企劃師，專精台灣不動產市場。
你的任務是為房仲業務員生成物件行銷影片的腳本。

[人物架構]（客戶指定）
- 數位人角色：{角色名稱}，{角色設定}
- 說話風格：{專業/親切/活潑}
- 目標觀眾：{買方類型，如：首購族/換屋族/投資客}

[影片結構要求]
1. 開場鉤子（5秒）：一句話抓住注意力
2. 品牌辨識（5秒）：品牌名 + slogan
3. 物件外觀（30秒）：旁白描述外觀特色
4. 數位人開場（15秒）：角色自我介紹 + 物件核心賣點
5. 室內展示（40秒）：逐房間旁白導覽
6. 數據亮點（15秒）：坪數/單價/增值數據
7. 數位人總結（15秒）：總結推薦理由 + 稀缺感
8. 周邊環境（20秒）：學區/交通/生活機能
9. CTA 結尾（15秒）：聯絡方式 + 行動呼籲

[物件資料]
{從 config.json 注入}

[輸出格式]
每個段落包含：
- segment_id: 段落編號
- type: "text_animation" | "photo_carousel" | "avatar" | "data_card" | "cta"
- duration: 秒數
- narration: 旁白文字（數位人段落 = 數位人台詞）
- visual_notes: 畫面指示
- photos: 對應照片檔名列表
- transition: 轉場效果
```

### 5.2 script.md 輸出範例（客戶審核用）

```markdown
# 🏠 物件行銷影片腳本

> 物件：台南市東區XX路XX號
> 類型：透天厝 4房2廳3衛
> 總價：1,280 萬

---

## 第 1 段：開場鉤子（5秒）
**類型**：文字動畫 + 背景照片
**畫面**：物件外觀照 + 大字標題
**文字**：「東區稀有透天，步行 5 分鐘到學區」

---

## 第 2 段：品牌辨識（5秒）
**類型**：Logo 動畫
**畫面**：品牌 Logo 淡入 + 底部 slogan

---

## 第 3 段：物件外觀（30秒）
**類型**：照片輪播（Ken Burns 效果）
**照片**：exterior-01.jpg → exterior-02.jpg → exterior-03.jpg
**旁白**：
> 位於台南東區精華地段，這棟三層樓透天厝...
> （此處客戶可直接修改旁白文字）

---

## 第 4 段：數位人開場介紹（15秒）⭐ AI 數位人
**類型**：Kling Avatar 生成
**角色**：{角色名稱}
**台詞**：
> 大家好，我是 XX 房屋的 OO。今天帶大家看一間
> 東區非常稀有的透天厝，四房兩廳的格局...
> （此處客戶可修改台詞）

---

... （後續段落）
```

### 5.3 Prompt 範本管理

```
scripts/prompt-template/
├── default.md          # 預設通用範本
├── luxury.md           # 豪宅版本
├── first-buyer.md      # 首購族版本
├── investor.md         # 投資客版本
└── custom/             # 客戶自訂範本
    └── {client-name}.md
```

客戶提供的既有腳本和人物架構，會存入 `custom/` 目錄作為 Claude API 的 few-shot 範例。

---

## 六、TDD 開發流程

### 6.1 測試策略總覽

```
測試金字塔：

        /  E2E 測試  \          ← 完整流程（地址→MP4）
       / 整合測試      \        ← API 串接、FFmpeg 合成
      /   單元測試       \      ← 各模組獨立功能
     ─────────────────────
```

### 6.2 開發順序（由內而外）

```
Phase 0-1: 基礎建設（Week 1）
├── test: CLI 指令解析
├── test: config.json 驗證
├── test: 照片格式與尺寸檢查
└── test: 專案目錄初始化

Phase 0-2: 腳本引擎（Week 2）
├── test: Prompt 範本載入與變數注入
├── test: Claude API 呼叫與回應解析
├── test: script.json 格式驗證
├── test: script.md ↔ script.json 雙向同步
└── test: 腳本修改後重新解析

Phase 0-3: 影片生成管線（Week 3）
├── test: TTS 語音生成（mock → real）
├── test: Kling Avatar API 呼叫與結果下載
├── test: FFmpeg Ken Burns 照片動態
├── test: FFmpeg 文字動畫渲染
├── test: FFmpeg 資訊卡片生成
└── test: 片段命名與儲存

Phase 0-4: 合成引擎（Week 4）
├── test: FFmpeg 片段拼接（含轉場）
├── test: 字幕疊加
├── test: 背景音樂混音
├── test: Logo 浮水印
├── test: 多比例輸出（9:16, 16:9, 1:1）
└── test: 最終 MP4 完整性驗證

Phase 0-5: 整合與優化（Week 5）
├── test: E2E 完整流程（假資料 → 真 MP4）
├── test: 錯誤處理與重試機制
├── test: 進度顯示
└── test: Windows 相容性
```

### 6.3 TDD 循環

```
每個功能的開發循環：

1. 寫測試（Red）
   → 定義輸入和預期輸出
   → 測試必須先跑失敗

2. 寫最小實作（Green）
   → 只寫剛好讓測試通過的程式碼
   → 不多寫任何東西

3. 重構（Refactor）
   → 清理程式碼
   → 確保測試仍然通過

4. 下一個測試
```

---

## 七、假資料測試策略

### 7.1 為什麼需要假資料

| 問題 | 解決方案 |
|------|---------|
| Kling Avatar API 每次呼叫都花錢 | 用本地 mock 影片替代 |
| Claude API 每次呼叫都花錢 | 用預存的 JSON 回應替代 |
| 測試時不需要等 API 回應（5-20 分鐘） | Mock 立即回傳 |
| 客戶尚未提供真實素材 | 用 sample 照片和設定檔 |

### 7.2 假資料清單

```
test/fixtures/
├── config/
│   ├── sample-config.json        # 假物件資訊
│   └── sample-config-luxury.json # 假豪宅資訊
├── photos/
│   ├── sample-exterior-01.jpg    # 1920×1080 測試外觀照
│   ├── sample-interior-01.jpg    # 1920×1080 測試室內照
│   └── ... (共 10 張)
├── avatar/
│   └── sample-character.png      # 1024×1024 測試角色圖
├── audio/
│   └── sample-narration.mp3      # 15 秒測試語音
├── video/
│   └── sample-avatar.mp4         # 15 秒測試數位人影片
├── scripts/
│   ├── sample-script.md          # 預生成的腳本 MD
│   └── sample-script.json        # 預生成的腳本 JSON
└── api-responses/
    ├── claude-script-response.json    # Claude API mock 回應
    ├── tts-response.json              # TTS API mock 回應
    └── kling-avatar-response.json     # Kling API mock 回應
```

### 7.3 Mock 模式

```bash
# 開發時用 mock 模式（不呼叫真實 API，不花錢）
rev script generate --mock
rev video generate --mock

# 整合測試時用真實 API
rev script generate
rev video generate

# 混合模式（只 mock 昂貴的 Kling API）
rev video generate --mock-avatar
```

### 7.4 測試用假物件

```json
{
  "address": "台南市東區崇明路 168 號",
  "property_type": "透天厝",
  "floors": 3,
  "rooms": "4房2廳3衛",
  "area_ping": 52.5,
  "price_total": 12800000,
  "price_per_ping": 243809,
  "features": [
    "近崇明國中學區（步行 5 分鐘）",
    "全新裝潢",
    "前後陽台",
    "獨立車庫"
  ],
  "target_audience": "首購族/換屋族",
  "agent_name": "陳小明",
  "agent_phone": "0912-345-678",
  "brand_name": "XX 房屋",
  "brand_slogan": "住進理想生活"
}
```

---

## 八、Tech Stack

### 8.1 核心技術選型

| 層級 | 技術 | 選擇原因 |
|------|------|---------|
| 語言 | TypeScript (Node.js) | 與 Claude Code 生態一致，前後端通用 |
| CLI 框架 | Commander.js + Inquirer.js | 成熟穩定，支援互動式提示 |
| AI 腳本 | Claude API (@anthropic-ai/sdk) | 繁體中文最強，Prompt 控制精準 |
| TTS 語音 | Artlist AI Voiceover API 或 ElevenLabs | 客戶已有 Artlist 訂閱；ElevenLabs 為備案 |
| 數位人 | Kling Avatar v2 via fal.ai | 亞洲臉孔原生支援，成本最低 |
| 影片合成 | FFmpeg (fluent-ffmpeg) | 本地執行、零 API 費用、完整控制 |
| 測試 | Vitest | 快速、TypeScript 原生支持 |
| 套件管理 | pnpm | 快速、省空間 |

### 8.2 關鍵依賴

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "@fal-ai/client": "^1.2.0",
    "commander": "^13.0.0",
    "fluent-ffmpeg": "^2.1.3",
    "inquirer": "^12.0.0",
    "ora": "^8.0.0",
    "chalk": "^5.0.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "vitest": "^3.0.0",
    "typescript": "^5.7.0",
    "@types/fluent-ffmpeg": "^2.1.0"
  }
}
```

### 8.3 系統要求

| 項目 | 要求 |
|------|------|
| Node.js | ≥ 20 LTS |
| FFmpeg | ≥ 6.0（必須安裝） |
| 磁碟空間 | 每個專案 ~500MB（照片+影片片段+輸出） |
| 網路 | API 呼叫需要網路（Claude + fal.ai） |
| OS | Windows 10+（WSL2 或原生）/ macOS / Linux |

### 8.4 Tech Stack 相關問題

| # | 問題 | 風險等級 | 說明 |
|---|------|---------|------|
| T1 | FFmpeg Windows 安裝 | 🟡 中 | Windows 用戶需額外安裝 FFmpeg，需提供安裝指引或自動偵測 |
| T2 | fal.ai 服務穩定性 | 🟡 中 | 第三方 API 聚合平台，非原廠 API，可能有服務中斷 |
| T3 | Kling Avatar v2 生成品質一致性 | 🟡 中 | 每次生成的數位人可能有細微差異（髮型、表情） |
| T4 | TTS 中文語音自然度 | 🟡 中 | 台灣繁體中文 TTS 品質參差不齊，需評測 |
| T5 | FFmpeg Ken Burns 效果品質 | 🟢 低 | 已有成熟方案，zoompan filter 可控 |
| T6 | 大檔案處理（10+ 張高解析度照片） | 🟢 低 | FFmpeg 串流處理，不需全部載入記憶體 |
| T7 | Artlist AI Voiceover 是否有 API | 🔴 高 | **Artlist 目前沒有公開 API**，可能需要改用 ElevenLabs 或 OpenAI TTS |
| T8 | 角色圖品質對數位人效果影響 | 🟡 中 | 角色圖解析度和姿勢直接影響生成品質 |

---

## 九、嘴砲架構師壓力測試

> 場景類型：接案/服務 + 技術產品
> 加重砲轟：技術可行、交付品質、團隊能力
> 輕砲轟：退場機制

### Red Team 砲轟結果（精簡版 — 聚焦開發相關）

#### 維度 7：技術可行 — 5/10

🦏 灰犀牛風險：**過度依賴第三方 API 鏈**

💀 致命死法：
1. **單點故障鏈** — fal.ai 掛了 → Kling Avatar 不可用 → 整個影片生成停擺
2. **Artlist 沒有 API（T7）** — 最大未解問題，客戶的 Artlist 訂閱可能無法程式化使用
3. **過早自動化** — 腳本→影片的完整流程從未手動走過一次

❓ 關鍵問題：
- fal.ai 掛了的備案是什麼？（WaveSpeed? 直接 Kling 官方?）
- TTS 到底用什麼？Artlist AI Voiceover 有沒有 API 端點？
- 有沒有先用手動流程跑過一次完整的「腳本→TTS→數位人→合成」？

**必做行動：**
```
POC 前必須手動驗證：
1. 手動寫一份腳本 → 手動錄/生成語音 → 手動上傳 fal.ai → 手動 FFmpeg 合成
2. 確認 Artlist AI Voiceover 的實際使用方式（有無 API / 只有 Web 介面）
3. 確認 fal.ai Kling Avatar v2 的實際生成品質和等待時間
```

#### 維度 10：交付品質 — 4/10

🦏 灰犀牛風險：**影片品質不可控**

💀 致命死法：
1. **技術流偏執** — 開發者覺得效果很好，但客戶（房仲）覺得不如手動用剪映
2. **Ken Burns 照片動態看起來很廉價** — 沒有經過真實客戶驗收
3. **數位人嘴型不自然** — TTS 音頻與 Kling Avatar 的嘴型同步可能有違和感

❓ 關鍵問題：
- 客戶目前手動製作一部影片需要多久？我們的品質要達到「可用」還是「專業」？
- 客戶有沒有提供過往影片作為品質基準？
- 9 個段落的轉場風格統一性怎麼確保？

#### 維度 8：團隊能力 — 6/10

🕊️ 灰天鵝風險：**一人開發的單點故障**

💀 致命死法：
1. **FFmpeg 進階效果開發時間超估** — Ken Burns + 文字動畫 + 轉場效果的微調極耗時間
2. **客戶的 Windows 環境除錯** — 遠端協助 Windows 上的 FFmpeg 安裝和路徑問題

#### 維度 15：時機與節奏 — 8/10

🟢 正面：
- AI 影片生成正處於爆發期（2025-2026），Kling/Sora/Runway 競爭讓成本快速下降
- 台灣房仲產業 AI 化程度極低，先發優勢明確
- 客戶有急迫需求（「我做不完了」「趕快擁有這個」）

🟡 風險：
- Kling/fal.ai 的 API 和定價可能在 3 個月內大幅變動
- 更大的平台（Visla, HeyGen）可能在 6 個月內支援繁體中文+亞洲臉孔

---

### 砲轟評分摘要

```
═══ Red Team 砲轟結果（開發相關維度）═══

⑦ 技術可行   5/10   ← 最大風險：API 依賴鏈 + Artlist 無 API
⑩ 交付品質   4/10   ← 影片品質未經客戶驗證
⑧ 團隊能力   6/10   ← 一人開發風險
⑬ 專案管理   7/10   ← TDD + CLI 架構清晰
⑮ 時機節奏   8/10   ← 市場時機正確

Top 3 必須在開發前解決的問題：

1. 🔴 Artlist AI Voiceover 有沒有 API？
   → 沒有的話，必須改用 ElevenLabs ($5/month) 或 OpenAI TTS ($0.015/1K chars)
   → 這會改變成本結構

2. 🔴 手動走過一次完整流程
   → 在寫任何程式碼之前，用手動方式完成一部影片
   → 確認品質基準和每個環節的實際等待時間

3. 🟡 fal.ai 備案方案
   → 準備 WaveSpeed 或 Kling 官方 API 作為備案
   → 程式碼用 Adapter Pattern 設計，切換 API 不改業務邏輯
```

---

## 十、開發時程預估

### 10.1 Phase 0：CLI 核心（5 週）

| 週次 | 任務 | 交付物 | 前置條件 |
|------|------|--------|---------|
| Week 0 | **手動 POC** | 1 部手動完成的示範影片 | 客戶提供素材 |
| Week 1 | 基礎建設 + CLI 框架 | `rev init` + `rev status` 可用 | Week 0 完成 |
| Week 2 | 腳本引擎 | `rev script generate/approve` 可用 | Claude API Key |
| Week 3 | 影片生成管線 | TTS + Kling Avatar + FFmpeg 個別片段 | fal.ai API Key |
| Week 4 | 合成引擎 + 輸出 | `rev video generate` 完整可用 | FFmpeg 安裝 |
| Week 5 | 整合測試 + Windows 驗證 | 客戶可在 Windows 上獨立使用 | Windows 測試機 |

### 10.2 Week 0 手動 POC（開發前必做）

```
目標：用手動方式完成一部完整影片，驗證品質和流程

Day 1-2:
- 客戶提供素材（照片 + 物件資訊 + 角色圖）
- 手動寫腳本（或用 Claude Chat 生成）
- 客戶審核腳本

Day 3:
- 用 ElevenLabs / OpenAI TTS 生成語音
- 用 fal.ai Kling Avatar v2 生成數位人片段
- 記錄生成等待時間和品質

Day 4-5:
- 用 FFmpeg 命令列手動合成
- 測試 Ken Burns、轉場、字幕效果
- 輸出最終 MP4

交付：
✅ 1 部 ~3 分鐘示範影片
✅ 品質評估報告
✅ 實際成本記錄
✅ 確認/調整技術選型
```

### 10.3 後續 Phase

| Phase | 時間 | 範圍 |
|-------|------|------|
| Phase 0 | 5 週 | CLI 核心（本文件範圍） |
| Phase 1 | +4 週 | 簡易 Web UI（上傳照片 → 下載影片） |
| Phase 2 | +4 週 | 完整 SaaS（多租戶 + 計費 + PostGo 串接） |

---

## 十一、待確認問題清單

### 🔴 必須在開發前確認（阻擋開發）

| # | 問題 | 對象 | 影響 |
|---|------|------|------|
| Q1 | Artlist AI Voiceover 是否有 API 可程式化呼叫？ | 查 Artlist 文件 / 問客服 | 決定 TTS 技術選型 |
| Q2 | 客戶的數位人角色圖已經有了嗎？是 AI 生成的嗎？ | 客戶 | 決定是否需要角色圖生成流程 |
| Q3 | 客戶過往影片的品質基準？（有範例影片可參考嗎？） | 客戶 | 設定交付品質標準 |
| Q4 | 客戶的人物架構和說話風格具體要求？ | 客戶（明天提供） | Prompt 設計 |
| Q5 | 客戶 Windows 環境版本？有無安裝 Node.js / FFmpeg 經驗？ | 客戶 | 安裝引導設計 |

### 🟡 可在開發中確認

| # | 問題 | 說明 |
|---|------|------|
| Q6 | 背景音樂來源？ | 客戶 Artlist 下載 or 系統內建 |
| Q7 | 字幕樣式偏好？ | 字體、顏色、位置 |
| Q8 | 品牌 Logo 規格？ | 尺寸、透明度、位置 |
| Q9 | 是否需要短影片版（48 秒，逐字稿提到） | 短影片結構可能不同 |
| Q10 | PostGo 串接方式？ | Phase 2 規劃 |

### 🟢 客戶明天提供

| # | 素材 |
|---|------|
| M1 | 過去的影片腳本 |
| M2 | 人物架構設定 |
| M3 | 角色圖（如有） |
| M4 | 物件照片範例 |
| M5 | 既有影片範例（如有） |

---

## 十二、成本結構

### 12.1 Phase 0 開發期間成本（假資料 + Mock）

| 項目 | 費用 |
|------|------|
| Claude API（腳本生成測試） | ~$2-5（少量呼叫） |
| fal.ai Kling Avatar（POC 測試） | ~$5-10（5-10 次測試） |
| ElevenLabs TTS（測試） | $0（免費額度 10,000 字/月） |
| FFmpeg | 免費 |
| **開發期總計** | **~$10-15（~NT$300-500）** |

### 12.2 正式營運成本（每部影片）

| 項目 | 成本 | 說明 |
|------|------|------|
| Claude API 腳本生成 | ~$0.10 (~NT$3) | ~2000 tokens 輸出 |
| TTS 語音（OpenAI TTS） | ~$0.15 (~NT$5) | ~1000 字 × $0.015/1K |
| Kling Avatar v2 Standard | ~$1.68 (~NT$55) | 30 秒 × $0.0562/秒 |
| FFmpeg 合成 | $0 | 本地執行 |
| **每部影片總計** | **~$1.93 (~NT$63)** | |
| **30 部/月** | **~$58 (~NT$1,890)** | |

### 12.3 SaaS 定價建議

| 方案 | 月費 | 成本 | 毛利 | 毛利率 |
|------|------|------|------|--------|
| 30 部/月 | NT$3,000 | NT$1,890 | NT$1,110 | 37% |
| 30 部/月 | NT$3,999 | NT$1,890 | NT$2,109 | 53% |
| 減為 1 段數位人 | NT$3,000 | NT$1,065 | NT$1,935 | 65% |

---

## 附錄 A：FFmpeg 關鍵指令參考

### Ken Burns 效果（照片→影片）

```bash
# 緩慢放大效果（5秒）
ffmpeg -loop 1 -i photo.jpg -vf \
  "zoompan=z='min(zoom+0.0015,1.5)':d=150:s=1080x1920:fps=30" \
  -t 5 -c:v libx264 -pix_fmt yuv420p output.mp4
```

### 照片輪播 + Crossfade

```bash
# 三張照片，每張 10 秒，crossfade 1 秒
ffmpeg -loop 1 -t 11 -i p1.jpg -loop 1 -t 11 -i p2.jpg -loop 1 -t 11 -i p3.jpg \
  -filter_complex \
  "[0:v]zoompan=...[v0]; \
   [1:v]zoompan=...[v1]; \
   [2:v]zoompan=...[v2]; \
   [v0][v1]xfade=transition=fade:duration=1:offset=10[x1]; \
   [x1][v2]xfade=transition=fade:duration=1:offset=20[out]" \
  -map "[out]" output.mp4
```

### 文字動畫

```bash
# 文字淡入
ffmpeg -i bg.mp4 -vf \
  "drawtext=text='東區稀有透天':fontfile=NotoSansTC.ttf:fontsize=72:\
   fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:\
   enable='between(t,0.5,4.5)':alpha='if(lt(t,1.5),(t-0.5),if(gt(t,3.5),4.5-t,1))'" \
  output.mp4
```

---

## 附錄 B：API Adapter Pattern

```typescript
// 設計：所有 AI API 透過 Adapter 抽象，切換 API 不改業務邏輯

interface VideoGeneratorAdapter {
  generateAvatar(input: AvatarInput): Promise<AvatarOutput>;
}

class FalAiKlingAdapter implements VideoGeneratorAdapter {
  async generateAvatar(input: AvatarInput): Promise<AvatarOutput> {
    // fal.ai Kling Avatar v2 實作
  }
}

class WaveSpeedAdapter implements VideoGeneratorAdapter {
  async generateAvatar(input: AvatarInput): Promise<AvatarOutput> {
    // WaveSpeed 備案實作
  }
}

// TTS 同理
interface TTSAdapter {
  generateSpeech(text: string, voice: VoiceConfig): Promise<Buffer>;
}

class OpenAITTSAdapter implements TTSAdapter { ... }
class ElevenLabsTTSAdapter implements TTSAdapter { ... }
```

---

*文件結束。最後更新：2026-03-25*
