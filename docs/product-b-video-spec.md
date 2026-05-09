# 產品線 B：AI 房仲影片自動生成 SaaS — 完整規劃 Spec

> 日期：2026-03-24 狀態：前期規劃討論稿（含成本分析 + 商業化定價） 用途：與客戶討論用 + Claude Code Team Agent 執行開發分工的 Spec 文件

---

## 一、專案概要

### 1.1 客戶需求

房仲客戶希望建立一個 SaaS 系統，能夠：

1. 輸入物件資料（地址、照片、特色）
2. 系統自動產出影片腳本（含開場鉤子、物件介紹、CTA）
3. 客戶審核文案後，系統生成 AI 數位人 + 物件實景的 3.5 分鐘短影片
4. **一站式線上剪輯**（加字幕、音效、CTA、轉場），不需要另開剪映
5. 完成後可直接下載或透過 PostGo 一鍵發佈到社群平台

### 1.2 系統階段

- **Phase 1**：客戶自用（單租戶）
- **Phase 2**：開放給其他房仲（多租戶 SaaS）

### 1.3 客戶已持有的工具

- 即夢消費者會員（69 RMB/月，積分制，已購一年）
- Artlist 訂閱（AI 語音 + 音樂素材庫）

---

## 二、一站式完整架構圖

```
┌──────────────────────────────────────────────────────────────────┐
│                      我們的 SaaS 平台                             │
│                                                                  │
│  ① 腳本引擎（Claude API）                                         │
│     輸入：物件地址 + 照片 + 特色 + 分析數據（產品線 A）               │
│     輸出：三段式腳本 JSON（Hook + Main + CTA）                     │
│     ↓                                                            │
│  ② 客戶審核介面                                                    │
│     後台逐段顯示腳本，可修改文字、調整段落順序                         │
│     ↓ 審核通過                                                    │
│  ③ AI 生成佇列                                                    │
│     ├── 語音生成（Artlist AI Voiceover / TTS）                     │
│     │   輸入：每段台詞文字                                          │
│     │   輸出：MP3/WAV 音頻檔案                                     │
│     ├── 數位人片段（即夢 API）                                      │
│     │   輸入：虛擬角色圖 + 音頻                                     │
│     │   輸出：15 秒 MP4（數位人對口型講話）                          │
│     └── 物件實景片段（即夢 圖生視頻 API）                            │
│         輸入：物件照片 + 文字描述                                    │
│         輸出：15 秒 MP4（照片轉動態影片）                            │
│     ↓                                                            │
│  ④ 線上輕剪輯器（Creatomate Preview SDK）                          │
│     ├── 即時預覽每段片段（瀏覽器內渲染）                              │
│     ├── 拖拉排序片段順序                                           │
│     ├── 加字幕 / Logo / CTA 卡片                                  │
│     ├── 加背景音樂（Artlist 素材）                                  │
│     ├── 簡單 trim（裁切頭尾）                                      │
│     ├── 選轉場效果                                                │
│     └── 不滿意的段落 → 一鍵重新生成                                 │
│     ↓                                                            │
│  ⑤ 雲端渲染（Creatomate API）                                     │
│     把所有片段 + 字幕 + 音樂 + 轉場 → 渲染成完整 MP4                 │
│     ↓                                                            │
│  ⑥ 輸出                                                          │
│     ├── 下載 MP4（9:16 短影片 / 16:9 YouTube / 1:1 社群）          │
│     ├── 下載各段獨立 15 秒片段（客戶自行剪輯用）                      │
│     └── 一鍵發佈到 PostGo → Zernio API → 14 個社群平台              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 三、即夢 API 技術能力分析

### 3.1 影片生成硬限制

| 參數 | 限制 | 備註 |
| --- | --- | --- |
| **單次最長時長** | **4-15 秒**（可精確到秒） | 3.5 分鐘 = 至少 14 段 |
| **解析度** | 720p / 1080p / 2K | 社群用 1080p 即可 |
| **畫面比例** | 1:1、4:3、3:4、16:9、9:16、21:9 | 9:16 適合短影片 |
| **多模態輸入** | 最多 9 張圖片 + 3 段影片 + 3 段音頻 | 四模態混合 |
| **角色一致性** | 用 @1 @2 占位符引用角色/場景圖 | 人臉、服裝全程鎖定 |
| **音視頻同步** | 原生支援口型、表情同步 | Dual-Branch Diffusion Transformer |
| **影片接續** | 上一段最後一幀 → 下一段起始幀 | 多段無縫銜接 |
| **真人人臉** | 全能參考模式暫不支援寫實人臉上傳 | 需用數位人 API |
| **生成等待** | 消費者端 5-20 分鐘/段 | 14 段預估 70-280 分鐘 |
| **prompt 長度** | 最多 5000 字元 |  |

### 3.2 數位人功能

- 上傳一張人物圖片 + 一段音頻 → 生成對口型說話影片
- 支援大師模式（表情更生動、口型更精準）
- 動作模仿功能：可參考動作影片生成角色動態
- **限制**：照片轉語音功能因 deepfake 疑慮已暫停

### 3.3 品質衰減與對策

連續延長 3 次以上，畫面品質可能下降。建議：

- 每延長 2 次就「重啟」— 把前段導出作為新的參考視頻
- 接縫處用 B-roll / 轉場覆蓋
- 用 Creatomate 加轉場效果遮蓋接縫

### 3.4 背景音樂

即夢分段生成的音樂風格可能不一致 → **建議後期在 Creatomate 統一鋪上背景音樂**（用 Artlist 素材）。

---

## 四、API 存取路徑分析（三條路線）

### 路線 A：逆向 API（Session ID 模式）— POC 用

| 項目 | 說明 |
| --- | --- |
| **開源專案** | jimeng-free-api、jimeng-api、seedance2.0 Web |
| **原理** | F12 取得 sessionid → 作為 Bearer Token 呼叫 |
| **技術架構** | Docker 部署，提供 OpenAI 相容端點 |
| **費用** | 客戶既有會員積分，無額外 API 費用 |
| **風險** | ⚠️ 帳號封禁風險、Session ID 過期需重新取得 |
| **合規** | ⚠️ 違反即夢服務協議 |
| **適合場景** | POC 驗證、Phase 1 客戶自用 |
| **SaaS 適合度** | ❌ 不適合 Phase 2 |

### 路線 B：火山引擎官方 API — Phase 2 必用

| 項目 | 說明 |
| --- | --- |
| **平台** | Volcengine（中國）/ BytePlus（國際） |
| **認證** | 需企業驗證（KYC） |
| **費用** | 720p \~$0.10/分鐘，1080p \~$0.30/分鐘 |
| **穩定性** | 高 — 官方 SLA |
| **適合場景** | SaaS 產品、商業應用 |

### 路線 C：第三方 API 平台 — 過渡方案

| 項目 | 說明 |
| --- | --- |
| **平台** | fal.ai、PiAPI、laozhang.ai 等 |
| **原理** | 中間商批量採購 API 額度，提供統一端點 |
| **費用** | 比官方便宜 10-40%（720p \~$0.05/5 秒） |
| **穩定性** | 中 |

### API 適配器設計

```
我們的 SaaS 系統
  ↓
  VideoAPIAdapter（統一介面）
  ├── ReverseAdapter   ← POC 用（Phase 1）
  ├── ThirdPartyAdapter ← 備援
  └── OfficialAdapter   ← Phase 2 正式
```

三條路線輸入輸出一致，換 Adapter 不影響其他程式碼。

---

## 五、Creatomate 詳細分析（線上剪輯 + 雲端渲染引擎）

### 5.1 Creatomate 是什麼？

Creatomate 是一個**影片自動化 API 平台**，專為開發者打造。核心能力：

1. **模板引擎**：用線上編輯器設計影片模板，標記動態欄位，API 帶入資料批量生成
2. **純 JSON 生成**：不用模板，直接用 JSON（RenderScript）描述整支影片的每個元素
3. **JavaScript Preview SDK**：嵌入到我們的網站，讓客戶在瀏覽器內即時預覽和編輯影片
4. **雲端渲染**：AWS 自動擴容，可同時渲染數千支影片

### 5.2 Creatomate 能做到的事情

| 功能 | 說明 | 我們的用法 |
| --- | --- | --- |
| **拼接多段影片** | Stitching：把多個 MP4 合併成一支 | 14 段即夢片段 → 1 支完整影片 |
| **加字幕** | 文字覆蓋層，可自訂字型、顏色、動畫 | 口播字幕 + CTA 文字 |
| **加 Logo 浮水印** | 圖片覆蓋層，固定位置 | 房仲品牌 Logo |
| **加背景音樂** | 音軌合成，可調音量 | Artlist 音樂素材 |
| **轉場效果** | 段落之間的過渡動畫 | 遮蓋即夢段落接縫 |
| **裁切 Trim** | 裁切影片頭尾 | 去掉即夢生成的多餘片段 |
| **縮放 Resize** | 輸出不同比例 | 同一素材 → 9:16 + 16:9 + 1:1 |
| **即時預覽** | JavaScript Preview SDK 瀏覽器內渲染 | 客戶編輯時即時看到效果 |
| **批量生成** | 用 spreadsheet / CSV 帶入資料 | 未來 Phase 2 多物件批量產影片 |
| **ElevenLabs 整合** | 內建 AI 語音生成整合 | 如果 Artlist 語音不夠用的備選 |

### 5.3 Creatomate 自動化 Prompt 模式

Creatomate 的核心是「模板 + 動態替換」：

```javascript
// 步驟 1：在 Creatomate 線上編輯器設計模板
// 標記動態欄位：Hook-Text、Property-Video、CTA-Text、Background-Music 等

// 步驟 2：API 呼叫帶入實際資料
const Creatomate = require('creatomate');
const client = new Creatomate.Client('YOUR_API_KEY');

await client.render({
  templateId: 'REAL_ESTATE_VIDEO_TEMPLATE',
  modifications: {
    // 開場鉤子
    'Hook-Text': '台南東區三房兩廳，每坪只要 28 萬！',
    'Hook-Video': 'https://storage.example.com/jimeng-segment-01.mp4',

    // 物件介紹（多段影片）
    'Property-Video-1': 'https://storage.example.com/jimeng-segment-02.mp4',
    'Property-Video-2': 'https://storage.example.com/jimeng-segment-03.mp4',
    // ... 更多段落

    // 數位人
    'Avatar-Video': 'https://storage.example.com/jimeng-avatar-01.mp4',

    // CTA
    'CTA-Text': '撥打 0912-XXX-XXX 了解更多',
    'CTA-QRCode': 'https://storage.example.com/qrcode.png',

    // 背景音樂
    'Background-Music': 'https://storage.example.com/artlist-bgm.mp3',
    'Background-Music.volume': '30%',

    // Logo
    'Brand-Logo': 'https://storage.example.com/agent-logo.png',
  },
});
```

也可以完全用 JSON（RenderScript）從零組裝：

```javascript
// 不用模板，純 JSON 描述影片結構
await client.render({
  source: {
    output_format: 'mp4',
    width: 1080,
    height: 1920, // 9:16 短影片
    elements: [
      // 第一段：開場鉤子
      {
        type: 'video',
        source: 'https://storage.example.com/jimeng-hook.mp4',
        time: 0,
        duration: 5,
        // 轉場效果
        animations: [{ type: 'fade', duration: 0.5 }]
      },
      // 第二段：物件外觀
      {
        type: 'video',
        source: 'https://storage.example.com/jimeng-exterior.mp4',
        time: 5,
        duration: 15,
        animations: [{ type: 'slide', direction: 'left', duration: 0.3 }]
      },
      // 字幕覆蓋層
      {
        type: 'text',
        text: '近公園、近學區、交通便利',
        time: 5,
        duration: 15,
        y: '85%',
        font_size: 48,
        fill_color: '#FFFFFF',
        background_color: 'rgba(0,0,0,0.6)',
      },
      // 背景音樂（整段）
      {
        type: 'audio',
        source: 'https://storage.example.com/bgm.mp3',
        time: 0,
        duration: 210, // 3.5 分鐘
        volume: '30%',
      },
      // Logo 浮水印（整段）
      {
        type: 'image',
        source: 'https://storage.example.com/logo.png',
        time: 0,
        duration: 210,
        x: '90%',
        y: '5%',
        width: 80,
        height: 80,
      }
    ]
  }
});
```

### 5.4 JavaScript Preview SDK（線上剪輯的核心）

這是讓「一站式」成為可能的關鍵組件：

```javascript
import { Preview } from '@creatomate/preview';

// 初始化預覽器，嵌入到我們的網頁
const preview = new Preview(
  document.getElementById('editor-container'),
  'player',
  'YOUR_VIDEO_PLAYER_TOKEN'
);

// 載入模板
preview.onReady = async () => {
  await preview.loadTemplate('REAL_ESTATE_VIDEO_TEMPLATE');
};

// 客戶修改文字 → 即時更新預覽
await preview.setModifications({
  'Hook-Text': '新的開場文字...',
});

// 客戶滿意後 → 呼叫 API 渲染最終 MP4
// （預覽是瀏覽器渲染，最終 MP4 由雲端渲染）
```

**注意**：Preview SDK 只在桌面瀏覽器上跑（Chrome/Firefox/Edge/Safari），手機不支援即時編輯。但手機上可以查看已渲染好的最終 MP4 成品。

### 5.5 Creatomate 定價（所有幣值為 USD）

| 方案 | 月費 | Credits | 可渲染量 | Preview SDK | 適合 |
| --- | --- | --- | --- | --- | --- |
| **Essential** | $54 | 2,000 | \~550 支 15 秒短影片（720p） | ❌ | 測試 |
| **Growth 10K** | $129 | 10,000 | \~2,750 支 15 秒短影片 | ✅ | Phase 1 |
| **Beyond 50K** | $249+ | 50,000+ | 大量 | ✅ | Phase 2 |

**重要**：Preview SDK（線上即時剪輯功能）需要 **Growth 方案以上**才有。 Essential 方案只有 API 渲染，沒有瀏覽器即時預覽。

Credit 計算公式（以 1080p 25fps 為例）：

- 15 秒影片 ≈ 3.6 credits
- 3.5 分鐘完整影片 ≈ 50.4 credits
- Growth 10K 方案每月可渲染 ≈ **198 支完整 3.5 分鐘影片**

### 5.6 已驗證的實際案例

有用戶反饋：「在 Creatomate 上生成長達 45 分鐘的影片，包含同步音頻、多層背景和動畫轉場——全部透過 JSON 程式化渲染。」

另一個案例整合了 OpenAI API 產文字 + Adobe Stock API 選圖 + Creatomate 渲染影片 + ElevenLabs 配音，完全自動化。這跟我們的架構幾乎一模一樣（Claude API + Artlist + 即夢 + Creatomate）。

---

## 六、Artlist 在本專案的定位

| 用途 | 可行性 | 說明 |
| --- | --- | --- |
| **數位人口播語音** | ✅ 高 | AI Voiceover 支援中文、語音克隆 |
| **背景音樂** | ✅ 高 | royalty-free 音樂庫，商業授權 |
| **B-roll 素材** | ✅ 高 | 影片轉場、空鏡頭素材 |
| **影片生成** | ⚠️ 中 | 有 Seedance 2.0 但無公開 API |

**結論**：Artlist 負責「聲音」和「音樂」，即夢負責「畫面」，Creatomate 負責「組裝 + 剪輯」。

---

## 七、PostGo（InkGo）串接分析

PostGo 是自家的 AI 社群自動發文 SaaS：

- 技術棧：Next.js + Supabase + TypeScript（與本專案統一）
- 透過 Zernio API 支援 14 個社群平台
- 已有：帳號管理、社群串接、排程發文、AI 文案引擎

### 對接方式

```
影片 SaaS（本系統）
  ↓ 產出 MP4 檔案 URL
  ↓ API 呼叫
PostGo
  ↓ 搭配 AI 生成的發文文案
  ↓ Zernio API
14 個社群平台（FB、IG、YouTube、TikTok、Threads...）
```

---

## 八、市場競品分析

### 8.1 國際競品

| 競品 | 腳本 | AI 影片 | 線上剪輯 | 數位人 | 發佈 | 月費 |
| --- | --- | --- | --- | --- | --- | --- |
| **Visla** | ✅ | ✅ | ✅ | ✅ | ✅ | 訂閱制 |
| **BIGVU** | ✅ | ❌ | ✅ | ❌ | ✅ | $12-49 |
| **Reel-E** | ❌ | ✅ | ❌ | ❌ | ❌ | $44+ |
| **AutoReel** | ❌ | ✅ | ❌ | ❌ | ❌ | 訂閱制 |
| **Kapwing** | ✅ | ✅ | ✅ | ❌ | ❌ | 免費起 |
| **FluxNote** | ✅ | ✅ | ❌ | ❌ | ❌ | $9.99 |
| **我們** | ✅ | ✅ | ✅ | ✅ | ✅ | 待定 |

### 8.2 台灣市場

**台灣目前沒有「房仲 AI 影片 + 數位人 + 一站式剪輯 + 自動發佈」的 SaaS 產品。**

### 8.3 我們的差異化

| 維度 | 國際競品 | 我們 |
| --- | --- | --- |
| 數位人臉孔 | 西方為主 | 即夢原生亞洲臉孔 |
| 語言 | 英文為主 | 繁體中文原生 |
| 腳本智能度 | 通用模板 | 結合產品線 A 的物件分析數據 |
| 發佈 | 手動上傳 | PostGo 一鍵 14 平台 |
| 市場 | 歐美 | 台灣房仲垂直市場，零直接競品 |

---

## 九、3.5 分鐘影片結構模板

```
[00:00-00:05] 開場鉤子（Hook）
  數位人口播 + 吸引人的數據/問句
  "你知道台南東區這間三房兩廳，每坪只要 28 萬嗎？"

[00:05-00:10] 品牌開場（Intro）
  標題卡片 + 房仲品牌 + Logo
  轉場效果進入

[00:10-02:10] 物件介紹（Main）— 約 120 秒 = 8 段
  ├── 外觀導覽（15秒 × 2 段）
  ├── 客廳/餐廳（15秒 × 2 段）
  ├── 臥室/浴室（15秒 × 2 段）
  └── 廚房/陽台/環境（15秒 × 2 段）
  * 穿插數位人解說和實景照片

[02:10-02:30] 數據重點卡片（Highlights）
  價格 | 坪數 | 格局 | 交通 | 學區
  資訊卡片動畫呈現

[02:30-03:10] 數位人總結（Summary）
  SWOT 重點 + 推薦理由
  數位人正面口播

[03:10-03:30] CTA（Call to Action）
  數位人 + 聯絡資訊 + QR Code
  "想了解更多？掃描 QR Code 或撥打 0912-XXX-XXX"
```

---

## 十、技術流程（Step by Step）

```
Step 1: 文案生成（Claude API）
  輸入：物件資料 + 照片描述 + 產品線 A 分析數據
  輸出：腳本 JSON（每段台詞、畫面描述、時長、類型）
  ↓
Step 2: 客戶審核
  後台逐段顯示腳本
  客戶可修改文字、調整順序、標記重做
  ↓ 審核通過
Step 3: 語音生成（Artlist AI Voiceover）
  輸入：每段台詞文字
  輸出：每段音頻 MP3/WAV
  ↓
Step 4: 影片片段生成（即夢 API）
  分段任務佇列（14 段）
  數位人段：虛擬角色圖 + 音頻 → 數位人 API
  實景段：物件照片 + prompt → 圖生視頻 API
  每段 5-15 秒，預估生成等待 70-280 分鐘
  ↓
Step 5: 線上輕剪輯（Creatomate Preview SDK）
  瀏覽器內即時預覽
  客戶可：拖拉排序、加字幕、選轉場、加 Logo、調音量
  不滿意的段落 → 一鍵重做（回到 Step 4 單段重生成）
  ↓
Step 6: 雲端渲染（Creatomate API）
  所有素材 + 設定 → JSON → 雲端渲染 → MP4
  同時輸出：9:16 / 16:9 / 1:1 三種比例
  ↓
Step 7: 輸出
  ├── 下載完整 MP4
  ├── 下載各段獨立 15 秒片段
  └── 一鍵發佈 → PostGo → Zernio → 14 個社群平台
```

---

## 十一、成本分析（所有幣值為新台幣 NT$）

### 11.1 Phase 1 成本（客戶自用，月產 30 支影片）

| 項目 | 工具 | 單支成本 | 月成本 |
| --- | --- | --- | --- |
| 腳本生成 | Claude API | \~NT$3 | \~NT$90 |
| 語音生成 | Artlist（客戶已有訂閱） | NT$0 | NT$0 |
| 影片片段生成 | 即夢逆向 API（吃積分） | NT$0 | NT$0 |
| 背景音樂 | Artlist（客戶已有訂閱） | NT$0 | NT$0 |
| 線上剪輯 + 渲染 | Creatomate Growth $129 | \~NT$21 | \~NT$4,193 |
| 社群發佈 | PostGo（自家系統） | NT$0 | NT$0 |
| **Phase 1 合計** |  | **\~NT$24/支** | **\~NT$4,283/月** |

> 注：Creatomate 需 Growth 方案才有 Preview SDK（線上剪輯功能）。 如果不需要線上即時剪輯，用 Essential $54 方案即可（\~NT$1,755/月），但客戶只能看最終成品。

### 11.2 Phase 2 成本（SaaS 化，改用官方 API）

| 項目 | 工具 | 單支成本 | 月成本 |
| --- | --- | --- | --- |
| 腳本生成 | Claude API | \~NT$3 | \~NT$90 |
| 語音生成 | 平台方 TTS | \~NT$5 | \~NT$150 |
| 影片片段生成 | 官方火山引擎 1080p | \~NT$34 | \~NT$1,020 |
| 背景音樂 | Artlist / 授權音樂庫 | 依方案 | 依方案 |
| 線上剪輯 + 渲染 | Creatomate Growth | \~NT$21 | \~NT$4,193 |
| 社群發佈 | PostGo | NT$0 | NT$0 |
| **Phase 2 合計** |  | **\~NT$63/支** | **\~NT$5,453/月** |

### 11.3 商業化定價建議

你說得對，要獲利至少要 Double。以下是定價分析：

| 方案 | 成本基礎 | 建議售價 | 毛利率 | 說明 |
| --- | --- | --- | --- | --- |
| **基本方案** | \~NT$5,453/月 | **NT$4,999/月** | 虧損 | ❌ 不建議 |
| **標準方案** | \~NT$5,453/月 | **NT$9,900/月** | \~45% | ⭕ 勉強可行 |
| **專業方案** | \~NT$5,453/月 | **NT$14,900/月** | \~63% | ✅ 建議售價 |

但更合理的做法是**按支計費 + 基本月費**：

| 定價模式 | 月費 | 每支影片 | 月產 30 支客戶月付 | 毛利率 |
| --- | --- | --- | --- | --- |
| **方案 A** | NT$2,999 基本費 | NT$299/支 | NT$11,969 | \~55% |
| **方案 B** | NT$4,999 基本費（含 10 支） | NT$399/支（超過部分） | NT$12,979 | \~58% |
| **方案 C** | NT$9,900 吃到飽（30 支內） | 含在月費 | NT$9,900 | \~45% |

> 對比國際競品：Visla $26/月（功能類似但無亞洲數位人）、BIGVU $49/月 台灣房仲請攝影師拍 1 支影片 = NT$10,000-30,000 我們的方案：**每支影片 NT$299-499，比請攝影師便宜 20-100 倍**

---

## 十二、技術難點與風險

### 12.1 已確認的技術難點

| \# | 難點 | 嚴重度 | 解法 |
| --- | --- | --- | --- |
| 1 | 即夢逆向 API 不穩定（Session ID 過期、反爬） | 高 | API 適配器模式 + 第三方備援 |
| 2 | 14 段影片生成等待時間長（70-280 分鐘） | 高 | 任務佇列 + 進度通知（Email/LINE） |
| 3 | 段落接縫品質問題 | 中 | Creatomate 轉場效果遮蓋 |
| 4 | 數位人口型同步精度 | 中 | 即夢大師模式 + 手動微調 |
| 5 | Preview SDK 只支援桌面瀏覽器 | 中 | 手機端改為「查看成品」模式 |
| 6 | Artlist 語音生成沒有公開 API | 中 | 改用 ElevenLabs API 或其他 TTS |
| 7 | 影片儲存空間（每支 \~50-200MB） | 低 | Supabase Storage / S3 |

### 12.2 風險矩陣

| 風險 | 可能性 | 影響 | 緩解 |
| --- | --- | --- | --- |
| 即夢封消費者帳號 | 中 | 高 | Phase 1 結束前遷移到官方 API |
| 即夢 API 官方延遲上線 | 中 | 中 | 第三方平台作為過渡 |
| 影片品質不符客戶預期 | 中 | 高 | POC 先做 1 支完整樣片驗證 |
| Creatomate 渲染失敗 | 低 | 中 | 重試機制 + 降級為 FFmpeg |
| 生成等待時間太長 | 高 | 中 | 分段並行生成 + 即時通知 |

---

## 十三、TDD 測試策略

### 13.1 需要測試的模組

**1. 腳本生成引擎**

- 給定物件資料 → 驗證腳本 JSON 結構正確
- 驗證每段時長加總 = 3.5 分鐘 ±10 秒
- 驗證包含三段結構（Hook + Main + CTA）
- 驗證 prompt 模板變數替換正確

**2. 影片任務佇列**

- 給定 14 段任務 → 驗證佇列正確排序
- 模擬 API 成功 → 驗證狀態更新
- 模擬 API 失敗 → 驗證重試（最多 3 次）
- 模擬超時 → 驗證降級處理

**3. Creatomate 渲染引擎**

- 給定 N 個 MP4 URL → 驗證 RenderScript JSON 正確
- 驗證轉場效果插入正確位置
- 驗證背景音樂時長 = 影片時長
- 驗證字幕時間軸對齊

**4. 即夢 API 適配器**（Mock 測試）

- 驗證 Session ID 認證流程
- 驗證提交 → 輪詢 → 下載三步流程
- 驗證積分不足的錯誤處理
- 驗證 Session 過期的重新認證

**5. 審核狀態機**

- 草稿 → 審核中 → 已通過 → 生成中 → 完成
- 單段重做不影響其他段
- 客戶修改後重新生成

### 13.2 不需要測試的

- AI 文案品質（人工判斷）
- 即夢影片畫面品質（無法程式化驗證）
- prompt 措辭（持續迭代）

---

## 十四、技術架構

```
前端：Next.js + Creatomate Preview SDK（與產品線 A、PostGo 統一）
後端：Next.js API Routes
資料庫：Supabase（PostgreSQL + Auth + Storage）
AI 文案：Claude API
AI 語音：Artlist AI Voiceover（手動）/ ElevenLabs API（自動化備選）
AI 影片：即夢 API（Phase 1 逆向 / Phase 2 官方）
影片組裝：Creatomate API + Preview SDK
任務佇列：Trigger.dev 或 Inngest
社群發佈：PostGo → Zernio API
部署：Vercel + Supabase
```

---

## 十五、開發排程估算

| 週次 | 內容 | 交付物 |
| --- | --- | --- |
| 1 | 技術驗證 POC：即夢 API 串接 + 單段影片生成 + Creatomate 基本渲染 | Demo 影片 |
| 2 | 腳本引擎 + 審核流程 + 後台 UI | 腳本生成 + 審核頁面 |
| 3-4 | 影片生成佇列 + 數位人 + 14 段完整流程 | 完整生成流程 |
| 5 | Creatomate 線上剪輯器整合 | 一站式剪輯功能 |
| 6 | PostGo 對接 + 社群發佈 | 一鍵發佈 |
| 7-8 | 測試 + Bug 修復 + 客戶驗收 | 上線 |

---

## 十六、待客戶確認事項

| \# | 問題 | 影響 | 急迫度 |
| --- | --- | --- | --- |
| 1 | 即夢帳號是中國版還是國際版？ | 中國版功能完整 | 🔴 高 |
| 2 | 願意註冊火山引擎企業帳號嗎？（Phase 2 需要） | SaaS 化前提 | 🟡 中 |
| 3 | 數位人虛擬角色已經有了嗎？需要幾個？ | 角色一致性設計 | 🔴 高 |
| 4 | 每月預估產出幾支影片？ | 影響成本方案選擇 | 🔴 高 |
| 5 | 3.5 分鐘是硬性要求還是可彈性？ | 段數和成本 | 🟡 中 |
| 6 | Artlist 方案是哪個層級？有語音克隆功能嗎？ | 語音方案選擇 | 🟡 中 |
| 7 | 影片需要哪些格式？（9:16 / 16:9 / 1:1） | Creatomate 渲染次數 | 🟢 低 |
| 8 | 轉場風格偏好？ | 模板設計 | 🟢 低 |
| 9 | 線上剪輯是必要功能嗎？（影響成本：$54 vs $129/月） | Creatomate 方案選擇 | 🔴 高 |
| 10 | 能接受 70-280 分鐘的影片生成等待時間嗎？ | UX 設計 | 🔴 高 |

---

## 十七、文件索引

| 文件 | 說明 |
| --- | --- |
| `docs/PRD.md` | 產品線 A PRD |
| `docs/product-b-video-spec.md` | **本文件（產品線 B 完整規劃 Spec）** |
| `docs/discovery/19-產品規劃-兩條產品線與開發排程.md` | 產品線 A+B 規劃 |
| `docs/discovery/21-最終產品規格-PRD前定稿.md` | 產品線 A 最終規格 |
