## Why

AIRE 桌面 App 的 SQLite 全 sqlcipher 加密保護屋主個資，但目前缺三個關鍵能力：(1) 客戶換電腦或硬碟損毀時無法搬移資料；(2) 加密 key 與 OS / 帳號綁死，主密碼遺忘等於資料永久鎖死；(3) 客戶不知道遺忘密碼後該怎麼救。本 change 補完 Phase 1 的資料可攜性與災難復原最後一塊，避免客戶實際使用時的資料風險（個資法 + 業務連續性）。

## What Changes

- 新增 `.aire` 加密備份檔格式：zip 內含加密 SQLite + version meta + checksum，可跨機匯出 / 匯入
- 新增主密碼派生機制：用客戶設定的主密碼透過 Argon2id（OWASP 推薦 m=19MiB, t=2, p=1）派生 sqlcipher key，主密碼與救援碼皆未存盤
- 新增救援碼機制：首次設定主密碼時生成 12 個英文單字（BIP39 wordlist，128-bit entropy），首次強制列印 / 截圖、忘記主密碼時可重置
- 新增匯出按鈕：設定頁「全部案件」+ 案件詳情頁「單一案件」兩個入口
- 新增匯入流程：偵測 .aire 檔、要求主密碼解鎖、衝突偵測 UI（重複案件 ID 選覆蓋 / 新版本 / 跳過）
- 新增 `docs/data-recovery-guide.md` 客戶 SOP：如何備份、如何匯入、忘記密碼怎麼辦、救援碼丟了的限制提示

## Non-Goals

- 雲端備份 / 跨機自動同步（Phase 1 桌面 App 範圍外，不送任何客戶資料上雲）
- 多人協作 / 共享匯出檔（單機買斷制，每店各自管自己的資料）
- 主密碼變更時自動重新加密歷史備份檔（舊 .aire 仍用舊主密碼解，使用者自行管理）
- 救援碼遺失救援（明確告知客戶這個限制，不做後門 / Vendor key escrow）
- 救援碼用其他形式（如 24 字 Base32 / 4 位數字）— 已採 12 BIP39 單字定案
- Argon2id 參數客製化（鎖定 OWASP 推薦值，不開放使用者調整）

## Capabilities

### New Capabilities

- `data-export-import`: `.aire` 加密備份檔的匯出 / 匯入流程與衝突處理
- `master-password-key-derivation`: 主密碼透過 Argon2id 派生 sqlcipher 加密 key 的演算法與儲存規則
- `recovery-code-mechanism`: 救援碼生成、首次強制保存、重置主密碼的完整流程
- `data-recovery-guide`: 客戶面 SOP 文件（備份 / 匯入 / 忘記密碼 / 限制告知）

### Modified Capabilities

(none)

## Impact

- Affected specs:
  - New: `data-export-import`, `master-password-key-derivation`, `recovery-code-mechanism`, `data-recovery-guide`
- Affected code:
  - New:
    - `src-tauri/src/data_portability/mod.rs`（匯出 / 匯入 entry）
    - `src-tauri/src/data_portability/aire_format.rs`（zip 封包格式與 checksum）
    - `src-tauri/src/data_portability/conflict.rs`（匯入衝突偵測）
    - `src-tauri/src/crypto/master_password.rs`（Argon2id 派生）
    - `src-tauri/src/crypto/recovery_code.rs`（BIP39 12 字生成 + 重置）
    - `src/app/(dashboard)/settings/backup/page.tsx`（設定頁匯出 / 匯入 UI）
    - `src/app/(dashboard)/settings/master-password/page.tsx`（首次設定 + 救援碼列印）
    - `src/components/MasterPasswordPrompt.tsx`（解鎖對話框）
    - `src/components/RecoveryCodeReset.tsx`（救援碼重置 UI）
    - `src/components/ImportConflictDialog.tsx`（衝突處理 UI）
    - `docs/data-recovery-guide.md`（客戶 SOP）
    - `src-tauri/src/data_portability/tests.rs`（單元測試）
    - `e2e/data-portability.spec.ts`（換機 E2E）
  - Modified:
    - `src-tauri/src/db/mod.rs`（接 sqlcipher key from master_password 模組）
    - `src/app/(dashboard)/cases/[id]/page.tsx`（加單案匯出按鈕）
    - `src-tauri/Cargo.toml`（新增 `argon2`, `zip`, `bip39`, `sha2` crate）
- Dependencies 新增（Cargo）:
  - `argon2` ^0.5（password hashing）
  - `zip` ^2.x（.aire 封包）
  - `bip39` ^2.x（救援碼 wordlist）
  - `sha2` ^0.10（checksum）
- 環境變數新增：無（主密碼純記憶體 + 救援碼純使用者保管）
