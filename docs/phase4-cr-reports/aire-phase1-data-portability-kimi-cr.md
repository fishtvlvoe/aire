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

