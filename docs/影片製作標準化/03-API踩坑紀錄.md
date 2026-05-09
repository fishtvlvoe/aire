# API 踩坑紀錄

> 持續更新，每次踩坑都加一條

---

## 2026-04-02

### 1. Kling O3 最低 duration 是 3 秒
- `duration: '2'` → 422 Unprocessable Entity
- 最低要 `duration: '3'`，建議用 `'5'`

### 2. aspect_ratio 參數在 image-to-video 不生效
- `aspect_ratio: "9:16"` 帶了但輸出還是 2:3（784x1176）
- 原因：image-to-video 的輸出尺寸由輸入圖決定
- 解法：FFmpeg 後製裁切 `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920`

### 3. Motion Control 只允許參考影片裡有 1 個人
- 錯誤：`Too many subjects detected in the video; please ensure there are no more than 1 clear subjects`
- 如果參考影片有多人，需要先裁切成只有一個人

### 4. Reference-to-Video 不加 Element Binding 會換臉
- Reference-to-Video 會把參考影片裡的人臉混進去
- 必須同時加 Element Binding（`elements` 參數）才能鎖住臉
- elements 裡要用 `frontal_image_url` + `reference_image_urls`（不是 `image_url` + `reference_images`）

### 5. Reference-to-Video 的 element 最多 3 張參考照
- image-to-video 可以 5-10 張
- reference-to-video 最多 3 張
- 選最重要的 3 張：neutral + warm + serious

### 6. Motion Control 的參數名稱
- 要用 `video_url`（不是 `reference_video_url`）
- 必須加 `character_orientation: 'video'`

### 7. 表情控制：反向指令無效
- `NO masseter tension`、`NO jaw clenching` → Kling 會忽略
- 正向描述效果更好：`relaxed jaw, gentle lip movement`
- 最佳做法：完全不給表情指令，讓角色自然表現（v6 結論）

### 8. 色調無法純靠 prompt 控制
- `Cool blue cinematic tone` 寫在 prompt 裡，Kling 不一定會遵守
- 必須用 FFmpeg 後製調色才能保證一致
- colorFilter：`colorbalance=rs=-0.15:gs=-0.05:bs=0.15:rm=-0.1:gm=0:bm=0.1:rh=-0.08:gh=0:bh=0.08,eq=saturation=0.85:brightness=0.05:contrast=1.05`

### 9. voiceDesc 必須獨立一層
- 表情跟著聲音語氣走，不是跟著表情描述走
- voiceDesc 放在台詞前面，Kling 會配合語氣調整臉部表情
- 這是讓表情自然的關鍵

## 2026-04-03

### 10. Reference-to-Video 必須加 aspect_ratio
- 不加 `aspect_ratio: "9:16"` → Kling 預設輸出 2:3（784x1176）
- FFmpeg 強制裁切成 9:16 會裁掉半張臉（v12 踩坑）
- **必須帶 `aspect_ratio: "9:16"`**，讓 Kling 直接輸出正確比例

### 11. Element Binding + voice_id 同時用會衝突
- Reference-to-Video 加了 Element Binding（frontal_image_url + reference_image_urls）→ 臉對了但聲音跑掉
- 不加 Element Binding → 聲音對了但臉跑掉
- 解法 A（已驗證 OK）：4 步驟（image-to-video 取聲音 + Reference-to-Video 取表情 + LipSync 修嘴型 + FFmpeg 調色）
- 解法 B（待驗證）：Element 用 video_url 綁定臉+聲音，不分開傳

### 12. Element 的 video_url 模式
- Element 可以用影片取代圖片組（`video_url` 取代 `frontal_image_url` + `reference_image_urls`）
- v12 測試時因為沒加 aspect_ratio 導致裁切問題，需要重測
- 影片做為 Element 時，Kling 會提取臉部+聲音 DNA

### 13. LipSync API 格式限制
- 不接受 m4a 格式 → 要先轉 mp3
- 影片輸入限制 2-10 秒、720-1920px、≤100MB
- 音頻輸入限制 ≤5MB、2-60 秒

### 14. 定妝照表情影響 Kling 輸出
- 帶微笑的定妝照 → Kling 會在微笑基礎上加碼 → 表情過度
- 無笑容定妝照 → Kling 從零開始 → 表情自然
- 建議：預設用無笑容版定妝照

### 15. prompt 和 multi_prompt 二擇一
- 不能同時用
- prompt：單一鏡頭
- multi_prompt：多鏡頭，每段各自的提示詞和時長

### 16. 表情控制終極解法：明星偶包 prompt（v14 驗證）
- 不要用技術描述控制表情（relaxed jaw、neutral face 等都效果有限）
- 告訴 Kling 角色的身份：「famous actress known for her cool composed image, always maintains her idol persona」
- Kling 理解「明星有偶包」→ 自動收斂表情、優雅克制
- 關鍵詞：celebrity, idol persona, poised, elegant, restrained, Korean drama lead actress, luxury brand commercial
- 這是所有版本中表情最自然的（v14 = 完美）

### 17. 原始影片必須保留
- 每次生成的原始影片（raw）不要刪除
- 保留原始檔才能回溯問題、重新後製
- 存放位置：videogo/output/raw/{日期時間}_{描述}.mp4

### 18. 輸入圖片比例決定輸出影片比例（O3 image-to-video）
- Kling O3 的 `aspect_ratio` 參數在 image-to-video 模式下**不會覆蓋輸入圖片的比例**
- 輸入橫式圖片（16:9）→ 輸出橫式影片，即使 aspect_ratio 設 "9:16" 也沒用
- **正確做法**：先用 FFmpeg 把輸入圖裁成目標比例再餵 API
  - 直式：`ffmpeg -y -i input.jpg -vf "crop=寬:高:x:y,scale=1080:1920" output.jpg`
  - 橫式：`ffmpeg -y -i input.jpg -vf "crop=寬:高:x:y,scale=1920:1080" output.jpg`
- 踩坑場景：用橫式大頭照 + aspect_ratio:"9:16" → 輸出仍為橫式，浪費一次 Pro 生成費用
