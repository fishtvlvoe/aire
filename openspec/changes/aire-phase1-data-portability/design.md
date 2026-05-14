## Context

AIRE Phase 1 桌面 App 採 sqlcipher 全資料庫加密保護屋主個資（含姓名 / 身分證 / 地號）。目前加密 key 是 OS keychain 派生，沒有客戶可讀的「主密碼」概念，導致：(1) 客戶換電腦時無法搬移資料（key 綁 OS）；(2) 客戶無法重新生成或備份加密狀態；(3) 個資法 / 不動產經紀業管理條例對「資料外洩 + 業務連續性」雙重要求，現狀只滿足前者、不滿足後者。

本 change 把 sqlcipher 加密 key 的來源改為「客戶主密碼派生」，並補上「.aire 加密備份檔」與「救援碼機制」兩條救命繩。

利害關係人：客戶老闆（設密碼 / 持救援碼）、客戶助理（解鎖日常使用）、Fish（決定密碼學參數與 SOP）、未來的 OPCOS 客服（指引救援流程）。

## Goals / Non-Goals

**Goals:**

- 客戶在主密碼正確的前提下，可在另一台電腦匯入 .aire 並繼續使用
- 主密碼純記憶體、不存盤；救援碼一次性顯示後不存盤
- 救援碼能單獨重置主密碼（不需要舊主密碼），但無法解開資料以外的東西
- 衝突偵測明確（重複案件 → 使用者選覆蓋 / 保留新版 / 跳過）
- 客戶看得懂 SOP：4 種情境（備份 / 換機匯入 / 忘記密碼 / 救援碼也丟了）

**Non-Goals:**

- 雲端備份、跨機自動同步、即時 sync（單機買斷制範圍外）
- Vendor key escrow / 後門救援（明確告知「救援碼也丟 = 資料永久鎖死」）
- 主密碼變更後重新加密歷史 .aire 備份
- Argon2id 參數使用者調整（鎖定 OWASP 推薦）
- 救援碼採其他形式（24 字 Base32 / 4 位數字）— 已採 12 BIP39 單字定案
- Phase 1 不做主密碼複雜度提示（如「密碼太弱」分數），只做最低 8 字元檢查

## Decisions

### Decision 1: 主密碼派生採 Argon2id（非 scrypt / PBKDF2）

採 Argon2id，OWASP 推薦參數 `m_cost=19456 (19MiB), t_cost=2, p_cost=1`，輸出 32 bytes 作為 sqlcipher PRAGMA key。

替代方案：

- scrypt：抗 ASIC 效果不如 Argon2，且現代密碼學社群已建議 Argon2 為新專案首選
- PBKDF2-SHA256：iteration count 需 600k+ 才達同等成本，CPU-only 抗 GPU 弱
- bcrypt：72 byte 輸入截斷限制，不適合派生 32 byte key

理由：Argon2id 同時抗 GPU + 抗 side-channel，OWASP / IETF RFC 9106 建議。OWASP 參數在主流桌面 CPU（含客戶常用的 i5-8 代以上）解鎖時間 < 1s，不影響使用體驗。

### Decision 2: `.aire` 檔格式採 ZIP 容器（非自訂二進位格式）

`.aire` = 標準 ZIP，內含三個檔案：

- `db.sqlite`（已被 sqlcipher 加密的整個 SQLite 檔，bytes-for-bytes 複製）
- `meta.json`（version、export_timestamp、source_machine_id、case_count、schema_version）
- `checksum.sha256`（`db.sqlite` + `meta.json` 的 SHA-256，避免傳輸毀損）

替代方案：

- 自訂 binary frame format：實作成本高、未來工具支援差、debug 時無法用 unzip 看內容
- tar.gz：壓縮 sqlcipher 已加密資料效益極小（高熵），且 Windows 客戶不熟悉 tar
- 純複製 `.db` 檔：缺 metadata / checksum，無法做版本檢查與毀損偵測

理由：ZIP 跨平台、Windows / macOS 內建支援、debug 時可解開看 meta.json，不暴露加密資料（sqlcipher 已加密）。

### Decision 3: 救援碼採 BIP39 wordlist 12 個英文單字（非數字 / Base32）

12 個 BIP39 英文單字 = 128-bit entropy，符合 NIST SP 800-63B 高安全等級。Wordlist 為 BIP39 官方英文版本（2048 字、加密貨幣產業驗證 10 年以上）。

替代方案：

- 24 字 Base32（如 `ABCD-EFGH-...`）：較短但易抄錯（B/8、O/0 視覺混淆）
- 8 組 4 位數字（如 `1234-5678-...`）：106-bit entropy 較弱、抄錯率高
- 自訂中文成語表：本地化但 entropy 與工具支援差，且 wordlist 不夠長

理由：BIP39 單字易讀易抄、唸錯率低（無相似拼寫對）、客戶就算抄錯也容易被 wordlist 校驗發現。entropy 128-bit 高過實務暴力破解門檻。

### Decision 4: 救援碼派生第二把 key、雙路解鎖（非「救援碼解出主密碼」）

主密碼派生 key_master，救援碼派生 key_recovery，**兩把 key 都存「同一份 sqlcipher key 的雙重加密包裝」**：

- 隨機生成 sqlcipher_key（32 bytes）
- `vault_master = AES-GCM-encrypt(sqlcipher_key, key_master)` 存 keystore.json
- `vault_recovery = AES-GCM-encrypt(sqlcipher_key, key_recovery)` 存 keystore.json
- 解鎖時任一把 key 解 vault 拿到 sqlcipher_key

替代方案：

- 用救援碼直接解出主密碼明文：救援碼洩漏 = 主密碼洩漏，破壞分離原則
- 救援碼派生獨立 sqlcipher_key、雙重加密 DB：DB 改寫量大、不可逆

理由：sqlcipher 的 PRAGMA key 必須單一，雙包裝 sqlcipher_key 是業界標準（如 1Password、Bitwarden）。救援碼洩漏只能解 vault，無法回推主密碼。

### Decision 5: 匯入衝突採「逐筆使用者選擇」（非全域策略）

匯入時偵測 `case_id` 衝突，**逐筆**彈窗讓使用者選：

- 覆蓋（用匯入版本取代本機版本）
- 保留新版本（看 `updated_at` 較新者勝）
- 跳過（保留本機版本）
- 全部套用此選擇（避免衝突過多時逐筆煩躁）

替代方案：

- 全域單一策略（全覆蓋 / 全跳過）：使用者無控制力、誤操作後無 undo
- Three-way merge：實作複雜、案件資料無原始共同祖先

理由：客戶情境通常衝突 < 5 筆（少數重疊案件），逐筆問可控；「全部套用此選擇」按鈕滿足大量衝突情境。

### Decision 6: 首次設定主密碼強制顯示救援碼且必須使用者確認 3 個動作

首次設定主密碼後，UI 強制 modal 顯示救援碼，必須完成以下 3 動作才能關閉：

- 點擊「列印」按鈕（叫 OS 列印對話框）
- 點擊「下載 PDF 副本」按鈕（生成救援碼 PDF 存使用者選的位置）
- 勾選「我已將救援碼保存於實體保險箱 / 安全位置」確認框

替代方案：

- 只顯示一次、按關閉就消失：客戶遺漏概率高
- 自動列印不問：使用者可能沒接印表機、體驗差
- 強制截圖：無法驗證，且截圖等於存在電腦上違背安全意圖

理由：3 個動作降低「客戶忽略救援碼」的概率到接近 0；保險箱勾選選項用文字提示「救援碼遺失 = 資料永久無法救援」，符合不動產業客戶對紙本管理的習慣。

### Decision 7: UI 設計系統 — 與 OPCOS 共用視覺 token

依 OPCOS 系產品規範（lessons.md L070），本 change 新增的 UI 元件（MasterPasswordPrompt、RecoveryCodeReset、ImportConflictDialog 等）共用 OPCOS design tokens（色彩 / 間距 / 字級）、icon 統一 lucide-react、字型 Noto Sans TC + Inter。

替代方案：

- 各元件獨立樣式：未來 App B/C 視覺不一致
- 借用第三方 UI Kit（如 shadcn 直接套）：跟 OPCOS 既有風格脫鉤

理由：本 change 的對話框（解鎖 / 救援 / 衝突）將成為未來 OPCOS 全系 App 的標準範本，必須對齊統一視覺。

### Decision 8: UX 互動模式 — 與 OPCOS 共用行為規則

依 OPCOS 系產品規範（lessons.md L070），本 change 的關鍵互動點遵守 OPCOS 共用 UX patterns：

- 救援碼 modal 為「強制阻塞型」（不能 Esc / 點外面關閉），符合 OPCOS 高風險動作確認規則
- 主密碼欄位採 OPCOS 統一錯誤訊息文案（「主密碼錯誤，請再試一次」非「Invalid password」）
- 匯入流程的 loading 階段採 OPCOS 三態 UI（loading / empty / error）標準
- 衝突 dialog 的「全部套用此選擇」遵守 OPCOS 二次確認（高破壞性動作必須二次確認）

替代方案：

- 各 dialog 自由設計：與未來 OPCOS App 行為不一致、客戶切換時困惑
- 完全跟隨平台預設（如 Tauri dialog）：缺乏可控的 UX 細節

理由：OPCOS 系所有 App 的客戶可能是同一群人（不動產仲介），互動模式統一可降低學習成本。

## Implementation Contract

**Behavior:**

- 客戶可在「設定 → 主密碼」首次設定主密碼，系統生成 12 字救援碼並強制經 3 動作（列印 / 下載 PDF / 勾選保險箱確認）才能關閉
- 客戶可在「設定 → 備份」匯出 `.aire` 檔（內含全部案件）；案件詳情頁可匯出單一案件的 `.aire`
- 客戶在另一台機器點開 `.aire` → 系統要求輸入主密碼 → 解鎖後進入衝突偵測流程
- 客戶忘記主密碼 → 「忘記主密碼」連結 → 輸入救援碼 → 設定新主密碼 → 救援碼一次性失效（生成新救援碼）
- 救援碼也遺失 → 系統明確告知「資料永久無法救援」，不提供任何後門

**Interface / data shape:**

- `keystore.json`（位置：app local data dir / `keystore.json`）：
  ```json
  {
    "version": 1,
    "vault_master": { "salt": "<base64 16 bytes>", "nonce": "<base64 12 bytes>", "ciphertext": "<base64>" },
    "vault_recovery": { "salt": "<base64 16 bytes>", "nonce": "<base64 12 bytes>", "ciphertext": "<base64>" },
    "argon2_params": { "m_cost": 19456, "t_cost": 2, "p_cost": 1 },
    "created_at": "<ISO 8601>"
  }
  ```
- `.aire` 檔內容（ZIP）：`db.sqlite` + `meta.json` + `checksum.sha256`
- `meta.json`：
  ```json
  {
    "format_version": 1,
    "exported_at": "<ISO 8601>",
    "source_machine_id": "<sha256 of machine fingerprint>",
    "case_count": <int>,
    "schema_version": <int>
  }
  ```
- Tauri IPC commands:
  - `set_master_password(password: String) -> Result<RecoveryCode, Error>`
  - `unlock_with_master_password(password: String) -> Result<(), UnlockError>`
  - `unlock_with_recovery_code(code: String) -> Result<(), UnlockError>`
  - `reset_master_password(recovery_code: String, new_password: String) -> Result<RecoveryCode, Error>`
  - `export_aire(scope: ExportScope, output_path: String) -> Result<ExportResult, Error>`
  - `import_aire(file_path: String, master_password: String) -> Result<Vec<ConflictItem>, ImportError>`
  - `resolve_import_conflict(item_id: String, action: ConflictAction) -> Result<(), Error>`

**Failure modes:**

- 主密碼錯誤 → `UnlockError::WrongPassword`，UI 顯示「主密碼錯誤，請再試一次」
- 救援碼格式錯（非 12 字 / 非 BIP39 字）→ `UnlockError::InvalidRecoveryCodeFormat`，UI 提示哪一字不在 wordlist
- 救援碼正確格式但解不開 vault → `UnlockError::WrongRecoveryCode`，UI 顯示「救援碼錯誤」
- `.aire` checksum 不符 → `ImportError::CorruptedFile`，UI 顯示「備份檔損毀，請重新匯出」
- `.aire` schema_version > 本機版本 → `ImportError::IncompatibleSchema`，UI 顯示「備份檔來自較新版本 AIRE，請升級後再試」
- 匯出磁碟空間不足 → `ExportError::InsufficientDiskSpace`，UI 顯示需要的空間 vs 實際剩餘

**Acceptance criteria:**

- `cargo test --package data_portability` 全綠（含密碼派生 / vault 加解密 / .aire 封解包 / 衝突偵測單元測試）
- `cargo test --package crypto::master_password` Argon2id 派生輸入相同密碼 + salt 必輸出相同 32 bytes
- E2E：在 macOS 機器匯出 → 複製 .aire 到 Windows 機器 → 匯入 → 解鎖 → 案件數一致 + 任一案件內容 byte-for-byte 一致（透過 SQL `SELECT *` 比對）
- E2E：忘記主密碼 → 輸入救援碼 → 設新主密碼 → 用新主密碼解鎖成功 + 舊主密碼解鎖失敗 + 舊救援碼解鎖失敗
- 救援碼 modal 顯示後，未完成 3 動作 → 關閉按鈕為 disabled 狀態（透過 Playwright DOM 斷言驗證）

**Scope boundaries:**

- **In scope**: 主密碼設定 / 解鎖 / 重置流程；救援碼生成 / 列印 / 重置流程；.aire 匯出 / 匯入 / 衝突處理；客戶 SOP 文件
- **Out of scope**: 雲端備份；跨機自動同步；主密碼複雜度評分；救援碼托管；匯入時的 schema migration（要求版本相同才能匯入）；多人協作匯出檔合併

## Risks / Trade-offs

- **救援碼遺失 = 資料永久鎖死** → Mitigation: 首次設定時 3 動作強制 + SOP 文件第一頁紅字警示 + UI 不斷提醒「救援碼是最後一道防線」
- **使用者用弱主密碼（如 12345678）** → Mitigation: Phase 1 只做最低 8 字元檢查（Non-Goal 範圍）；Phase 2 評估加密碼強度提示
- **Argon2id 在客戶老電腦解鎖太慢** → Mitigation: 19MiB / t=2 在 i3-7 代測試 < 2s，可接受；若收到客訴再評估降參數
- **匯出時 SQLite 正在寫入導致 .aire 損毀** → Mitigation: 匯出前 `BEGIN IMMEDIATE` 取得寫鎖、複製 db.sqlite 後 `ROLLBACK`，避免短時讀取與寫入交錯
- **客戶用第三方解壓工具開 .aire 看到 meta.json** → Mitigation: meta.json 不含敏感資料（無屋主資訊、無案件內容），只有計數與時戳
- **救援碼列印 PDF 被印表機 spool 留下殘檔** → Mitigation: SOP 文件提示「列印後務必清空印表機列印佇列」，本 change 不負責清 spool（OS 範圍）

## Migration Plan

**部署：**

1. 升級 .aire change 的 binary 後，首次啟動偵測 `keystore.json` 不存在
2. 強制引導使用者設定主密碼（不能跳過，現有客戶資料用既有 OS keychain 派生 key 解開後再用主密碼派生 key 重新加密）
3. 完成首次設定 + 救援碼確認後恢復正常使用流程

**現有資料移轉：**

- 升級腳本：用既有 OS keychain key 解開 SQLite → 用新 sqlcipher_key 重新 PRAGMA rekey → 同步寫入 keystore.json
- 完成後刪除 OS keychain 舊 key 條目

**Rollback：**

- 升級失敗 → 自動還原備份的 SQLite + 刪除新生成的 keystore.json
- 升級成功後若客戶想 downgrade → 不支援（新 .aire 格式 + sqlcipher_key 無法用舊 binary 解）

## Open Questions

- 主密碼解鎖失敗的速率限制策略：是否要 3 次失敗鎖 1 分鐘？Phase 1 暫不做、待真實使用回饋
- 救援碼列印 PDF 是否要附 QR Code（方便重新輸入）：增加實作複雜度、可能洩漏（QR 易被拍照），暫不做
- macOS 沙盒模式下 keystore.json 寫入 app local data dir 是否需要使用者授權：實作時確認
