# Phase 4 Kimi CR Report — aire-phase1-data-portability

Date: 2026-05-14T08:29:33Z
Paths reviewed: src-tauri/src/data_portability src-tauri/src/crypto src/components/RecoveryCodeModal.tsx src/components/MasterPasswordPrompt.tsx src/components/ImportConflictDialog.tsx

## correctness lens
```
• 用戶要求對特定路徑的程式碼做 correctness 審查，範圍包括：

  1. src-tauri/src/data_portability
  2. src-tauri/src/crypto
  3. src/components/RecoveryCodeModal.tsx
  4. src/components/MasterPasswordPrompt.tsx
  5. src/components/ImportConflictDialog.tsx

  審查重點：

  • 邏輯錯誤 / 邊界條件 / 型別誤用
  • unwrap/panic 在 production code
  • Result/Option 處理是否完整
  • lifetime / borrow checker 邊界
  • async/await 死鎖、未 await 的 Future

  我需要先讀取這些檔案的內容，然後進行分析。先找出所有相關檔案。

• Used Glob (src-tauri/src/data_portability/**/*.rs)

• Used Glob (src-tauri/src/crypto/**/*.rs)

• Used ReadFile (src/components/RecoveryCodeModal.tsx)
  File not found

• Used ReadFile (src/components/MasterPasswordPrompt.tsx)
  File not found

• Used ReadFile (src/components/ImportConflictDialog.tsx)
  File not found

• React 組件檔案不存在於指定路徑，我需要搜尋這些檔案的實際位置。同時我需要讀取 R
  ust 檔案的內容。

• Used Grep (RecoveryCodeModal)

• Used Grep (MasterPasswordPrompt)

• Used Grep (ImportConflictDialog)

• Used ReadFile (src-tauri/src/data_portability/mod.rs)

• Used ReadFile (src-tauri/src/data_portability/aire_format.rs)

• Used ReadFile (src-tauri/src/data_portability/conflict.rs)

• 繼續讀取剩餘的 Rust 檔案和 React 組件檔案。

• Used ReadFile (src-tauri/src/data_portability/export.rs)

• Used ReadFile (src-tauri/src/data_portability/import.rs)

• Used ReadFile (src-tauri/src/crypto/mod.rs)

• Used ReadFile (src-tauri/src/crypto/master_password.rs)

• Used ReadFile (src-tauri/src/crypto/recovery_code.rs)

• 繼續讀取剩餘的 Rust 檔案和 React 組件檔案。

• Used ReadFile (src-tauri/src/crypto/vault.rs)

• Used ReadFile (src/components/ux/RecoveryCodeModal.tsx)

• Used ReadFile (src/components/ux/MasterPasswordPrompt.tsx)

• Used ReadFile (src/components/ux/ImportConflictDialog.tsx)

• 現在我已經讀取了所有相關檔案。讓我仔細審查每個檔案，尋找用戶指定的問題類型：

  1. 邏輯錯誤 / 邊界條件 / 型別誤用
  2. unwrap/panic 在 production code
  3. Result/Option 處理是否完整
  4. lifetime / borrow checker 邊界
  5. async/await 死鎖、未 await 的 Future

  讓我逐一分析：

  src-tauri/src/data_portability/aire_format.rs

  • L114-127: file_names() 返回 impl Iterator<Item = String>，內部使用 match Zip
    chive::new(Cursor::new(&self.bytes))。這裡 ZipArchive::new 需要 Cursor 實現
    ad + Seek，而 &self.bytes 的 lifetime 與返回的 iterator 綁定。但 impl Iterat
    的返回類型會捕獲 self 的 lifetime，這裡應該是安全的，因為 names 被具體化為 V
    <String>。不過這裡的 Vec::new().into_iter() 創建了一個空 Vec，也是安全的。
  • L227-232: has_entry 函數永遠返回 true，這是一個邏輯問題。db_bytes.is_empty()
    & !has_entry(...) 永遠是 false（因為 !has_entry 永遠是 false），所以 db_byte
    is_empty() 不會被檢查到。這是一個邊界條件漏洞：如果 archive 中有 db.sqlite
    內容為空，db_bytes.is_empty() 為 true，但 has_entry 永遠返回 true，所以不會
    錯。但如果 archive 中沒有 db.sqlite，db_bytes 為空且 has_entry 返回 true...
    等，讓我重新看。
    實際上 has_entry 被標註為「zip::ZipArchive doesn't allow querying names with
    t mutable access; we already iterated. Presence checks above are sufficient
    r tests.」並且永遠返回 true。
    這意味著：
    • L227: if db_bytes.is_empty() && !has_entry(&zip, ARCHIVE_DB_FILENAME) - 因
      as_entry 永遠返回 true，!has_entry 永遠是 false，所以這個條件永遠不會觸發
      使 db.sqlite 不存在（db_bytes 為空），也不會報錯。
    • 但等一下，如果 db.sqlite 不存在，迴圈不會匹配到 ARCHIVE_DB_FILENAME，db_by
      會是空的。理論上應該報錯，但由於 has_entry 永遠返回 true，這個檢查被繞過了
    • 然而 L229 後面還有 if meta_json.is_empty() && !has_entry(...) 同樣的問題。
    • 這是一個 Critical 邏輯錯誤：缺失的檔案不會被檢測到。
  • L95: let _ = std::fs::remove_file(&temp_path); - 忽略錯誤，這在測試輔助函數
    ，但仍是潛在問題。

  src-tauri/src/data_portability/export.rs

  • L44-49: ExportLock::try_acquire 使用 Mutex::try_lock()，對 Poisoned 情況返回
    xportError::ExportLocked。這是可以接受的，但可能應該區分 poisoned 狀態。
  • L101-102: count: i64 轉 u32 使用 as u32。如果資料庫中 case 數量超過 u32::MAX
    會發生截斷。這是 Warning 邊界條件問題。
  • L111-131: export_aire 使用 BEGIN IMMEDIATE 和 ROLLBACK。這裡有一個潛在問題：
    果 conn.execute_batch("ROLLBACK;") 失敗，錯誤會覆蓋掉 locked_result 的錯誤。
    戶只會看到 rollback 失敗，而不是原本的操作失敗。這是 Warning。
  • L145: available = u64::MAX 是硬編碼的 TODO，不是 correctness 問題，只是功能
    完整。

  src-tauri/src/data_portability/import.rs

  • L67-72: check_schema_version_compatibility 只檢查 found > CURRENT_SCHEMA_VER
    ON。如果 found < CURRENT_SCHEMA_VERSION，它允許通過。這可能是設計意圖（向後
    容），但需要用戶確認。
  • L91-101: import_aire 接受 _master_password 但完全未使用。這是邏輯問題（功能
    完整），但不影響 correctness。
  • L119-123: archive_size_for_test 在 non-test 中使用 unwrap_or(0)。如果檔案不
    在或無法讀取，size 為 0，磁碟空間檢查就會通過。這可能是一個 Warning。
  • L75-85: detect_conflicts 返回衝突 ID 並排序。邏輯正確。

  src-tauri/src/data_portability/conflict.rs

  • L41: KeepNewer 使用 >=，這表示如果 incoming 和 existing 時間相同，選擇 incom
    g。這是設計決策，不是 bug。
  • L85-96: ConflictResolver::resolve 優先級：apply_to_all > per_case > KeepNewe
    。這看起來正確。
  • 沒有明顯的 unwrap/panic。

  src-tauri/src/crypto/master_password.rs

  • L47-49: SecretPassword::new 接收 &str 並 to_owned()。這裡密碼會在呼叫者的 st
    k 上留下副本（因為 &str 可能指向某處），但 SecretPassword 本身的 zeroize 是
    的。
  • L58-62: Drop for SecretPassword 呼叫 zeroize()。但 String 的 Zeroize 實現會
    內存設為零，不保證重新分配。這是可接受的。
  • L73: password.chars().count() 計算 Unicode code points。對於組合字符（如 é
    以是 e + ́），這可能與用戶感知不同，但作為最小長度檢查是可接受的。
  • L109-120: open_encrypted_db 中 let _ = conn.pragma_update(None, "key", key_s
    c.as_str()); - 忽略 Result。如果這是 SQLCipher 編譯的，失敗會導致資料庫未加
    但返回成功。這是 Critical：静默失敗。
  • L117: let _ = conn.pragma_update(...) 忽略了錯誤。在生產環境中，如果設置密鑰
    敗，後續操作可能在未加密的資料庫上進行。

  src-tauri/src/crypto/recovery_code.rs

  • L52: Language::English.word_list().contains(&word) - word_list() 返回 &[&str
    2048]。contains 在 slice 上查找。但這裡傳入 &word（&&str）而元素是 &str。等
    ，word 是 &str，&word 是 &&str。[&str; 2048] 的 contains 預期 &str（因為實現
    artialEq<&str> for &str）。但 &&str 與 &str 比較... 實際上 Language::English
    ord_list() 返回 &'static [&'static str; 2048]，對其調用 .contains(&word) 應
    能工作，因為 &str: PartialEq<&&str>。不過這有點奇怪，應該直接用 word 而不是
    ord。讓我確認：對於 &[&str; N]，.contains 的簽名是 fn contains(&self, x: &T)
    > bool where T: PartialEq。這裡 T = &str，所以需要 &&str。word 是 &str，&wor
    是 &&str。這是正確的。
  • L116-121: VaultRecoveryManager::new_for_test 使用 store().lock().expect(...)
    這是 test 函數，unwrap 可接受。
  • L140: reset_recovery_code 同樣使用 expect。但這不是 test 函數，是生產代碼中
    unwrap。這是 Warning。
  • L149: unlock_vault_with_recovery 使用 store().lock().expect(...)。這是生產代
    中的 unwrap/panic。如果 Mutex 被 poisoned，會 panic。這是 Critical。
  • L167-196: check_recovery_code_persistence 遍歷目錄查找 recovery code。這個函
    在 UTF-8 解碼失敗時（std::str::from_utf8）會跳過，這是正確的。但如果檔案是二
    制且恰好包含該字節序列... 這裡用 s.contains(code.0.as_str()) 做子字符串匹配
    由於 recovery code 是單詞（ASCII），在 UTF-8 二進制中誤報機率低，但不是零。
    是 Suggestion。
  • L98: derive_recovery_key 將 RecoveryCodeError 從 MasterKeyError 映射為 Authe
    icationFailed，丢失了具體錯誤信息。這是設計選擇。

  src-tauri/src/crypto/vault.rs

  • L42: Vault 使用 RefCell<InnerVault>，不是線程安全的。但這可能是有意設計為單
    程使用。
  • L51-58: has_entry 使用 self.inner.borrow()。這是正確的。
  • L64-75, 77-93: encrypt_with_aes_gcm 和 decrypt_with_aes_gcm 看起來正確。
  • L95-104, 106-115: store_vault_master 和 store_vault_recovery 使用 borrow_mut
    。正確。
  • L117-131, 133-150: unlock_vault_with_master 和 unlock_vault_with_recovery：
    • 先 borrow() 獲取 data，然後 drop(inner) 通過作用域結束。
    • 然後 decrypt_with_aes_gcm。
    • 這避免了在持有 borrow 的同時呼叫可能再次 borrow 的函數（雖然這裡 decrypt_w
      aes_gcm 不需要 borrow）。
    • 但 L124-125 和 L143-144：檢查 plaintext.len() != 32。由於 AES-GCM 使用 PKC
      或類似填充？不，AES-GCM 是流密碼模式，不填充。明文長度應該與輸入相同（32 b
      ）。但如果密鑰錯誤，decrypt 會返回 AuthenticationFailed（在 tag 驗證失敗時
      如果解密成功，長度應該是 32。這裡的檢查是多餘但無害的。
    • 一個潛在問題：L128-129 out.copy_from_slice(&plaintext)。如果 plaintext.len
      = 32，前面已經返回錯誤了，所以這裡安全。

  src/components/ux/RecoveryCodeModal.tsx

  • L4: import "@testing-library/jest-dom/vitest"; 在生產組件中導入測試庫。這是
    rning：會增加 bundle size 並可能在生產環境引入副作用。
  • L17-31: defaultDownloadPdf 在生產環境中直接動態 import @tauri-apps/api/core
    如果不在 Tauri 環境中（如 Web 測試），會出錯。但這是預期行為。
  • L53-64: Escape 鍵處理器只 preventDefault 和 stopPropagation，但沒有呼叫 onCl
    e。這意味著用戶按下 Escape 無法關閉 modal，且事件被完全攔截（阻止其他 handle
    ）。這看起來是刻意的（強迫用戶完成三個動作），但需要確認。
  • L68-71: handlePrint 呼叫 window.print() 後設置 didPrint = true。但 window.pr
    t() 是異步的（顯示列印對話框），用戶可能取消列印。這裡無法檢測取消，所以設為
    rue 只是「已點擊列印」。這是 UX 問題，不是 correctness 問題。
  • L108: key={${word}-${index}} - 如果 recoveryWords 有重複單詞，key 不唯一。這
    React 的 warning，不是 correctness 崩潰。
  • L122-123: onClick={() => void handleDownload()} - handleDownload 返回 Promis
    ，void 運算符防止 React 警告未處理的 Promise。錯誤處理在 handleDownload 內部
    成（try-catch）。這是正確的。

  src/components/ux/MasterPasswordPrompt.tsx

  • L4: 同樣導入 import "@testing-library/jest-dom/vitest";。這是 Warning。
  • L25: [...password].length < 8 - 使用 spread 運算符計算 Unicode code points。
    與 Rust 端的 password.chars().count() 一致。正確。
  • L32-40: handleSubmit 中 await onUnlock(password) 後 setPassword("")。如果在
    Unlock 成功後、setPassword 之前組件卸載，會有 memory leak warning。但這不是
    重問題。
  • L33: await onUnlock(password) 如果拋出錯誤，setPassword("") 和 setError 會在
    atch 中執行。但如果組件在 onUnlock 進行時卸載，setIsSubmitting(false) 在 fin
    ly 中會導致 React warning。應該使用 ref 或取消標記。這是 Suggestion。
  • L92-99: <a href="/recovery" role="button"> - 這裡使用 <a> 標籤進行客戶端導航
    但沒有使用 Next.js 的 Link 組件。這會導致整頁重新加載。這是 Warning。

  src/components/ux/ImportConflictDialog.tsx

  • L4: 同樣導入 import "@testing-library/jest-dom/vitest";。這是 Warning。
  • L12: caseId: number | string; - 類型寬鬆。在 L88 中直接用於 #{conflict.caseI
    ，不會出錯。
  • L43-68: applyToAll 狀態管理正確。
  • L139-147: 按鈕順序在 DOM 中是 overwrite (destructive) -> keep_newer -> skip
    但 CSS 使用 flex-col-reverse 在 mobile 上反轉順序。在 desktop (sm:flex-row)
    保持原順序。這意味著在 desktop 上 destructive 按鈕在左邊，這可能不是最佳 UX
    但不是 correctness 問題。
  • L55-68: handleDecision 中如果 applyAllActive 為 true，呼叫 onDecideAll。但沒
    檢查 confirmApplyAll（雙重確認）。用戶可以勾選「套用至所有剩餘衝突」但不勾選
    認，直接點擊按鈕，applyAllActive 仍為 true，會觸發 onDecideAll。等等，看 L12
    135：
    {applyToAll ? (
    <label className="flex items-start gap-2 pl-6 text-destructive">
      <input
        checked={confirmApplyAll}
        onChange={(event) => setConfirmApplyAll(event.target.checked)}
        type="checkbox"
      />
      <span className="inline-flex items-center gap-1">
        <AlertTriangle className="h-4 w-4" />
        我確認要套用到所有剩餘衝突
      </span>
    </label>
    ) : null}
    這裡有一個 UI 顯示了雙重確認 checkbox，但 handleDecision 完全沒有檢查 confir
    pplyAll。所以即使沒有勾選確認，也可以觸發 onDecideAll。這是 Critical 邏輯錯
    ：雙重確認未實際生效。

  另外，對於 aire_format.rs 中 L227-232 的 has_entry 問題，讓我再仔細看看：

  if db_bytes.is_empty() && !has_entry(&zip, ARCHIVE_DB_FILENAME) {
      return Err(AireFormatError::InvalidFormat("missing db.sqlite".into()));
  }
  if meta_json.is_empty() && !has_entry(&zip, ARCHIVE_META_FILENAME) {
      return Err(AireFormatError::InvalidFormat("missing meta.json".into()));
  }

  由於 has_entry 永遠返回 true，!has_entry 永遠是 false。所以：

  • 如果 db.sqlite 缺失：db_bytes 為空，但 !has_entry 為 false，條件不滿足，不報
    。
  • 如果 db.sqlite 存在但為空：db_bytes 為空，但 !has_entry 為 false，條件不滿足
    不報錯。

  但等一下，後面還有 checksum 驗證。如果 db.sqlite 缺失，db_bytes 為空，checksum
  _file 會有內容（如果存在）。checksum 驗證會比較空的 db_bytes 的 sha256 與 chec
  ksum 中的期望值，這會失敗（ChecksumMismatch）。所以最終還是會報錯，只是錯誤訊
  息不同。

  但如果 archive 中只有 checksum.sha256 而沒有 db.sqlite 和 meta.json 呢？在迴圈
  中：

  • checksum_file 被讀取
  • db_bytes 保持為空
  • meta_json 保持為空

  然後 checksum_file.trim().is_empty() 為 false（假設有內容）。 parse_checksum_f
  ile 會解析出期望的 hash。 actual_db = sha256_hex(&db_bytes) 是空字串的 hash。
  比較時會發現不匹配，返回 ChecksumMismatch。

  所以缺失檔案的錯誤最終會以 ChecksumMismatch 的形式出現，而不是 InvalidFormat("
  missing db.sqlite")。這不是 security critical，但錯誤訊息會誤導用戶。更重要的
  是，如果 checksum file 也缺失或為空，則會在 L233-237 捕獲。

  但 L227-232 的註釋說「Strict: only allow expected entries」，而 has_entry 的存
  在使得「missing」檢查失效。這是一個 Warning 級別的問題：錯誤訊息不準確，且邏輯
  不完整。

  實際上還有一個邊界情況：如果 archive 包含 db.sqlite 但內容為空（0 bytes）。在
  迴圈中 db_bytes 會是空的。has_entry 返回 true（雖然實際上應該檢查是否真的存在
  ）。由於 !has_entry 為 false，不會報錯。checksum 驗證會驗證空檔案的 hash。這在
  技術上是正確的（空檔案有正確的 hash）。所以空 db 可以通過。

  但後面還有 meta.validate()。如果 db 為空但 meta 正確，這可能是一個有效的 archi
  ve。這不一定是 bug。

  好的，讓我重新評估。最關鍵的問題是：

  Rust 端：

  1. aire_format.rs L227-232 / L336-340: has_entry 永遠返回 true，使得缺失檔案檢
     失效。
  2. master_password.rs L117: pragma_update 結果被忽略，可能導致加密未啟用。
  3. recovery_code.rs L119, 140, 149: Mutex::lock().expect(...) 在生產代碼中。
  4. export.rs L101-102: i64 as u32 可能截斷。
  5. export.rs L129-131: Rollback 錯誤覆蓋操作錯誤。
  6. import.rs L119-123: unwrap_or(0) 在檔案不存在時導致磁碟空間檢查失效。
  7. vault.rs: RefCell 使用在可能多線程的 Tauri 環境中。Tauri commands 可能從不
     程呼叫。如果 Vault 被多線程共享，RefCell 會在 runtime panic。這是 Warning。

  TSX 端：

  1. RecoveryCodeModal.tsx L4: 生產組件導入測試庫。
  2. MasterPasswordPrompt.tsx L4: 同上。
  3. ImportConflictDialog.tsx L4: 同上。
  4. ImportConflictDialog.tsx L55-68: 雙重確認 checkbox 未生效。
  5. MasterPasswordPrompt.tsx L92-99: 使用 <a> 而非 <Link>。

  還有沒有 async/await 問題？TSX 組件中：

  • RecoveryCodeModal.tsx L122: () => void handleDownload() - handleDownload 是
    ync，void 防止 Promise 未處理警告。內部有 try-catch。這是正確的。
  • MasterPasswordPrompt.tsx L33: await onUnlock(password) - 在 try-catch 中，正
    。

  在 Rust 中沒有明顯的 async/await 問題（這些模組是同步的）。

  lifetime / borrow checker：

  • aire_format.rs L114: file_names() 返回 impl Iterator<Item = String>。內部 Ve
    :new().into_iter() 和 names.into_iter() 都是 owning iterator，沒有 lifetime
    題。ZipArchive::new(Cursor::new(&self.bytes)) 中 Cursor owning &self.bytes..
    等等，Cursor::new(&self.bytes) 創建一個 Cursor<&[u8]>，它 impl Read + Seek。
    pArchive::new(cursor) 消費 cursor。zip.len() 和 zip.by_index(i) 使用 zip 的
    變借用。但 entry.name() 返回 &str，其 lifetime 與 zip 綁定。entry.read_to_en
    ...) 也使用 zip。由於 names 儲存的是 entry.name().to_string()（owned String
    ，所以沒有 lifetime 問題。Vec::new().into_iter() 也是 owning。這裡是安全的。

  還有沒有其他問題？

  aire_format.rs L62-73: new_empty() 使用 chrono::Utc::now().to_rfc3339()。如果
  系統時間倒退或異常，這不是 correctness 問題。

  aire_format.rs L76-107: with_test_cases()：

  • L84: rusqlite::Connection::open(&temp_path) - 如果失敗返回 Err。
  • L86-87: execute_batch 如果失敗返回 Err。
  • L88-91: for id in 1..=case_count - case_count 是 u32。rusqlite::execute 的參
    是 [id]，這裡 id 是 u32。rusqlite 的 ToSql 實現了 u32 嗎？應該是實現的。
  • L94: std::fs::read(&temp_path) - 如果失敗返回 Err。
  • L95: let _ = std::fs::remove_file(&temp_path); - 忽略錯誤。如果刪除失敗，tem
    file 會殘留。這在測試輔助函數中可接受。

  master_password.rs L44-62: SecretPassword：

  • Zeroize 和 Drop 實現。Drop 呼叫 zeroize()。由於 SecretPassword 也實現了 Zero
    e，這會將內部 String 清零。但 String::zeroize() 會將內容設為零並清空長度。這
    正確的。
  • 但 derive_master_key 接收 password: &str。呼叫者傳入的 &str 可能來自某個 Str
    g，而該 String 不會被 zeroize。這不是 derive_master_key 的責任，但值得注意。

  vault.rs L1-3: aes_gcm 的使用。Aes256Gcm::new 接收 GenericArray。Nonce::from_s
  lice 返回 &Nonce。在 encrypt 和 decrypt 中傳入 &nonce。這是正確的。

  recovery_code.rs L152: current.0.as_bytes().ct_eq(code.0.as_bytes()) - 使用 su
  btle::ConstantTimeEq。這是正確的常量時間比較。

  import.rs L42-58: start_import 的磁碟空間檢查。archive_size 在 non-test 中如果
  檔案不存在則為 0，檢查會通過。後續讀取時會失敗。這是一個提前檢查失效的問題。

  讓我檢查是否還有其他 unwrap/panic：

  • aire_format.rs: 沒有 unwrap。
  • conflict.rs: 沒有 unwrap。
  • export.rs: 沒有 unwrap。
  • import.rs: L121-122 unwrap_or(0) - 這是 production code 中的 unwrap（雖然是
    tion 的 unwrap_or，不是 panic）。如果用戶的意思是 .unwrap() 或 .expect() 這
    會 panic 的呼叫，那 unwrap_or 不算。但用戶說的是「unwrap/panic」，所以 unwra
    or 不算。不過 L121 的 metadata 可能失敗。

  讓我重新看一下 archive_size_for_test 的 non-test 版本：

  #[cfg(not(test))]
  fn archive_size_for_test(opts: &ImportOptions) -> u64 {
      std::fs::metadata(&opts.archive_path)
          .map(|m| m.len())
          .unwrap_or(0)
  }

  這裡使用 unwrap_or(0) 而不是傳播錯誤。在 start_import 中：

  let archive_size = archive_size_for_test(&opts);
  let required = archive_size + 64 * 1024;

  如果檔案不存在，archive_size 為 0，required = 64K。如果 available > 64K，檢查
  通過。但後續 import_aire 會因讀取失敗而返回 Io 錯誤。所以提前檢查失去了意義。
  這是一個 Warning。

  另外 aire_format.rs L336-340 的 has_entry：

  fn has_entry<R: Read + std::io::Seek>(_zip: &ZipArchive<R>, _name: &str) -> bo
  ol {
      // zip::ZipArchive doesn't allow querying names without mutable access; we
  already iterated.
      // Presence checks above are sufficient for tests.
      true
  }

  這是一個明顯的 stub 函數。雖然有註釋說明，但在 production code 中返回硬編碼 tr
  ue 使得依賴它的檢查失效。這是 Warning。

  還有 open_encrypted_db 中 L117 let _ = conn.pragma_update(None, "key", key_spe
  c.as_str());：

  • rusqlite::Connection::pragma_update 返回 Result<(), rusqlite::Error>。
  • 被忽略。
  • 在 bundled SQLite（無 SQLCipher）中，PRAGMA key 是 unknown pragma，返回 no-o
    且不報錯。但如果將來啟用 SQLCipher，這裡的錯誤應該被處理。
  • 這是 Critical 因為它是一個静默失敗，且與安全性相關（加密未啟用）。

  好了，我認為已經覆蓋了主要問題。讓我整理並輸出報告。

  分類：

  • Critical: 會導致錯誤行為、安全問題或 panic
  • Warning: 邊界條件處理不當、型別轉換風險、邏輯缺陷
  • Suggestion: 可改進但不影響正確性

  報告格式：檔案:行號 + 具體問題 + 建議修法。

  讓我再確認一下 RecoveryCodeModal.tsx 的 Escape 處理：

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
  };

  這裡只阻止了 Escape 的默認行為，但沒有關閉 modal。這應該是刻意的（強迫用戶完成
  動作），所以不算 bug。

  還有 ImportConflictDialog.tsx 中 applyAllActive 變量：

  const applyAllActive = applyToAll;

  這是多餘的，只是 alias，不算 bug。

  在 RecoveryCodeModal.tsx 中 L17-31 的 defaultDownloadPdf：

  const viGlobal = (globalThis as { vi?: { importMock?: (path: string) => Promis
  e<unknown> } }).vi;
  if (viGlobal?.importMock) {
    ...
  }

  這裡檢查 Vitest 的全局 mock。這是測試侵入生產代碼的模式。雖然不是 correctness
  問題，但建議分離。

  不過用戶只要求 correctness，所以我會專注於邏輯、型別、錯誤處理等。

  最後檢查：import.rs L91 import_aire 中 _master_password 前綴下劃線表示未使用。
  這是功能未完成的標記，不是 correctness 問題。

  export.rs L97-102 count_cases_in_db：

  pub fn count_cases_in_db(conn: &rusqlite::Connection) -> Result<u32, ExportErr
  or> {
      let count: i64 = conn
          .query_row("SELECT COUNT(*) FROM cases", [], |row| row.get(0))
          .map_err(|e| ExportError::Sqlite(e.to_string()))?;
      Ok(count as u32)
  }

  如果 COUNT(*) 返回的值超過 u32::MAX（約 40 億），as u32 會截斷。但 SQLite 的 i
  64 最大到 i64::MAX。對於 case 數量來說這不太可能，但從型別安全角度來說應該使 …
  try_into()。這是 Warning。

  aire_format.rs L86: conn.execute_batch("CREATE TABLE cases (id INTEGER PRIMARY
  KEY);") 後面沒有插入數據... 等等，L88-91 插入了數據。這是正確的。

  還有 recovery_code.rs 中 L102-106：

  static VAULT_RECOVERY_STORE: OnceLock<Mutex<HashMap<String, RecoveryCode>>> =
  OnceLock::new();

  fn store() -> &'static Mutex<HashMap<String, RecoveryCode>> {
      VAULT_RECOVERY_STORE.get_or_init(|| Mutex::new(HashMap::new()))
  }

  RecoveryCode 實現了 ZeroizeOnDrop。但 HashMap 的 clone() 會複製 String。當 Has
  hMap 被銷毀時，其值會被 drop，但 String 的 drop 不會 zeroize 內存。然而 Recove
  ryCode 實現了 ZeroizeOnDrop，所以當 RecoveryCode 被 drop 時會 zeroize。這是正
  確的。

  但 RecoveryCode 被 clone 時（L141 code.clone()），原始和副本都會有獨立的 Strin
  g。當它們被 drop 時都會 zeroize。這是正確的。

  讓我檢查 ZeroizeOnDrop 的行為。ZeroizeOnDrop 是一個 derive macro，它會在 Drop
  實現中呼叫 zeroize。這應該會在 RecoveryCode 被 drop 時 zeroize 內部 String。但
  如果 RecoveryCode 被移出 HashMap（如 map.remove()），它會被 drop 並 zeroize。
  但 map.get() 返回引用，不會 drop。map.get(&vault_id) 在 unlock_vault_with_reco
  very 中返回 &RecoveryCode，不會 drop。

  我認為分析已經足夠了。讓我撰寫報告。

• 以下是對 aire-phase1-data-portability 相關路徑的 correctness 審查結果，依 Crit
  ical / Warning / Suggestion 分類。

  ──────────────────────────────────────────────────────────────────────────────

  Critical
  ────────

  src-tauri/src/crypto/master_password.rs:117
  • 問題：open_encrypted_db 中 conn.pragma_update(None, "key", ...) 的錯誤結果被
    et _ = 忽略。若日後啟用 SQLCipher 或連線異常，資料庫將在未設定金鑰的狀態下被
    為「成功開啟」，造成加密失效的靜默失敗（silent failure）。
  • 建議修法：將 pragma_update 的 Result 傳播出去，或至少回傳專用的加密初始化錯
    ：
    conn.pragma_update(None, "key", key_spec.as_str())
      .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
  src-tauri/src/crypto/recovery_code.rs:119,140,149
  • 問題：生產程式碼中使用 Mutex::lock().expect("vault recovery store poisoned")
    若任何執行緒在持有鎖時 panic，後續所有呼叫路徑都會跟著 panic，造成拒絕服務（
    S）。
  • 建議修法：將 expect 改為傳播錯誤，或至少回傳 RecoveryCodeError：
    let mut map = store().lock().map_err(|_| RecoveryCodeError::AuthenticationFa
    ed)?;
  src/components/ux/ImportConflictDialog.tsx:55-68
  • 問題：handleDecision 在 applyAllActive 為 true 時直接呼叫 onDecideAll(payloa
    ，但完全沒有檢查 confirmApplyAll（第二道「我確認要套用到所有剩餘衝突」checkb
    ）。使用者只要勾選第一個 checkbox 即可觸發全局套用，雙重確認機制形同虛設。
  • 建議修法：在 applyAllActive 分支中加入 confirmApplyAll 檢查，未確認時直接 re
    rn 或顯示警告：
    if (applyAllActive) {
    if (!confirmApplyAll) return; // 或顯示提示
    onDecideAll(payload);
    return;
    }
  ──────────────────────────────────────────────────────────────────────────────

  Warning
  ───────

  src-tauri/src/data_portability/aire_format.rs:227-232,336-340
  • 問題：has_entry() 為硬編碼 stub，永遠回傳 true。這使得 db_bytes.is_empty() &
    !has_entry(...) 與 meta_json.is_empty() && !has_entry(...) 的「缺失檔案」檢
    永遠不會觸發。archive 中若缺少 db.sqlite 或 meta.json，錯誤會以 ChecksumMism
    ch 的形式延後拋出，誤導除錯與使用者訊息。
  • 建議修法：使用 zip.by_name(...) 做存在性檢查（需 &mut zip，可在迴圈中提前紀
    ），或改用 zip.file_names() 收集後檢查。
  src-tauri/src/data_portability/export.rs:97-102
  • 問題：count_cases_in_db 將 SQLite 回傳的 i64 直接 as u32 轉型。若個案數超過
    2::MAX（約 43 億），會發生數值截斷（wrap），回傳錯誤的計數。
  • 建議修法：使用 try_into() 並處理溢出錯誤：
    let count: u32 = count.try_into().map_err(|_| ExportError::Format("case coun
    overflow".into()))?;
  src-tauri/src/data_portability/export.rs:111-131
  • 問題：export_aire 的錯誤覆蓋邏輯。locked_result 的錯誤會被後續 conn.execute_
    tch("ROLLBACK;") 的錯誤覆蓋。若資料庫操作失敗且連 rollback 也失敗，呼叫者只
    看到「rollback 失敗」，遺失原始錯誤脈絡。
  • 建議修法：使用 let _ = conn.execute_batch("ROLLBACK;"); 忽略 rollback 的次要
    誤，優先傳回 locked_result? 的原始錯誤；或將兩個錯誤包裝成複合錯誤。
  src-tauri/src/data_portability/import.rs:119-123
  • 問題：archive_size_for_test（non-test 版本）對 std::fs::metadata 使用 unwrap
    r(0)。若封存檔不存在或權限不足，archive_size 為 0，導致磁碟空間預檢 required
    64 * 1024 幾乎一定通過，失去提前攔截的意義。
  • 建議修法：將檔案不存在視為 Io 錯誤傳播：
    let archive_size = std::fs::metadata(&opts.archive_path)
      .map(|m| m.len())
      .map_err(|e| ImportError::Io(e.to_string()))?;
  src-tauri/src/crypto/vault.rs:40-42
  • 問題：Vault 使用 RefCell<InnerVault> 實現內部可變性。Tauri command 可能由不
    執行緒同時呼叫，若 Vault 實例被多執行緒共享（例如透過 Arc 或 OnceLock），Ref
    ll 會在 runtime panic（borrow error）。目前 Vault 並未實現 Sync/Send，但在 T
    ri 狀態管理（tauri::State）中若被包裝為全域狀態，此風險會浮現。
  • 建議修法：若 Vault 需要跨執行緒，將 RefCell 替換為 std::sync::RwLock 或 Mute
    ；若確定為單執行緒使用，請在文件與型別上明確標註 !Send + !Sync。
  src/components/ux/RecoveryCodeModal.tsx:4 src/components/ux/MasterPasswordProm
  pt.tsx:4 src/components/ux/ImportConflictDialog.tsx:4
  • 問題：三個生產元件檔案頂層 import "@testing-library/jest-dom/vitest";。這會
    測試庫與 vitest 的型別擴展帶入生產 bundle，可能產生副作用、增加 bundle size
    並在沒有 vitest 的環境中造成型別/執行期異常。
  • 建議修法：將該 import 移至對應的 *.test.tsx 測試檔案中。
  src/components/ux/MasterPasswordPrompt.tsx:92-99
  • 問題：使用原生 <a href="/recovery"> 進行客戶端路由，會觸發整頁重新載入（full
    age reload），而非 Next.js 的 client-side navigation。
  • 建議修法：改用 Next.js <Link href="/recovery">（若為 Next.js App Router）或
    適的 client-side router API。
  ──────────────────────────────────────────────────────────────────────────────

  Suggestion
  ──────────

  src-tauri/src/data_portability/import.rs:67-72
  • 問題：check_schema_version_compatibility 僅拒絕 found > CURRENT_SCHEMA_VERSI
    。對 found < CURRENT_SCHEMA_VERSION 採取放行策略。雖然這通常是向後兼容設計，
    若目前版本（1）並不保證能正確讀取更舊的 schema，應明確記錄最小支援版本。
  • 建議修法：新增 MIN_SCHEMA_VERSION 常數，並一併檢查下限：
    if found < MIN_SCHEMA_VERSION || found > CURRENT_SCHEMA_VERSION { ... }
  src-tauri/src/crypto/recovery_code.rs:167-196
  • 問題：check_recovery_code_persistence 以純文字子字串比對 s.contains(code.0.a
    str()) 掃描整個 app data 目錄。雖然 recovery code 由 BIP39 單詞組成，誤報機
    低，但二進位檔案若恰好包含連續 ASCII 字節仍可能誤判。此外，read_dir 與 read
    錯誤被靜默忽略。
  • 建議修法：若只需要確認「沒有意外寫入 log/db」，改為針對已知文字型設定檔（如
    son, .log, .txt）做副檔名白名單篩選，降低誤報與 I/O 負擔。
  src/components/ux/MasterPasswordPrompt.tsx:22-41
  • 問題：handleSubmit 在 await onUnlock(password) 進行中若元件已卸載（unmount）
    finally 區塊呼叫 setIsSubmitting(false) 會觸發 React「setState on unmounted
    mponent」警告。
  • 建議修法：使用 useRef 標記掛載狀態，或在 useEffect 中做 cleanup：
    const isMounted = React.useRef(true);
    React.useEffect(() => () => { isMounted.current = false; }, []);
    // 在 finally 中: if (isMounted.current) setIsSubmitting(false);
  src/components/ux/RecoveryCodeModal.tsx:108
  • 問題：key={${word}-${index}} 在 recoveryWords 出現重複單詞時，React key 不唯
    。雖然不會崩潰，但可能引發不必要的 re-render 或開發模式警告。
  • 建議修法：改為純以 index 作為 key，或確保產生單詞的來源保證唯一性。
  ──────────────────────────────────────────────────────────────────────────────

  彙整統計
  • Critical：4 處（靜默加密失敗、Mutex poison panic x3、雙重確認失效）
  • Warning：7 處（stub 檢查、型別截斷、錯誤覆蓋、磁碟預檢失效、RefCell 執行緒安
    、測試庫混入生產、錯誤路由）
  • Suggestion：4 處（schema 下限、誤報掃描、unmount setState、React key）

```

## security lens
```
• The user wants a security audit of specific files in the aire-phase1-data-port
  ability feature. Let me first explore the codebase to find these files and und
  erstand their content. I'll use the explore agent to read the relevant files i
  n parallel.

• Used Agent (Find data portability files)
  • subagent explore (ae7537dd6)
  • 23 more tool calls ...
  • Used ReadFile
  • Used ReadFile (src/components/ux/RecoveryCodeModal.tsx)
  • Used ReadFile
  • Used ReadFile

• Now I have all the file contents. Let me analyze them for security issues acro
  ss the requested categories:

  1. OWASP top 10 (injection / XSS / auth / crypto)
  2. timing attack / nonce reuse / 弱亂數
  3. memory zeroize / dangling sensitive data
  4. PII leak (log / panic / Display impl)
  5. SQL injection / TOCTOU / SSRF

  Let me go through each file systematically.

  src-tauri/src/crypto/vault.rs
  ─────────────────────────────

  • AES-GCM nonce: uses OsRng fill_bytes for each encryption, looks good for uni
    eness
  • BUT: VaultData is #[derive(Clone, Debug)] - Debug could leak ciphertext and
    nce in logs! The ciphertext is sensitive.
  • InnerVault is not zeroized. VaultData contains Vec<u8> for ciphertext and no
    e. When dropped, these are not zeroized.
  • unlock_vault_with_master and unlock_vault_with_recovery return [u8; 32] whic
    is not zeroized. Could be copied around and left in memory.
  • The Vault uses RefCell<InnerVault> which is fine for single-threaded.
  • store_vault_master and store_vault_recovery don't validate key lengths beyon
    the type system.
  • No authentication tag length check on decrypt - but AES-GCM crate handles th
    .

  src-tauri/src/crypto/master_password.rs
  ───────────────────────────────────────

  • Argon2id with OWASP params - good.
  • SecretPassword implements Zeroize and Drop - good.
  • BUT: derive_master_key takes &str not SecretPassword. The password is passed
    s &str which means it exists in memory elsewhere. The function signature sho
    d ideally take &SecretPassword or similar.
  • open_encrypted_db sets PRAGMA key - good, but with non-SQLCipher this is a n
    op as noted. The DB is NOT actually encrypted if using bundled SQLite.
  • hex_encode creates a hex string without zeroizing. The hex variable is wrapp
    in Zeroizing which is good.
  • derive_master_key returns [u8; MASTER_KEY_LEN] which is not zeroized. This i
    sensitive material left in memory after use.

  src-tauri/src/crypto/recovery_code.rs
  ─────────────────────────────────────

  • RecoveryCode implements Zeroize, ZeroizeOnDrop - good.
  • Display and Debug are redacted - good.
  • generate_recovery_code uses OsRng - good.
  • derive_recovery_key takes &[&str] not RecoveryCode. The words are passed as
    ring slices.
  • unlock_vault_with_recovery uses subtle::ConstantTimeEq - good for timing att
    k resistance.
  • BUT: the VAULT_RECOVERY_STORE is a static Mutex<HashMap<String, RecoveryCode
    . Recovery codes are stored in memory. When the program exits, this memory i
    not explicitly zeroized. The HashMap doesn't zeroize on drop.
  • VaultRecoveryManager::new_for_test - is this only for tests? The name says n
    _for_test but it's pub. It stores recovery codes in the global static store.
  • check_recovery_code_persistence reads all files in app_data_dir and does str
    from_utf8 then contains(code.0.as_str()). This is a best-effort check but no
    a security control.
  • RecoveryCodeError::InvalidWord contains the actual word in the error message
    If this error is logged, it leaks part of the recovery code! This is a PII l
    k.

  src-tauri/src/data_portability/aire_format.rs
  ─────────────────────────────────────────────

  • AireMeta contains source_machine_id which is PII.
  • AireMeta derives Debug - if logged, leaks source_machine_id.
  • AireFormatError derives Debug and uses #[error(...)]. The ChecksumMismatch e
    or includes expected and actual checksums. The InvalidFormat includes arbitr
    y strings.
  • with_test_cases creates a temp file with uuid::Uuid::new_v4() in the filenam
    The temp file is deleted but there's a small window where it exists.
  • create_archive uses CompressionMethod::Stored - no compression, which is fin
  • open_archive reads zip entries. entry.name() is matched against constants. I
    there are path traversal entries like ../db.sqlite, the match won't catch th
    but the code uses entry.name() directly. Actually, the match entry.name() on
    allows exact names. Good.
  • parse_checksum_file uses split_whitespace() - if a filename contains spaces,
    his could be parsed incorrectly. The format is hash  filename with two space
    split_whitespace would split on any whitespace, so a filename with spaces wo
    d break parsing.
  • build_checksum_file uses format!("{}  {}\n", ...) with two spaces, consisten
    with sha256sum format.
  • No SSRF issues here.

  src-tauri/src/data_portability/export.rs
  ────────────────────────────────────────

  • export_aire uses BEGIN IMMEDIATE and ROLLBACK. It reads the DB path from pra
    a then reads the file directly.
  • TOCTOU: The DB path is read while holding the lock, but then the file is rea
    Between query_row for the path and std::fs::read, the file could be swapped
    an attacker has access. But since we're holding an IMMEDIATE lock on the con
    ction, other SQLite operations are blocked. However, filesystem-level tamper
    g is still possible.
  • count_cases_in_db uses a hardcoded SQL query SELECT COUNT(*) FROM cases. No
    jection since no user input.
  • start_export writes to opts.output_path which is user-controlled. No path va
    dation. Could potentially overwrite sensitive files if the path is attacker-
    ntrolled. This is a path traversal issue if the path comes from untrusted in
    t.
  • ExportError includes Io(String) and Sqlite(String) which could leak sensitiv
    paths if the error is logged.

  src-tauri/src/data_portability/import.rs
  ────────────────────────────────────────

  • import_aire takes file_path: &PathBuf and _master_password: &str. The master
    assword is prefixed with underscore (unused). This means the import function
    oesn't actually decrypt anything yet - the archive is plaintext.
  • detect_conflicts takes slices - no issue.
  • start_import doesn't validate the archive path or check if it exists before
    sk space check (in test mode).
  • No SSRF.

  src-tauri/src/data_portability/conflict.rs
  ──────────────────────────────────────────

  • No obvious security issues. Simple logic.

  src/components/RecoveryCodeModal.tsx (actually src/components/ux/RecoveryCodeM
  odal.tsx)
  ──────────────────────────────────────────────────────────────────────────────
  ─────────

  • recoveryWords is passed as prop and rendered in the DOM. No XSS since React
    capes by default.
  • onDownloadPdf defaults to invoking generate_recovery_pdf with words. The wor
    are passed to the backend command.
  • handleEscape prevents Escape key from closing - this is UX, not security.
  • No obvious XSS. The words are rendered as text content.
  • The component renders word directly: <span>{word}</span> - React escapes thi
    safe from XSS.
  • The key uses ${word}-${index} - if words can contain special characters, Rea
    handles it.

  src/components/MasterPasswordPrompt.tsx (actually src/components/ux/MasterPass
  wordPrompt.tsx)
  ──────────────────────────────────────────────────────────────────────────────
  ───────────────

  • Password input uses type={showPassword ? "text" : "password"} - toggling vis
    ility is UX.
  • autoComplete="current-password" - good.
  • Password is passed to onUnlock(password) as plain string.
  • No XSS. Error messages are hardcoded strings.
  • The <a href="/recovery"> is a regular link.

  src/components/ImportConflictDialog.tsx (actually src/components/ux/ImportConf
  lictDialog.tsx)
  ──────────────────────────────────────────────────────────────────────────────
  ───────────────

  • conflict.caseName is rendered: {conflict.caseName ?? "未命名案件"}. React es
    pes by default, so no XSS.
  • No SQL injection or auth issues in this pure UI component.

  Let me also look more carefully at some specific issues:

  Timing attacks
  ──────────────

  • verify_checksum in aire_format.rs: if expected != actual - this is a standar
    string comparison, NOT constant-time. For checksum verification, this is act
    lly OK because checksums are not secrets. But if this were used for HMAC ver
    ication, it would be vulnerable. Here it's fine since checksums are public i
    egrity checks.
  • unlock_vault_with_recovery in recovery_code.rs: Uses subtle::ConstantTimeEq
    good.
  • derive_master_key password length check: password.chars().count() then compa
    . This leaks password length through timing. An attacker could measure how l
    g the function takes before returning PasswordTooShort. The chars().count()
    erates over the whole string. This is a timing side channel on password leng
    .

  Nonce reuse
  ───────────

  • encrypt_with_aes_gcm in vault.rs: generates nonce with OsRng each time. Unde
    normal circumstances, 12-byte random nonce has collision probability ~2^-96
    ich is acceptable. But with many encryptions, there's a birthday bound. For
    S-GCM, random nonces are acceptable but the standard recommendation is count
    -based or 96-bit IV. With 2^32 encryptions, collision probability is about 2
    33 which is concerning. However, for this application, it's probably fine. I
    l flag it as a suggestion.

  Weak RNG
  ────────

  • All RNG uses OsRng - good.

  Memory zeroize
  ──────────────

  • derive_master_key returns [u8; 32] - not zeroized. Same for unlock_vault_wit
    master, unlock_vault_with_recovery, derive_recovery_key.
  • VaultData in vault.rs contains Vec<u8> that are not zeroized. When Vault is
    opped, the ciphertext and nonce remain in freed memory.
  • SecretPassword is zeroized but the String inside might have been reallocated
    The zeroize crate will overwrite the current allocation but Rust's String ma
    have moved.
  • RecoveryCode has ZeroizeOnDrop - good.
  • InnerVault is not zeroized.

  PII leak
  ────────

  • AireMeta::source_machine_id - PII. If Debug is logged, this leaks.
  • RecoveryCodeError::InvalidWord { word, position } - leaks the actual word at
    mpted. If logged, this reveals part of the recovery code.
  • MasterKeyError::PasswordTooShort { code_points } - leaks password length (mi
    r, but still).
  • ExportError::Io(String) and ImportError::Io(String) - could leak file paths
    error messages if logged.
  • vault.rs VaultData derives Debug and Clone. The Debug implementation will pr
    t ciphertext and nonce bytes. While ciphertext is encrypted, the nonce shoul
    not be logged alongside it as it could aid cryptanalysis.

  SQL Injection
  ─────────────

  • export.rs count_cases_in_db: hardcoded query, safe.
  • export.rs export_aire: pragma_database_list query is hardcoded, safe.
  • aire_format.rs with_test_cases: uses parameterized query INSERT INTO cases (
    ) VALUES (?1) - safe.
  • import.rs: no SQL queries.

  TOCTOU
  ──────

  • export.rs export_aire: reads DB file path from SQLite while holding IMMEDIAT
    lock, then reads file from filesystem. Between reading the path and reading
    e file, the file could be replaced. The IMMEDIATE lock prevents other SQLite
    onnections from writing, but doesn't prevent filesystem-level tampering.
  • aire_format.rs with_test_cases: creates temp file, writes to it, reads it, t
    n deletes it. If an attacker can access the temp dir, they could read the fi
    before deletion.

  SSRF
  ────

  • No network requests in the audited code.

  Additional issues
  ─────────────────

  • RecoveryCodeModal.tsx: The recovery words are visible in the DOM. If a user
    s a malicious browser extension or if the page is screenshotted, the words a
    exposed. Not a code vulnerability per se.
  • MasterPasswordPrompt.tsx: Password length check on frontend [...password].le
    th < 8 - this is client-side only and can be bypassed. The real check should
    e in Rust backend.
  • import_aire takes _master_password but doesn't use it. This suggests the arc
    ve format is not encrypted, which means sensitive case data is stored in pla
    text in the archive. This is a significant security issue if the archive con
    ins PII.

  Let me structure the findings:

  Critical
  ────────

  1. Import archives are plaintext - import_aire accepts master_password but doe
     t use it. The archive contains a SQLite DB (db.sqlite) with case data in pl
     text. If archives are stored on disk or transmitted, PII is exposed.
    • File: src-tauri/src/data_portability/import.rs:86
    • CVE class: CWE-311 (Missing Encryption of Sensitive Data)
    • Attack vector: Attacker gains access to exported .aire file → reads all ca
      ata directly.
    • Fix: Encrypt db.sqlite with the master password before archiving (e.g., SQ
      her or AES-GCM envelope encryption).
  2. RecoveryCodeError::InvalidWord leaks attempted words in error messages
    • File: src-tauri/src/crypto/recovery_code.rs:42
    • CVE class: CWE-209 (Information Exposure Through an Error Message), CWE-20
    • Attack vector: If errors are logged to disk or sent to telemetry, partial
      very codes are exposed.
    • Fix: Remove the actual word from the error variant; log only position or a
      acted version.

  Warning
  ───────

  3. Master key returned as plain [u8; 32] without zeroize
    • Files: src-tauri/src/crypto/master_password.rs:72, src-tauri/src/crypto/va
      rs:119, src-tauri/src/crypto/recovery_code.rs:82
    • CVE class: CWE-226 (Sensitive Information in Resource Not Removed From Mem
      , CWE-316
    • Attack vector: Memory dump, core dump, or swap file analysis reveals maste
      covery/DB keys.
    • Fix: Return Zeroizing<[u8; 32]> or a custom zeroizing wrapper. Apply Zeroi
      o VaultData and InnerVault.
  4. VaultData derives Debug and Clone — ciphertext/nonce may leak in logs
    • File: src-tauri/src/crypto/vault.rs:35
    • CVE class: CWE-200 (Exposure of Sensitive Information), CWE-532
    • Attack vector: Debug logging of vault state leaks nonce + ciphertext, aidi
      ryptanalysis.
    • Fix: Implement custom Debug that redacts contents, or wrap in a zeroizing
      ainer.
  5. Timing side-channel on password length in derive_master_key
    • File: src-tauri/src/crypto/master_password.rs:64-67
    • CVE class: CWE-208 (Observable Timing Discrepancy)
    • Attack vector: Remote attacker measures response time to infer password le
      before offline cracking.
    • Fix: Perform length check in constant time, or use a fixed-time iteration
      counting. Better: remove length check from key derivation and enforce only
      UI/input layer, or ensure the chars().count() is done regardless of result
  6. AireMeta::source_machine_id PII exposed via Debug
    • File: src-tauri/src/data_portability/aire_format.rs:20
    • CVE class: CWE-200, CWE-532
    • Attack vector: Logs containing archive metadata reveal machine identity.
    • Fix: Implement custom Debug for AireMeta that redacts source_machine_id.
  7. TOCTOU in export_aire between reading DB path and reading DB bytes
    • File: src-tauri/src/data_portability/export.rs:116-118
    • CVE class: CWE-367 (Time-of-check Time-of-use)
    • Attack vector: Attacker with filesystem access swaps DB file between path
      y and read, causing export of tampered data.
    • Fix: Read DB bytes directly through the SQLite connection (e.g., backup AP
      read from the connection's file descriptor) instead of re-reading from fil
      tem path.
  8. Temp file for test archive created in world-readable temp dir
    • File: src-tauri/src/data_portability/aire_format.rs:66
    • CVE class: CWE-377 (Insecure Temporary File), CWE-200
    • Attack vector: Multi-user system attacker reads temp SQLite file before de
      on.
    • Fix: Use tempfile crate with NamedTempFile which creates files with restri
      permissions (0600), and ensure deletion happens via RAII guard.

  Suggestion
  ──────────

  9. AES-GCM random nonce: birthday bound risk under high volume
    • File: src-tauri/src/crypto/vault.rs:60-63
    • CVE class: CWE-323 (Reusing a Nonce, Key Pair in Encryption)
    • Attack vector: After ~2^32 encryptions, nonce collision probability become
      gnificant, leading to catastrophic key recovery.
    • Fix: Use a monotonic counter (e.g., 64-bit counter + 32-bit random) or swi
      to XChaCha20-Poly1305 (24-byte nonce) to eliminate birthday bound concerns
  10. verify_checksum string comparison not constant-time
    • File: src-tauri/src/data_portability/aire_format.rs:229
    • CVE class: CWE-208
    • Attack vector: Local attacker uses timing to guess checksum bytes (low sev
      y since checksum is public and not a secret).
    • Fix: Use subtle::ConstantTimeEq for defense in depth, though this is a low
      ority issue for public checksums.
  11. Client-side password length check bypassable
    • File: src/components/ux/MasterPasswordPrompt.tsx:28-31
    • CVE class: CWE-602 (Client-Side Enforcement of Server-Side Security)
    • Attack vector: User bypasses frontend validation and sends short password
      ackend.
    • Fix: Ensure backend (derive_master_key) enforces the same minimum length (
      lready does, so this is a defense-in-depth suggestion to validate backend
      lways called).
  12. checksum_file format parsing vulnerable to filenames with spaces
    • File: src-tauri/src/data_portability/aire_format.rs:258-270
    • CVE class: CWE-20 (Improper Input Validation)
    • Attack vector: Archive with malformed checksum line causes panic or incorr
      parsing.
    • Fix: Parse checksum lines using the sha256sum format properly (split on ex
      y two spaces, not arbitrary whitespace).
  13. open_encrypted_db with bundled SQLite is no-op encryption
    • File: src-tauri/src/crypto/master_password.rs:102-110
    • CVE class: CWE-311 (Missing Encryption)
    • Attack vector: PRAGMA key is silently ignored; database is stored plaintex
    • Fix: Either compile against SQLCipher or implement application-level encry
      n before writing to SQLite.
  14. Frontend recovery words persisted in React state until component unmounts
    • File: src/components/ux/RecoveryCodeModal.tsx:24
    • CVE class: CWE-316 (Cleartext Storage of Sensitive Information in Memory)
    • Attack vector: Recovery words remain in JavaScript heap; browser extension
      memory scraping can access them.
    • Fix: Clear recoveryWords from parent state immediately after modal closes;
      sider using a SecureStorage pattern.

  Let me double-check line numbers by referencing the code more carefully.

  For vault.rs lines:

  • VaultData struct: around line 35
  • encrypt_with_aes_gcm: around line 55
  • unlock_vault_with_master: around line 119

  For master_password.rs lines:

  • derive_master_key: around line 55
  • Password length check: around line 64
  • Return type: around line 72

  For recovery_code.rs lines:

  • RecoveryCodeError::InvalidWord: around line 42
  • derive_recovery_key: around line 82

  For aire_format.rs lines:

  • AireMeta struct: around line 20
  • verify_checksum: around line 229
  • build_checksum_file / parse_checksum_file: around line 258-270
  • with_test_cases: around line 66

  For export.rs lines:

  • export_aire: around line 100
  • DB path query and read: around line 116-118

  For import.rs lines:

  • import_aire: around line 86

  For RecoveryCodeModal.tsx:

  • recoveryWords prop: around line 24

  For MasterPasswordPrompt.tsx:

  • Password length check: around line 28

  I should format this nicely in Chinese as requested.

  Wait, let me reconsider the Critical vs Warning classification.

  The plaintext archive is definitely Critical if the DB contains PII. The _mast
  er_password parameter being unused is a clear indicator that encryption is not
  implemented yet.

  The RecoveryCodeError::InvalidWord leaking words is also quite serious because
  recovery codes are high-value secrets.

  Memory zeroize issues are Warning-level in most contexts unless the threat mod
  el includes local attackers with memory access.

  Let me also check if there are any SQL injection issues I missed.

  • export.rs: conn.execute_batch("BEGIN IMMEDIATE;") - safe.
  • export.rs: conn.query_row("SELECT file FROM pragma_database_list WHERE name=
    ain'", [], ...) - safe, no user input.
  • export.rs: count_cases_in_db uses hardcoded query.
  • aire_format.rs: with_test_cases uses parameterized query INSERT INTO cases (
    ) VALUES (?1) - safe.

  No SQL injection found.

  What about XSS?

  • React components escape output by default. No dangerouslySetInnerHTML usage.
    afe.

  What about auth issues?

  • unlock_vault_with_recovery in recovery_code.rs uses constant-time comparison
    good.
  • No obvious auth bypass.

  What about SSRF?

  • No network calls.

  Let me reconsider the import_aire issue. It takes _master_password: &str which
  is prefixed with underscore, meaning it's intentionally unused. The archive co
  ntains a raw SQLite DB. If this is a data portability feature, the exported ar
  chive is definitely sensitive. This is CWE-311.

  Another issue: In aire_format.rs, the open_archive function checks if db_bytes
  .is_empty() && !has_entry(...) but has_entry always returns true. This means i
  f db.sqlite is present but empty, the check passes. However, an empty DB might
  be valid in some cases. Not a security issue per se.

  In export.rs, export_aire uses u64::MAX for available in production (non-test)
  , so the disk space check is bypassed. This is noted as a TODO. Not a critical
  security issue yet since it's not wired to production.

  In import.rs, available_bytes_for_test returns u64::MAX in production, so disk
  space check is bypassed. Same as above.

  Let me finalize my findings and present them clearly.

• Used ReadFile (src-tauri/src/data_portability/import.rs)

• Used ReadFile (src-tauri/src/crypto/vault.rs)

• Used ReadFile (src-tauri/src/crypto/recovery_code.rs)

• Used ReadFile (src-tauri/src/data_portability/export.rs)

• Let me get a few more line numbers for accuracy.

• Used ReadFile (src-tauri/src/crypto/master_password.rs)

• Used ReadFile (src-tauri/src/data_portability/aire_format.rs)

• Used ReadFile (src-tauri/src/crypto/vault.rs)

• Now I have all the line numbers I need. Let me compile the final security audi
  t report in Chinese, categorized as Critical / Warning / Suggestion.

  Let me double-check one more thing - the vault.rs return types for unlock func
  tions.

• Used ReadFile (src-tauri/src/crypto/vault.rs)

• Used ReadFile (src-tauri/src/crypto/recovery_code.rs)

• Used ReadFile (src-tauri/src/data_portability/aire_format.rs)

• Now I have all the line numbers I need. Let me write the comprehensive securit
  y audit report in Chinese.

  Let me compile the findings:

  Critical
  ────────

  1. Export archive contains plaintext SQLite DB — import_aire accepts master_pa
     ord but does NOT use it
    • File: src-tauri/src/data_portability/import.rs:91
    • The archive contains raw db.sqlite. If exported archives are stored on dis
      mailed, or backed up, all case PII is exposed in plaintext.
    • CWE-311
    • Fix: Encrypt db_bytes with master_password-derived key before archiving; d
      pt in import_aire.
  2. RecoveryCodeError::InvalidWord leaks the actual attempted word in error mes
     e
    • File: src-tauri/src/crypto/recovery_code.rs:43
    • If errors are logged or returned to UI, partial recovery code is exposed.
    • CWE-209 / CWE-200
    • Fix: Remove word field from error; only log position or hash of word.

  Warning
  ───────

  3. Sensitive keys returned as plain [u8; 32] without zeroize
    • Files: src-tauri/src/crypto/master_password.rs:65, src-tauri/src/crypto/va
      rs:117, src-tauri/src/crypto/recovery_code.rs:95
    • Master key, DB key, recovery key remain in stack/memory after use.
    • CWE-226 / CWE-316
    • Fix: Return Zeroizing<[u8; 32]> or custom SecretKey type; zeroize VaultDat
      nerVault.
  4. VaultData derives Debug + Clone — ciphertext/nonce can leak in logs
    • File: src-tauri/src/crypto/vault.rs:30
    • Standard Debug prints raw bytes.
    • CWE-200 / CWE-532
    • Fix: Custom Debug impl redacting contents; remove Clone if not needed.
  5. Timing side-channel on password length in derive_master_key
    • File: src-tauri/src/crypto/master_password.rs:73
    • password.chars().count() iterates entire string before Argon2; early retur
      aks length.
    • CWE-208
    • Fix: Validate length with a constant-time check, or move validation to cal
      before derivation.
  6. AireMeta::source_machine_id PII exposed via Debug
    • File: src-tauri/src/data_portability/aire_format.rs:19
    • If archives or errors are logged, machine identity leaks.
    • CWE-200 / CWE-532
    • Fix: Custom Debug for AireMeta redacting source_machine_id.
  7. TOCTOU in export_aire between DB path query and filesystem read
    • File: src-tauri/src/data_portability/export.rs:116-124
    • File read happens after releasing the SQL connection's context but while h
      ng IMMEDIATE lock. Actually, looking at the code again: the locked_result
      ure runs while the transaction is active (IMMEDIATE), but it reads the fil
      th from pragma, then reads the file via std::fs::read. An attacker with fi
      stem access could swap the file between the pragma query and the read. The
      EDIATE lock doesn't protect the filesystem.
    • CWE-367
    • Fix: Use SQLite backup API or read directly through the connection without
      resolving the filesystem path.
  8. Test helper creates temp SQLite in world-readable directory without restric
     permissions
    • File: src-tauri/src/data_portability/aire_format.rs:76
    • std::env::temp_dir() is typically world-readable. The file is deleted afte
      ad, but there's a window where it's accessible.
    • CWE-377 / CWE-200
    • Fix: Use tempfile::NamedTempFile crate which sets 0600 permissions.
  9. parse_checksum_file uses split_whitespace() which breaks on filenames conta
     ng spaces
    • File: src-tauri/src/data_portability/aire_format.rs:280-291
    • sha256sum format uses exactly two spaces before filename. split_whitespace
      ould incorrectly parse filenames with tabs or multiple spaces.
    • CWE-20
    • Fix: Split on "  " (two spaces) with splitn(2, "  ") to match sha256sum fo
      .

  Suggestion
  ──────────

  10. AES-GCM 96-bit random nonce: birthday bound under high volume
    • File: src-tauri/src/crypto/vault.rs:66
    • After ~2^32 encryptions, nonce collision probability becomes non-negligibl
      eading to catastrophic key recovery.
    • CWE-323
    • Fix: Use XChaCha20-Poly1305 (24-byte nonce) or a counter-based nonce.
  11. verify_checksum uses standard string comparison (not constant-time)
    • File: src-tauri/src/data_portability/aire_format.rs:236
    • Low severity since checksums are public, but defense in depth.
    • CWE-208
    • Fix: Use subtle::ConstantTimeEq if checksums ever become sensitive.
  12. Client-side password length check bypassable
    • File: src/components/ux/MasterPasswordPrompt.tsx:28
    • Frontend enforces 8 chars but backend is the real gate.
    • CWE-602
    • Fix: Ensure backend (derive_master_key) always enforces minimum length (it
      s, so this is a reminder to keep it).
  13. open_encrypted_db with bundled SQLite is a no-op encryption
    • File: src-tauri/src/crypto/master_password.rs:102
    • PRAGMA key is silently ignored by standard SQLite. Database is plaintext.
    • CWE-311
    • Fix: Link against SQLCipher or implement application-level encryption.
  14. Recovery words remain in React state / DOM after modal interaction
    • File: src/components/ux/RecoveryCodeModal.tsx:24
    • Words persist in JS heap and DOM until component unmounts.
    • CWE-316
    • Fix: Clear recoveryWords from parent state immediately after user acknowle
      ; avoid keeping in props longer than necessary.

  Let me write this up clearly.

• aire-phase1-data-portability Security Audit
  ═══════════════════════════════════════════

  審查範圍：
  • src-tauri/src/data_portability/*
  • src-tauri/src/crypto/*
  • src/components/ux/RecoveryCodeModal.tsx
  • src/components/ux/MasterPasswordPrompt.tsx
  • src/components/ux/ImportConflictDialog.tsx
  ──────────────────────────────────────────────────────────────────────────────

  🔴 Critical
  ───────────

  C1. 匯出檔案為明文 SQLite — import_aire 接受 master_password 卻完全未使用
  ─────────────────────────────────────────────────────────────────────────
  • 檔案:行號: src-tauri/src/data_portability/import.rs:91
  • CVE 類別: CWE-311 (Missing Encryption of Sensitive Data)
  • 攻擊向量: 攻擊者取得 .aire 匯出檔後可直接讀取 db.sqlite，所有案件 PII（當事
    資料、地址、電話等）完全暴露，無需任何密鑰。
  • 修法: 在 create_archive 前以 master_password 衍生的金鑰加密 db_bytes（例如 S
    Cipher 或 AES-256-GCM envelope encryption）；import_aire 解密後再餘給 open_a
    hive。
  C2. RecoveryCodeError::InvalidWord 在錯誤訊息中回傳使用者輸入的實際單字
  ───────────────────────────────────────────────────────────────────────
  • 檔案:行號: src-tauri/src/crypto/recovery_code.rs:43
  • CVE 類別: CWE-209 (Information Exposure Through an Error Message) / CWE-200
  • 攻擊向量: 若錯誤被寫入 log、回傳前端或送進 telemetry，攻擊者可從錯誤訊息中直
    取得救援碼的其中一個單字，大幅降低暴力破解難度。
  • 修法: 移除 word: String 欄位，僅保留 position: usize；錯誤訊息改為 invalid r
    overy code word at position {position}，絕不回傳輸入內容。
  ──────────────────────────────────────────────────────────────────────────────

  🟡 Warning
  ──────────

  W3. 敏感金鑰以裸 [u8; 32] 回傳，缺乏記憶體清零機制
  ──────────────────────────────────────────────────
  • 檔案:行號:
    • src-tauri/src/crypto/master_password.rs:65 (derive_master_key)
    • src-tauri/src/crypto/vault.rs:117 (unlock_vault_with_master)
    • src-tauri/src/crypto/recovery_code.rs:95 (derive_recovery_key)
  • CVE 類別: CWE-226 (Sensitive Information in Resource Not Removed From Memory
    / CWE-316
  • 攻擊向量: 程序 crash 產生 core dump、swap 檔案、或記憶體 dump 時，master key
    DB key / recovery key 仍殘留在記憶體中。
  • 修法:
    • 回傳型別改為 Zeroizing<[u8; 32]> 或自訂 SecretKey wrapper
    • VaultData 與 InnerVault 實作 Zeroize + ZeroizeOnDrop，並在 drop 時覆寫 cip
      ext / nonce
  W4. VaultData 自動實作 Debug + Clone，可能透過 log 洩漏密文與 nonce
  ───────────────────────────────────────────────────────────────────
  • 檔案:行號: src-tauri/src/crypto/vault.rs:30
  • CVE 類別: CWE-200 (Exposure of Sensitive Information) / CWE-532
  • 攻擊向量: 任何對 vault state 的 {:?} debug 輸出（log、panic trace）都會印出
    整 ciphertext 與 nonce，降低破解門檻。
  • 修法: 手動實作 Debug 輸出 VaultData([REDACTED])；評估是否真需要 Clone，移除
    必要的 Clone。
  W5. derive_master_key 的密碼長度檢查存在 timing side-channel
  ────────────────────────────────────────────────────────────
  • 檔案:行號: src-tauri/src/crypto/master_password.rs:73
  • CVE 類別: CWE-208 (Observable Timing Discrepancy)
  • 攻擊向量: password.chars().count() 會遍歷整個字串後才回傳 PasswordTooShort，
    擊者測量回應時間即可推測密碼長度，縮短離線暴力破解空間。
  • 修法: 將長度驗證改為常數時間比較，或把長度檢查移至 UI / input 層，確保 deriv
    master_key 內部無論長短都執行相同路徑。
  W6. AireMeta::source_machine_id 為 PII，且透過 Debug 暴露
  ─────────────────────────────────────────────────────────
  • 檔案:行號: src-tauri/src/data_portability/aire_format.rs:19
  • CVE 類別: CWE-200 / CWE-532
  • 攻擊向量: 若 archive metadata 被 println!("{:?}", meta) 或 panic trace 記錄
    機器 ID 直接洩漏使用者身份與設備資訊。
  • 修法: 為 AireMeta 手動實作 Debug，對 source_machine_id 輸出 [REDACTED]。
  W7. export_aire 存在 TOCTOU — 查詢 DB 路徑與讀取檔案之間存在競態條件
  ────────────────────────────────────────────────────────────────────
  • 檔案:行號: src-tauri/src/data_portability/export.rs:116-124
  • CVE 類別: CWE-367 (Time-of-check Time-of-use)
  • 攻擊向量: 雖持有 SQLite BEGIN IMMEDIATE 鎖，但 std::fs::read(&db_path) 是重
    走 filesystem。具檔案系統存取權的攻擊者可於 pragma 查詢後、實際讀取前置換 db
    檔案，導致匯出被竄改的資料。
  • 修法: 不走 filesystem re-read，改用 SQLite backup API（backup_init）或從已開
    的 connection fd 直接讀取。
  W8. 測試輔助函式在 world-readable temp dir 建立明文 SQLite
  ──────────────────────────────────────────────────────────
  • 檔案:行號: src-tauri/src/data_portability/aire_format.rs:76
  • CVE 類別: CWE-377 (Insecure Temporary File) / CWE-200
  • 攻擊向量: 多使用者系統中，其他使用者可在檔案建立後、刪除前讀取 temp SQLite，
    得測試案件資料。
  • 修法: 使用 tempfile::NamedTempFile crate（自動設置 0600 權限），並以 RAII gu
    d 確保離開 scope 時必定刪除。
  W9. parse_checksum_file 使用 split_whitespace()，無法正確處理含空白檔名
  ───────────────────────────────────────────────────────────────────────
  • 檔案:行號: src-tauri/src/data_portability/aire_format.rs:280-291
  • CVE 類別: CWE-20 (Improper Input Validation)
  • 攻擊向量: sha256sum 格式為 HASH  FILENAME（兩個空格），若未來 archive entry
    稱含空白，split_whitespace() 會錯誤分割，可能導致驗證繞過或解析失敗。
  • 修法: 改用 line.splitn(2, "  ") 嚴格符合 sha256sum 格式規範。
  ──────────────────────────────────────────────────────────────────────────────

  🟢 Suggestion
  ─────────────

  S10. AES-GCM 96-bit random nonce 在高量加密下存在 birthday bound 風險
  ─────────────────────────────────────────────────────────────────────
  • 檔案:行號: src-tauri/src/crypto/vault.rs:66
  • CVE 類別: CWE-323 (Reusing a Nonce, Key Pair in Encryption)
  • 攻擊向量: 經過約 2^32 次加密後，nonce 碰撞機率不可忽略；AES-GCM nonce reuse
    導致 catastrophic key recovery。
  • 修法: 改用 XChaCha20-Poly1305（24-byte nonce，消除 birthday bound）或採用 co
    ter-based nonce（64-bit counter + 32-bit random）。
  S11. verify_checksum 使用標準字串比較（非 constant-time）
  ─────────────────────────────────────────────────────────
  • 檔案:行號: src-tauri/src/data_portability/aire_format.rs:236
  • CVE 類別: CWE-208
  • 攻擊向量: checksum 為公開資訊，風險極低；但若未來改為 MAC/HMAC 驗證，timing
    tack 可能洩漏 hash 位元。
  • 修法: 防禦性採用 subtle::ConstantTimeEq 做位元組比較。
  S12. 前端密碼長度檢查可被繞過
  ─────────────────────────────
  • 檔案:行號: src/components/ux/MasterPasswordPrompt.tsx:28
  • CVE 類別: CWE-602 (Client-Side Enforcement of Server-Side Security)
  • 攻擊向量: 使用者可繞過前端驗證直接呼叫後端 command；所幸後端 derive_master_k
    已有 8 code points 檢查。
  • 修法: 維持後端為唯一信任邊界，確保未來任何 API 路徑都強制後端驗證。
  S13. open_encrypted_db 使用 bundled SQLite 時 PRAGMA key 為 no-op
  ─────────────────────────────────────────────────────────────────
  • 檔案:行號: src-tauri/src/crypto/master_password.rs:102
  • CVE 類別: CWE-311
  • 攻擊向量: 標準 SQLite 會忽略 PRAGMA key，DB 實際上仍以明文儲存於磁碟，與預期
    加密行為不符。
  • 修法: 改連結 SQLCipher，或在寫入 DB 前於應用層完成 AES-GCM 加密。
  S14. Recovery words 長時間留存於 React state / DOM
  ──────────────────────────────────────────────────
  • 檔案:行號: src/components/ux/RecoveryCodeModal.tsx:24
  • CVE 類別: CWE-316 (Cleartext Storage of Sensitive Information in Memory)
  • 攻擊向量: 救援碼在 JS heap 與 DOM 中持續存在，惡意瀏覽器擴充功能或記憶體分析
    具可讀取。
  • 修法: 使用者按下「關閉」後，parent component 應立即將 recoveryWords 設為空陣
    ，縮短敏感資料在記憶體中的生命週期。
  ──────────────────────────────────────────────────────────────────────────────

  無發現項目說明
  ──────────────

  ┌───────────────────────────────┬───────────┬────────────────────────────────┐
  │ 檢查項                        │ 結果      │ 說明                           │
  ├───────────────────────────────┼───────────┼────────────────────────────────┤
  │ SQL Injection                 │ ✅ 無發現 │ 所有 SQL 皆為 hardcoded，參數  │
  │                               │           │ 化查詢正確使用 ?1              │
  │ XSS                           │ ✅ 無發現 │ React 預設 escape，無 dangerou │
  │                               │           │ slySetInnerHTML                │
  │ SSRF                          │ ✅ 無發現 │ 審查範圍內無任何網路請求       │
  │ Weak RNG / Nonce reuse (當前  │ ✅ 無發現 │ 目前皆使用 OsRng，nonce 每次隨 │
  │ 實作)                         │           │ 機產生                         │
  │ Auth bypass                   │ ✅ 無發現 │ unlock_vault_with_recovery 已  │
  │                               │           │ 使用 subtle::ConstantTimeEq    │
  └───────────────────────────────┴───────────┴────────────────────────────────┘

  ──────────────────────────────────────────────────────────────────────────────
  總結：2 項 Critical（明文匯出檔、錯誤訊息洩漏救援碼單字）、7 項 Warning（記憶
  體殘留、timing side-channel、TOCTOU、PII log 洩漏等）、5 項 Suggestion（nonce
  birthday bound、前端驗證提醒等）。建議優先處理 Critical，再處理 Warning 中的 m
  emory zeroize 與 timing attack。

```

## performance lens
```
• 用戶要求對特定目錄/檔案做 performance 審查，只看 5 個面向。我需要先讀取所有相
  關檔案，然後逐條分析。

  涉及的檔案/目錄：

  1. src-tauri/src/data_portability/
  2. src-tauri/src/crypto/
  3. src/components/RecoveryCodeModal.tsx
  4. src/components/MasterPasswordPrompt.tsx
  5. src/components/ImportConflictDialog.tsx

  讓我先列出這些目錄下的所有檔案，然後讀取它們。

• Used Glob (src-tauri/src/data_portability/**/*.rs)

• Used Glob (src-tauri/src/crypto/**/*.rs)

• 好的，現在我要讀取所有相關檔案。讓我分批讀取：

  • data_portability 模組檔案
  • crypto 模組檔案
  • 3 個 React 組件

  我會同時讀取所有檔案。

• Used ReadFile (src-tauri/src/data_portability/mod.rs)

• Used ReadFile (src-tauri/src/data_portability/aire_format.rs)

• Used ReadFile (src-tauri/src/data_portability/conflict.rs)

• Used ReadFile (src-tauri/src/data_portability/export.rs)

• Used ReadFile (src-tauri/src/data_portability/import.rs)

• Used ReadFile (src-tauri/src/crypto/mod.rs)

• Used ReadFile (src-tauri/src/crypto/master_password.rs)

• Used ReadFile (src-tauri/src/crypto/recovery_code.rs)

• Used ReadFile (src-tauri/src/crypto/vault.rs)

• Used ReadFile (src/components/RecoveryCodeModal.tsx)
  File not found

• Used ReadFile (src/components/MasterPasswordPrompt.tsx)
  File not found

• Used ReadFile (src/components/ImportConflictDialog.tsx)
  File not found

• 這三個 React 組件檔案不存在於 src/components/ 根目錄。讓我搜尋它們實際在哪裡。

• Used Grep (RecoveryCodeModal\.tsx)

• Used Grep (MasterPasswordPrompt\.tsx)

• Used Grep (ImportConflictDialog\.tsx)

• 這三個檔案在專案中似乎不存在。讓我用 Glob 搜尋看看它們是否存在於任何位置。

• Used Glob (src/**/RecoveryCodeModal.tsx)

• Used Glob (src/**/MasterPasswordPrompt.tsx)

• Used Glob (src/**/ImportConflictDialog.tsx)

• 找到了，它們在 src/components/ux/ 下面。讓我讀取它們。

• Used ReadFile (src/components/ux/RecoveryCodeModal.tsx)

• Used ReadFile (src/components/ux/MasterPasswordPrompt.tsx)

• Used ReadFile (src/components/ux/ImportConflictDialog.tsx)

• 現在我已經讀取了所有相關檔案。讓我逐一分析每個檔案的 performance 問題，按照用
  戶指定的 5 個面向：

  1. N+1 query / 迴圈 IO
  2. 不必要的 clone / allocation
  3. 缺 cache / 同操作重複
  4. 同步阻塞 async runtime
  5. 記憶體 leak / unbounded growth

  我需要對 Rust 和 TSX 檔案都做分析。

  src-tauri/src/data_portability/aire_format.rs
  ─────────────────────────────────────────────

  第 88-91 行：with_test_cases 中對 SQLite 做迴圈 INSERT，每個都是單獨 execute。
  這是 N+1 query 問題。 第 114-127 行：file_names() 每次調用都重新建立 ZipArchiv
  e，然後逐個 by_index 讀取 entry name。每次調用都分配 Vec<String>。 第 164-193
  行：create_archive 中 meta_json 和 db_bytes 都是 Vec<u8>，進入 zip 寫入時傳引
  用，還好。 第 227-232 行：has_entry 總是回傳 true，但 open_archive 中 db_bytes
  .is_empty() 且 !has_entry() 的檢查永遠不會觸發（因為 has_entry 回傳 true）。這
  是邏輯問題但不是 performance。 第 296-301 行：build_checksum_file 中用 format…
  建立字串，然後 push_str。可以用 write! 直接寫入 String，避免中間 format! 的 al
  location。或者直接用 with_capacity。

  src-tauri/src/data_portability/export.rs
  ────────────────────────────────────────

  第 111-162 行：export_aire 使用 BEGIN IMMEDIATE/ROLLBACK 在 rusqlite Connectio
  n 上。這是同步阻塞，如果在 async runtime（如 tokio）中被呼叫會阻塞 worker 線程
  。這屬於「同步阻塞 async runtime」。 第 124 行：std::fs::read(&db_path) 在持有
  資料庫鎖的時候讀取檔案。還好，因為是讀取同一個連線的資料庫檔案。

  src-tauri/src/data_portability/import.rs
  ────────────────────────────────────────

  第 91-101 行：import_aire 中 std::fs::read(file_path) 把整個檔案讀入記憶體。對
  於大檔案可能 OOM，但目前 aire 檔案應該不大。不算 critical，但可以標 Warning。
  第 75-85 行：detect_conflicts 中對 incoming_ids 做 filter，每次查 HashSet，這
  是 O(1)，沒有 N+1 問題。

  src-tauri/src/crypto/master_password.rs
  ───────────────────────────────────────

  第 78-84 行：每次 derive_master_key 都重新建立 Params 和 Argon2。Argon2::new
  是輕量級操作，Params::new 也是。不算大問題。 第 96-103 行：hex_encode 使用 Str
  ing::with_capacity，很好。 第 109-120 行：open_encrypted_db 是同步資料庫操作。

  src-tauri/src/crypto/recovery_code.rs
  ─────────────────────────────────────

  第 51-53 行：bip39_wordlist_contains 每次調用都呼叫 Language::English.word_lis
  t()。讓我檢查 bip39 crate 的實作... word_list() 回傳 &'static [&str; 2048]，應
  該是 O(1)。但 contains 是線性搜尋 2048 個字。每次 validate_recovery_code 對 1…
  個字各做一次線性搜尋，共 12*2048 次比較。這可以接受，但如果頻繁驗證可以建 Hash
  Set。屬於 Suggestion。 第 63-70 行：validate_recovery_code 中對每個 word 做 to
  _string()，實際上在錯誤時才需要。但如果沒有錯誤，這些字串不會被建立。等等，看
  程式碼：只有在 !bip39_wordlist_contains(w) 時才會建立 to_string()。這還好。  …
  97 行：derive_recovery_key 中 words.join(" ") 建立新字串，然後傳給 derive_mast
  er_key。這裡的 normalized 是 Zeroizing<String>。words 是 &[&str]，join 需要分
  配。這是必要的。 第 102 行：static VAULT_RECOVERY_STORE: OnceLock<Mutex<HashMa
  p<String, RecoveryCode>>>。這個 HashMap 會隨著 vault 數量增長而無限增長。new_f
  or_test 不斷插入新條目，reset_recovery_code 也會插入。如果沒有清理機制，這是記
  憶體 leak / unbounded growth。Critical 或 Warning。 第 167-196 行：check_recov
  ery_code_persistence 遞迴遍歷 app_data_dir 下所有檔案，並讀取每個檔案內容到記
  憶體。如果目錄很大或檔案很多，這會阻塞且記憶體暴漲。這是「迴圈 IO」+「記憶體暴
  漲」+「同步阻塞 async runtime」的綜合問題。

  src-tauri/src/crypto/vault.rs
  ─────────────────────────────

  第 41 行：Vault 使用 RefCell<InnerVault>。RefCell 不是 Send/Sync。如果在多執行
  緒環境中使用會有問題，但這可能不是 performance 問題。 第 120 行：unlock_vault_
  with_master 中 inner.master.clone()，複製了整個 ciphertext Vec<u8> 和 nonce Ve
  c<u8>。如果 ciphertext 很大（加密整個資料庫金鑰，應該只有 32 bytes + tag），所
  以不大。但對於 VaultData 來說，這是不必要的 clone，可以用借用的方式。Warning …
  第 139 行：unlock_vault_with_recovery 同樣有 clone()。

  src/components/ux/RecoveryCodeModal.tsx
  ───────────────────────────────────────

  第 4 行：import "@testing-library/jest-dom/vitest" 在生產組件中。這會把測試程
  式碼打包進生產 bundle，增加 bundle size。不屬於 5 個 performance 面向，但值得
  一提？用戶說只看 5 個面向，所以這不算。 第 17-20 行：defaultDownloadPdf 使用動
  態 import("@tauri-apps/api/core")。每次點擊都會重新 import，雖然瀏覽器/打包工
  具會快取，但每次還是會產生 promise 開銷。Suggestion。 第 97-105 行：recoveryWo
  rds.map 每次渲染都執行，這是 React 正常行為，不算問題。 第 100 行：key={${word
  }-${index}}。如果 word 重複可能會有 key 衝突，但不影響 performance。

  src/components/ux/MasterPasswordPrompt.tsx
  ──────────────────────────────────────────

  第 25 行：[...password].length < 8。每次輸入都建立一個陣列（spread string int…
  array）。對於密碼欄位來說，字串很短，開銷極小。但嚴格來說是不必要的 allocation
  。可以用 Array.from(password) 或更直接地檢查。或者用 Intl.Segmenter？不，[...p
  assword] 是為了計算 Unicode code points（因為 .length 回傳 UTF-16 code units）
  。但 [...string] 會建立一個 iterator 然後展開成陣列。對於短密碼幾乎沒影響。Sug
  gestion。

  src/components/ux/ImportConflictDialog.tsx
  ──────────────────────────────────────────

  沒有明顯的 performance 問題。state 管理簡單。

  讓我整理出正式的報告。

  ──────────────────────────────────────────────────────────────────────────────
  Critical
  ────────

  1. src-tauri/src/crypto/recovery_code.rs:102 - VAULT_RECOVERY_STORE 是靜態 Has
     p，new_for_test 與 reset_recovery_code 持續寫入且無清理機制。隨 vault 數量
     而無限增長。
    • 量級：長期運行下數百/數千個 vault 條目，每個 RecoveryCode 約數十 bytes，但
      上為 unbounded growth。
    • 修法：加入過期/清理機制，或使用 LRU cache；或至少提供 clear_vault_recovery
      lt_id) API。
  2. src-tauri/src/crypto/recovery_code.rs:167-196 - check_recovery_code_persist
     e 遞迴掃描 app_data_dir，對每個檔案執行 std::fs::read 並載入完整內容到記憶
    • 量級：若 app_data_dir 有 10,000 個檔案，每個 1MB，則觸發 10GB 的 IO 與記憶
      峰。
    • 修法：改為 streaming read（BufReader + 逐 chunk 比對），或限制檔案大小上限
      進一步應在背景 thread 執行，不要阻塞 async runtime。
  3. src-tauri/src/data_portability/export.rs:111-162 - export_aire 在 SQLite 上
     行 BEGIN IMMEDIATE / ROLLBACK 與 fs::read，均為同步阻塞操作。
    • 量級：資料庫越大（例如 500MB），fs::read 阻塞時間越長，直接凍結 tokio work
      hread（預設為 OS thread 數量）。
    • 修法：包裝在 tokio::task::spawn_blocking 或 tauri::async_runtime::spawn 中
      。

  Warning
  ───────

  4. src-tauri/src/data_portability/aire_format.rs:88-91 - with_test_cases 在迴
     對 SQLite 執行單條 INSERT，無 transaction batching。
    • 量級：N 筆資料 = N 次 fsync。10,000 筆可能比 batched 慢 100~1000 倍。
    • 修法：改為 BEGIN; ... COMMIT; 或一次性 INSERT INTO cases VALUES (...), (..
  5. src-tauri/src/data_portability/aire_format.rs:114-127 - file_names() 每次呼
     都從頭建立 ZipArchive，並把全部 entry name 收集到 Vec<String>。
    • 量級：O(N) 記憶體分配與解壓標頭開銷，N = entry 數量。
    • 修法：若需多次查詢，考慮快取 names；或改為 lazy iterator 不一次性 collect
  6. src-tauri/src/data_portability/aire_format.rs:296-301 - build_checksum_file
     續使用 format! 產生臨時 String 再 push_str。
    • 量級：每筆多 2 次小 allocation（~64 bytes）。
    • 修法：直接 write!(&mut out, "{}  {}\n", ...) 避免中間 String。
  7. src-tauri/src/crypto/vault.rs:120 - unlock_vault_with_master 中 inner.maste
     lone() 複製整份 VaultData（含 ciphertext/nonce Vec）。
    • 量級：雖然目前 ciphertext 不大（AES-GCM 加密 32-byte key + 16-byte tag = 4
      tes），但介面隱含每次 unlock 都堆分配。
    • 修法：解鎖函式改為回傳 reference / borrow，或把 VaultData 改成固定大小的陣
      [u8; N]）放在 stack。
  8. src-tauri/src/crypto/vault.rs:139 - unlock_vault_with_recovery 同 #7，有相
     clone()。
  9. src-tauri/src/data_portability/import.rs:91-101 - import_aire 使用 std::fs:
     ad 將整個 .aire 檔案載入 Vec<u8>。
    • 量級：若檔案達數百 MB，會造成瞬間等量記憶體占用。
    • 修法：後續若支援大檔案，應改用 mmap 或 streaming ZIP reader。
  10. src-tauri/src/crypto/recovery_code.rs:51-53 - bip39_wordlist_contains 每次
      都對 2048 個靜態字串做線性搜尋。
    • 量級：validate_recovery_code 驗證 12 個字 ≈ 24,576 次字串比較。單次極快，
      在熱路徑（如每次解鎖都驗證）累積可觀。
    • 修法：用 lazy_static!/OnceLock 建立 HashSet<&'static str> 做 O(1) 查詢。

  Suggestion
  ──────────

  11. src-tauri/src/crypto/master_password.rs:113-114 - open_encrypted_db 中 hex
      key_spec 都包成 Zeroizing，但 key_spec 用了 format! 額外 allocation。
    • 量級：極小（96 bytes 左右）。
    • 修法：let mut key_spec = Zeroizing::new(String::with_capacity(2 + hex.len(
      write!(key_spec, "x'{}'", hex);
  12. src/components/ux/RecoveryCodeModal.tsx:17-20 - defaultDownloadPdf 每次觸
      重新動態 import。
    • 量級：每次產生新的 Promise 與模組解析開銷，雖 bundler 會快取模組物件。
    • 修法：在模組頂層 import 並包裝成函式引用；若堅持 lazy-load，可用 React.use
      或 React.useMemo 快取 import Promise。
  13. src/components/ux/MasterPasswordPrompt.tsx:25 - [...password].length 每次
      都建立臨時陣列。
    • 量級：密碼長度通常 < 100，影響可忽略。
    • 修法：用 Array.from(password).length（語意相同但 intent 較清楚），或若只需
      e length 可用 new TextEncoder().encode(password).length（但語義不同）。
  14. src-tauri/src/data_portability/aire_format.rs:227-232 - has_entry() 永遠回
      rue，導致 db_bytes.is_empty() && !has_entry() 的檢查失效。
    • 量級：邏輯層面，若 ZIP 確實缺少 db.sqlite 但 db_bytes 非空（不應發生），無
      確報錯。
    • 修法：實作真正的 has_entry，或移除無效檢查。
  15. src-tauri/src/crypto/recovery_code.rs:97 - derive_recovery_key 中 words.jo
      ") 每次都重建 normalized 字串。
    • 量級：12 個字 ≈ < 100 bytes。
    • 修法：若呼叫端已持有原始 12-word 字串，可直接傳入避免重新 join。

  讓我再仔細看看還有沒有遺漏。

  aire_format.rs 第 330-334 行 sha256_hex：每次呼叫都建立新的 Sha256 hasher，這
  是必要的。 aire_format.rs 第 171 行 create_archive 中 FileOptions::<()>::defau
  lt()。這是 zip crate 的 API，沒問題。

  import.rs 第 75-85 行 detect_conflicts：使用了 HashSet，這是對的。但 existing_
  ids 如果很大，建立 HashSet 是 O(N)。這是預期的。

  export.rs 第 97-102 行 count_cases_in_db：單條 COUNT(*)，沒問題。

  RecoveryCodeModal.tsx 第 33-40 行 useEffect：每次 isOpen 變化就重置 state，這
  是正常行為。

  MasterPasswordPrompt.tsx 第 33-34 行：onUnlock 成功後 setPassword("")。如果 on
  Unlock 拋出異常，也會 setPassword("")。這是 UX 決定，不是 performance。

  還有什麼嗎？

  aire_format.rs 第 71 行 let bytes = create_archive(Vec::new(), meta)?; 在 new_
  empty() 中。這會建立一個空的 zip。量級很小。

  export.rs 第 145 行 let available = u64::MAX; 這是 TODO，不是 performance bug
  ，但代表 disk check 永遠通過。用戶只關心 performance，不是功能完整性。

  crypto/recovery_code.rs 第 147-161 行 unlock_vault_with_recovery：store().lock
  () 取得 MutexGuard，然後在 guard 範圍內做 ct_eq。這會在持有鎖期間進行比較。比
  較時間很短，沒問題。但更重要的是，這個函數目前沒有在 async context 中使用，但
  如果被 tauri command 呼叫而 tauri 是 async，這會阻塞 worker thread。不過這個函
  數非常快（只是記憶體比較），不像 export_aire 那樣會做大量 IO。

  crypto/master_password.rs 第 65-94 行 derive_master_key：Argon2 計算是 CPU-int
  ensive 且故意 slow 的。如果在 async runtime 中直接呼叫，會阻塞 worker thread
  數百毫秒。這非常嚴重！

  • 量級：Argon2id with m=19MiB, t=2, p=1 在現代 CPU 約需 50-200ms。在 tokio 預
    worker thread pool（通常等於 CPU 核心數）中直接執行，會凍結整個 async runtim
    的執行緒。
  • 這是 Critical：「同步阻塞 async runtime」。

  還有 recovery_code.rs 第 97-99 行 derive_recovery_key 也會呼叫 derive_master_k
  ey，同樣問題。

  我應該把 Argon2 阻塞加到 Critical。

  再檢查一下：vault.rs 的 encrypt_with_aes_gcm 和 decrypt_with_aes_gcm。AES-GCM
  很快，不會阻塞太久。

  data_portability/export.rs:124 std::fs::read(&db_path) 在持有 IMMEDIATE lock
  時讀取。這是讀取整個資料庫檔案。如果資料庫很大，這會阻塞。這已經列為 Critical
  。

  還有 aire_format.rs:file_names() 每次建立 ZipArchive。ZipArchive::new 會解析中
  央目錄結構。這是 IO（從記憶體 Cursor），但對於小檔案很快。不過每次呼叫都重新 p
  arse，如果頻繁呼叫是浪費。我已列為 Warning。

  讓我再檢查 RecoveryCodeModal.tsx 的 import "@testing-library/jest-dom/vitest"
  。這在生產 bundle 中會增加不必要的程式碼。用戶說只看 5 個面向，這是 bundle siz
  e 問題，不屬於那 5 類。我應該不報。

  MasterPasswordPrompt.tsx 中 onSubmit 後 setPassword("") 在 catch 和正常路徑都
  執行。這是 UX，不是 performance。

  ImportConflictDialog.tsx 中沒有 memo，但組件很簡單，render 成本極低。不報。

  讓我整理最終清單，按照 Critical / Warning / Suggestion。

  Critical:

  • C1: crypto/recovery_code.rs:102 - VAULT_RECOVERY_STORE unbounded growth
  • C2: crypto/recovery_code.rs:167-196 - check_recovery_code_persistence recurs
    e file read
  • C3: crypto/master_password.rs:65-94 / crypto/recovery_code.rs:95-100 - Argon
    CPU-intensive in async runtime
  • C4: data_portability/export.rs:111-162 - export_aire sync IO blocks async ru
    ime

  Warning:

  • W1: data_portability/aire_format.rs:88-91 - loop INSERT without transaction
  • W2: data_portability/aire_format.rs:114-127 - file_names() rebuilds ZipArchi
    every call
  • W3: data_portability/aire_format.rs:296-301 - build_checksum_file redundant
    rmat! allocations
  • W4: crypto/vault.rs:120,139 - unnecessary clone of VaultData
  • W5: data_portability/import.rs:92 - import_aire loads entire file into memor
  • W6: crypto/recovery_code.rs:51-53 - linear search in BIP39 wordlist

  Suggestion:

  • S1: crypto/master_password.rs:113-114 - avoid format! in Zeroizing
  • S2: components/ux/RecoveryCodeModal.tsx:17-20 - dynamic import on every clic
  • S3: components/ux/MasterPasswordPrompt.tsx:25 - spread array allocation
  • S4: data_portability/aire_format.rs:227-232 - has_entry() always true, dead
    eck
  • S5: crypto/recovery_code.rs:97 - words.join(" ") rebuilds string

  等等，我需要確認 derive_master_key 是否真的會被 async runtime 呼叫。看起來這是
  一個純 Rust 函式庫，沒有直接在這些檔案中暴露為 tauri command。但用戶要求對這些
  「程式碼」做審查，不論目前是否被 async 呼叫。這是一個 library，如果上層在 asyn
  c context 中使用就會阻塞。從 library 設計角度，標記為 Warning 或 Critical 都可
  以。但我覺得 Argon2 的設計本來就是故意 slow 的，如果 caller 沒有放到 spawn_blo
  cking 就是 caller 的責任。不過從 codebase 的角度，如果這些函數最終會被 tauri c
  ommand 呼叫（而 tauri command 預設是 async），那就是 Critical。我會標 Critica…
  並註明「若由 async command 呼叫」。

  讓我寫出最終報告。用繁體中文，因為用戶用繁體中文提問。

  格式：

  Critical
  ────────

  • 檔案:行號 簡短描述
    • 量級估算：...
    • 修法：...

  Warning
  ───────

  ...

  Suggestion
  ──────────

  ...

  讓我再確認一些細節。

  C2 check_recovery_code_persistence： 量級：app_data_dir 若包含數萬個檔案，每個
  都 read 到記憶體。Tauri app data 通常不會有這麼多，但「理論上」unbounded。 修
  法：streaming read + 設定單檔上限。

  C3 Argon2： 量級：m=19MiB, t=2，約 50-200ms CPU time。 修法：在 tokio::task::s
  pawn_blocking 中執行 derive_master_key；或標記函數為 #[tauri::command] 時使用
  async 並內部 spawn_blocking。

  C4 export_aire： 量級：db size = N bytes，全部讀入記憶體。若 N=500MB，則阻塞 5
  00MB 的 read IO。 修法：spawn_blocking + 考慮 streaming copy。

  W1 with_test_cases： 這是 test helper，用戶說「只看程式碼」。test helper 如果
  慢會拖慢測試。可以報。 量級：case_count=1000 時，1000 次獨立 INSERT。 修法：包
  在 transaction 中。

  W2 file_names()： 量級：zip.len() 個 entry，每次調用都 parse central directory
  。 修法：在 AireArchive 中快取 names 或只在需要時調用。

  W3 build_checksum_file： 量級：極小，2 次 format! allocation。 修法：用 write!
  。

  W4 vault.rs clone： 量級：很小（~48 bytes ciphertext）。 修法：改為 borrow。

  W5 import.rs std::fs::read： 量級：與檔案大小相等。 修法：streaming zip reader
  。

  W6 bip39_wordlist_contains： 量級：12 * 2048 = 24,576 次字串比較。 修法：lazy
  static HashSet。

  S1 master_password.rs format： 量級：~96 bytes。 修法：write!。

  S2 RecoveryCodeModal dynamic import： 量級：小，Promise 開銷。 修法：頂層 impo
  rt。

  S3 MasterPasswordPrompt [...password]： 量級：極小。 修法：用 Array.from。

  S4 has_entry： 量級：邏輯錯誤，非 performance。用戶說只看 5 個面向。這個比較偏
  功能，但會導致不必要的檢查流程。也許不報？或者說因為永遠回傳 true，導致 is_emp
  ty() 檢查永遠無法短路，浪費一次判斷？這太牽強了。不報。

  S5 words.join(" ")： 量級：極小。 修法：若呼叫端有原始字串直接傳入。

  我覺得 S4 可以換成另一個： aire_format.rs:164 create_archive 接收 db_bytes: Ve
  c<u8>，然後內部寫入 zip。caller 必須把資料庫全部讀入 Vec<u8>（在 export.rs:12…
  已經做了）。這是記憶體上的全量複製。但這是設計決定，沒有明顯更好的方式（zip 需
  要 sequential write）。

  另一個 Suggestion： aire_format.rs:20-23 AireMeta 有 #[serde(default)] 在 sour
  ce_machine_id 和 format_version。這不是 performance。

  conflict.rs:50-58 apply_strategy_to_all 中對每個 item 呼叫 resolve_single_conf
  lict，這是 iterator chain，沒有額外 clone。沒問題。

  好的，我覺得現在的清單夠完整了。讓我寫出報告。

  我還想確認一下 data_portability/export.rs:124 std::fs::read(&db_path) 在持有 B
  EGIN IMMEDIATE lock 時執行。這在 SQLite 中是可以的，因為讀取底層檔案時資料庫已
  被鎖定。但如果其他 process 也在嘗試寫入，這個 read 可能會讀到不一致的狀態？不
  ，IMMEDIATE lock 確保了讀取一致性。這不是 bug。但 IO 量大會阻塞。

  還有 import.rs:91-101 import_aire 讀取整個檔案後傳給 open_archive。open_archiv
  e 又建立 ZipArchive。這是雙重複製（bytes -> opened）。但 open_archive 的參數 …
  &[u8]，所以沒有複製。還好。

  最後檢查 crypto/vault.rs： VaultData { ciphertext: Vec<u8>, nonce: Vec<u8> } s
  tore_vault_master 中 encrypt_with_aes_gcm 回傳 (Vec<u8>, Vec<u8>)，這些 Vec 被
  移入 VaultData。沒有多餘 clone。 unlock 時 inner.master.clone() 複製了 VaultDa
  ta，也就是複製了兩個 Vec。這是我標的 W4。

  Vault 本身沒有實現 Drop，但 VaultData 是 Vec，會自動釋放。沒有 leak。

  好的，開始寫報告。

• Performance 審查報告：aire-phase1-data-portability
  ──────────────────────────────────────────────────

  以下僅針對 N+1 query / 迴圈 IO、不必要的 clone / allocation、缺 cache / 同操作
  重複、同步阻塞 async runtime、記憶體 leak / unbounded growth 五個面向分類。

  ──────────────────────────────────────────────────────────────────────────────

  🔴 Critical
  ───────────

  • src-tauri/src/crypto/recovery_code.rs:102 — VAULT_RECOVERY_STORE 為無上限靜
    HashMap，new_for_test 與 reset_recovery_code 持續寫入且無清理機制。
    • 量級估算：長期運行下每個 vault 留存一份 RecoveryCode（~60 bytes + HashMap
      y overhead），屬於 unbounded growth；測試或高周轉場景下會持續累積。
    • 修法：提供 remove_vault_recovery(vault_id) API，或改用 LRU / TTL cache；測
      務必清理。
  • src-tauri/src/crypto/recovery_code.rs:167-196 — check_recovery_code_persiste
    e 遞迴掃描 app_data_dir，對每個檔案執行 std::fs::read 並將完整內容載入記憶體
    對。
    • 量級估算：若目錄含 10,000 個檔案、每個 1MB，將觸發 ~10GB 的 IO 讀取與記憶
      峰；同時同步阻塞呼叫執行緒。
    • 修法：改為 BufReader 逐 chunk（如 8KB）讀取並比對，設定單檔讀取上限；若由
      c runtime 呼叫，務必包進 spawn_blocking。
  • src-tauri/src/crypto/master_password.rs:65-94 / src-tauri/src/crypto/recover
    code.rs:95-100 — derive_master_key 執行 Argon2id（m=19 MiB, t=2），屬高成本
    U-bound 運算。若由 Tauri async command 或 tokio runtime 直接呼叫，會凍結 wor
    r thread。
    • 量級估算：單次約 50–200ms CPU time；在 tokio 預設線程池（通常 = CPU 核心數
      同步執行，會直接癱瘓該執行緒上的所有 async 任務。
    • 修法：任何暴露給 command 的呼叫路徑必須包在 tokio::task::spawn_blocking（
      uri 對應機制）中；library 層面可在文件標註 #[doc(alias = "cpu-intensive")]
  • src-tauri/src/data_portability/export.rs:111-162 — export_aire 在 SQLite con
    ction 上執行 BEGIN IMMEDIATE、std::fs::read(db_path) 與 create_archive，皆為
    步阻塞 IO/CPU 操作。
    • 量級估算：資料庫若達 500MB，fs::read + ZIP 打包將阻塞數百毫秒至數秒，直接
      async runtime worker。
    • 修法：整個函數主體應移入 spawn_blocking；fs::read 可考慮改用 std::fs::File
      td::io::copy 減少記憶體尖峰。
  ──────────────────────────────────────────────────────────────────────────────

  🟡 Warning
  ──────────

  • src-tauri/src/data_portability/aire_format.rs:88-91 — with_test_cases 在 for
    迴圈內對 SQLite 執行單條 INSERT，無 transaction batching。
    • 量級估算：N 筆資料 = N 次 journal fsync；10,000 筆可能比 batched transacti
      慢 100–1000 倍。
    • 修法：改為 BEGIN; ... COMMIT; 或使用  rusqlite::Connection::execute_batch
      整個迴圈。
  • src-tauri/src/data_portability/aire_format.rs:114-127 — file_names() 每次呼
    都從頭建立 ZipArchive，並將全部 entry names collect() 到 Vec<String>。
    • 量級估算：O(N) 的 central directory 重新解析 + N 次 String allocation（N =
      ry 數）。
    • 修法：若同一 AireArchive 會多次查詢，將 names 快取在 struct 內；或改為回傳
      y iterator 避免一次性 collect。
  • src-tauri/src/data_portability/aire_format.rs:296-301 — build_checksum_file
    續使用 format! 產生臨時 String 再 push_str。
    • 量級估算：每筆多 2 次小 allocation（~64 bytes），量雖小但可輕易避免。
    • 修法：改為 write!(&mut out, "{}  {}\n", sha256_hex(db), ARCHIVE_DB_FILENAM
      零多餘 allocation。
  • src-tauri/src/crypto/vault.rs:120 與 :139 — unlock_vault_with_master / unloc
    vault_with_recovery 中 inner.master.clone() / inner.recovery.clone() 複製整
    VaultData（含 Vec<u8>）。
    • 量級估算：目前 ciphertext 不大（加密 32-byte key + tag ≈ 48 bytes），但每
      lock 都觸發堆分配；若未來 ciphertext 變大會線性增長。
    • 修法：將 VaultData 改為固定大小的 stack array（如 [u8; 48] + [u8; 12]），
      unlock 改回傳 borrowed slice / reference。
  • src-tauri/src/data_portability/import.rs:92 — import_aire 使用 std::fs::read
    將整個 .aire 檔案載入 Vec<u8>。
    • 量級估算：記憶體占用與檔案大小 1:1；若未來支援大型備份（數百 MB），會造成
      OOM 風險。
    • 修法：後續若需支援大檔案，改用 memmap2::Mmap 或 streaming ZIP reader。
  • src-tauri/src/crypto/recovery_code.rs:51-53 — bip39_wordlist_contains 每次呼
    都對 2048 個靜態字串做線性搜尋。
    • 量級估算：validate_recovery_code 驗證 12 個字 ≈ 24,576 次字串比較；單次微
      ，但若處於熱路徑（如每次 UI 輸入即時驗證）會累積。
    • 修法：以 OnceLock<HashSet<&'static str>> 建立快取，將查詢降為 O(1)。
  ──────────────────────────────────────────────────────────────────────────────

  🟢 Suggestion
  ─────────────

  • src-tauri/src/crypto/master_password.rs:113-114 — open_encrypted_db 中 key_s
    c 使用 format! 產生額外 allocation。
    • 量級估算：極小（~96 bytes）。
    • 修法：改用 write! 寫入預先 with_capacity 的 Zeroizing<String>。
  • src/components/ux/RecoveryCodeModal.tsx:17-20 — defaultDownloadPdf 每次點擊
    重新動態 import("@tauri-apps/api/core")。
    • 量級估算：每次產生新的 Promise 與模組解析開銷，雖 bundler 會快取模組物件。
    • 修法：在模組頂層靜態 import；若堅持 lazy-load，用 useRef 或 useMemo 快取 i
      t Promise。
  • src/components/ux/MasterPasswordPrompt.tsx:25 — [...password].length 每次輸
    都建立臨時陣列以計算 Unicode code points。
    • 量級估算：密碼長度通常 < 100，影響可忽略。
    • 修法：語意相同下改為 Array.from(password).length（intent 較清楚），或視需
      接使用 password.length（若 ASCII 足夠）。
  • src-tauri/src/crypto/recovery_code.rs:97 — derive_recovery_key 中 words.join
    ") 每次呼叫都重建 normalized 字串。
    • 量級估算：12 個英文單字 < 100 bytes。
    • 修法：若呼叫端已持有原始的 12-word 句子字串，直接傳入即可避免重新 join。

```

## spectra audit
```
error: unrecognized subcommand 'audit'

  tip: a similar subcommand exists: 'update'

Usage: spectra [OPTIONS] <COMMAND>

For more information, try '--help'.
⚠️ spectra audit failed
```

## spectra drift
```
Drift Report: aire-phase1-data-portability
  Created: 2026-05-14

  Dimension   Status                               Score
  Time        fresh (0d)                              +0
  Structure   1/20 anchors broken                     +1
  Tasks       0 blocked, 0 maybe-done                 +0
  Environment 0 commits                                —
  Total                                                1

Broken anchors
  - --package (CliFlag) — not in --help

Severity: LIGHT drift
> /spectra-apply aire-phase1-data-portability
```
