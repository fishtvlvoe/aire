# Phase 4 Kimi CR Report — aire-phase1-legal-clauses-autofill

Date: 2026-05-14T08:29:33Z
Paths reviewed: src-tauri/src/legal_clauses src-tauri/src/realtor_license src/lib/pdf-blocks/legal-notice.tsx src/components/RealtorLicenseField.tsx

## correctness lens
```
• 用戶要求我對 aire-phase1-legal-clauses-autofill 這個 Spectra change 的四個程式
  碼路徑做 correctness 審查：

  1. src-tauri/src/legal_clauses
  2. src-tauri/src/realtor_license
  3. src/lib/pdf-blocks/legal-notice.tsx
  4. src/components/RealtorLicenseField.tsx

  需要關注：

  1. 邏輯錯誤 / 邊界條件 / 型別誤用
  2. unwrap/panic 在 production code
  3. Result/Option 處理是否完整
  4. lifetime / borrow checker 邊界
  5. async/await 死鎖、未 await 的 Future

  輸出格式：Critical / Warning / Suggestion，每條附檔案:行號 + 具體問題 + 建議修
  法。

  我需要先找到這些檔案，然後逐一審查。讓我先搜尋這些檔案。

• Used Glob (src-tauri/src/legal_clauses/**/*)

• Used Glob (src-tauri/src/realtor_license/**/*)

• Used Glob (src/lib/pdf-blocks/legal-notice.tsx)

• Used Glob (src/components/RealtorLicenseField.tsx)

• 找到了所有檔案。讓我逐一讀取它們來進行審查。我會同時讀取所有檔案以提高效率。

• Used ReadFile (src-tauri/src/legal_clauses/mod.rs)

• Used ReadFile (src-tauri/src/legal_clauses/cache.rs)

• Used ReadFile (src-tauri/src/legal_clauses/scheduler.rs)

• Used ReadFile (src-tauri/src/legal_clauses/sync.rs)

• Used ReadFile (src-tauri/src/realtor_license/mod.rs)

• Used ReadFile (src-tauri/src/realtor_license/cache.rs)

• Used ReadFile (src-tauri/src/realtor_license/client.rs)

• Used ReadFile (src/lib/pdf-blocks/legal-notice.tsx)

• Used ReadFile (src/components/RealtorLicenseField.tsx)

• 好的，我現在已經讀完了所有需要審查的檔案。讓我逐一分析每個檔案的 correctness
  問題。

  1. src-tauri/src/legal_clauses/mod.rs
  ─────────────────────────────────────

  • line 50-51: std::env::var(...).unwrap_or_else(|_| ...) — 這裡用 unwrap_or_el
    是安全的，不是 unwrap。
  • line 53-55: db.0.lock().map_err(...)?.try_clone().map_err(...)? — 這裡如果 m
    ex poisoned 會回傳 CacheWriteFailed，這是可接受的。
  • line 58-60: tauri::async_runtime::spawn_blocking(...).await.map_err(...)? —
    awn_blocking 的 join error 被正確處理。
  • line 68-71: get_legal_clause_ipc 是 sync command，db.0.lock() 在 sync 環境中
    正確的。

  沒有明顯的 Critical 問題。

  2. src-tauri/src/legal_clauses/cache.rs
  ───────────────────────────────────────

  • line 17-28: ensure_schema 使用 execute_batch，正確。
  • line 30-63: upsert_law 中 res 的 match 處理了 SqliteFailure extended_code ==
    3 (SQLITE_FULL)。但 available_bytes: 0 是假值，沒有實際查詢可用空間。這不算
    rrectness 問題，只是資訊不準確。
  • line 65-86: get_law 正確處理了 Option。
  • line 123-132: is_cache_stale — parse_from_rfc3339 失敗時回傳 true。這是合理
    保守策略。
  • line 139-141: read_clause 使用 ?.ok_or(...) 這是正確的。

  沒有明顯 correctness 問題。

  3. src-tauri/src/legal_clauses/scheduler.rs
  ───────────────────────────────────────────

  • line 42-46: start_sync_scheduler 接收 Arc<tokio::sync::Mutex<rusqlite::Conne
    ion>>。注意這裡用的是 tokio::sync::Mutex 而非 std::sync::Mutex。在 mod.rs 中
    bState 用的是 std::sync::Mutex。讓我確認一下 DbState 的定義。

  這裡可能有一個型別不一致的問題：scheduler 期望 tokio::sync::Mutex 但 IPC wrapp
  er 使用 std::sync::Mutex。不過這可能是兩個不同的使用場景。scheduler 是 backgro
  und task，IPC 是 on-demand。讓我看一下 DbState 的定義來確認。

  我需要搜尋 DbState 的定義。

  • line 57: db.lock().await.try_clone() — 如果 try_clone() 失敗（conn 被其他執
    緒持有？），會 continue。這在 async 迴圈中可能會造成忙碌等待？不，ticker.tic
    ) 會等待，所以沒問題。
  • line 62: let _ = tokio::task::spawn_blocking(...).await; — Critical：spawn_b
    cking 的 Result 被完全忽略，包括可能的 panic 或 join error。這會導致同步失敗
    靜默忽略。而且 sync_legal_clauses 的回傳值 Result<SyncResult, LegalClausesEr
    r> 也被丟棄了。這應該要記錄錯誤。

  這是一個重要問題。

  4. src-tauri/src/legal_clauses/sync.rs
  ──────────────────────────────────────

  • line 26-42: parse_strict_ymd — 檢查長度、分隔符、數字字元，然後用 parse_from
    tr。邏輯正確。
  • line 44-55: validate_legal_clause — source_url.starts_with("https://") 會允
    https:// 開頭的任何字串，包括空 host（如 https://）。這算邏輯鬆散，但不算嚴
    錯誤。
  • line 57-62: is_remote_version_newer — 如果 parse 失敗，fallback 到 remote !=
    ocal。這可能不正確：如果兩者都是無效日期但字串相同，會回傳 false（不新）；如
    不同，回傳 true（新）。這種 fallback 策略有點奇怪但可接受。
  • line 71-76: bearer_token — 從兩個 env var 擇一，正確。
  • line 78-111: get_with_bearer_retry — 這裡有個問題：第一次 401 後，它會重新呼
    bearer_token()。如果 token 在兩次呼叫之間改變了（理論上可能但實務上不太可能
    ，這沒問題。但更大的問題是：retry 的邏輯與 sync_with_mock_sequence 註釋說的
    ax one retry on 401" 不完全一致——這裡的重試只是重送一次相同的 request，並沒
    換 token 或做任何不同的事。如果第一次 401 是因為 token 無效，第二次也會 401
    然後回傳 AuthFailed。這邏輯是正確的，只是沒有「refresh token」的行為。
  • line 214-277: sync_legal_clauses — 這是 sync function（非 async），但內部使
    tauri::async_runtime::block_on(...)。這是危險的！如果這個 function 已經在 as
    c runtime 中被呼叫（例如在 spawn_blocking 中），在 tokio 中 block_on 可能會
    nic（因為不能在 tokio runtime 內部呼叫 block_on）。不過 tauri::async_runtime
    block_on 是 Tauri 自建的 runtime，可能允許。但這仍然是個風險。

  等等，sync_legal_clauses 被：

  1. mod.rs 的 sync_ipc 用 spawn_blocking 呼叫
  2. scheduler.rs 的 start_sync_scheduler 用 spawn_blocking 呼叫

  所以 sync_legal_clauses 總是在 spawn_blocking 中執行，而 spawn_blocking 會在阻
  塞執行緒中執行。在阻塞執行緒中使用 block_on 通常是安全的。這不算 correctness
  問題。

  • line 226-255: 真實 endpoint 的處理。resp.json::<LawsResp>() 在 body 不是有效
    SON 時會回傳 OpcosUnreachable。這是可接受的。
  • line 258-276: for clause in laws 迴圈中，validate_legal_clause(&clause)? 會
    任一條文驗證失敗時回傳 Err，導致整個同步失敗。但註釋說 "partial failure must
    reserve successful rows"。然而 ? 會在驗證失敗時提前返回，後續條文不會寫入。
    重要的是，之前已寫入的條文會保留（因為 SQLite 不會自動 rollback），但這個 fu
    tion 會回傳 Err，caller 會認為同步失敗。這與註釋的意圖有點不一致，但不算嚴重
    ug。
  • line 260-269: any_updated 的計算有邏輯問題！它檢查 cache::get_law(...).ok().
    atten().map(|c| c.version_date) != Some(clause.version_date.clone())，但無論
    個條件是否成立，upsert_law 都會被呼叫。問題是：如果 get_law 回傳 Err（資料庫
    誤），.ok().flatten() 會變成 None，與 Some(...) 比較結果為 true，設 any_upda
    d = true。但實際上我們不知道是否真的更新了。更糟的是，如果 get_law 回傳 Err
    psert_law 之後也可能回傳 Err，但 upsert_law 的錯誤被 ? 處理了。

  更大的問題是：如果兩個 law 有相同的 version_date，any_updated 不會設為 true，
  但 upsert_law 仍然會執行。這沒有問題，只是 any_updated 反映的是「是否有資料的
  version_date 改變」，而不是「是否有寫入資料庫」。這個語意是可接受的。

  • line 283-297: seed_law_clause 正確。
  • line 299-335: sync_with_mock_response — 這個函數是 async 但內部沒有 .await。
    本身沒問題。但 line 305 let max = cache::max_fetched_at(conn)... 中 conn 是
    onnection。因為這個函數標記為 async，如果 caller 用 &mut Connection 傳入，可
    會有 borrow 問題，但這裡是 &Connection，所以沒問題。
  • line 337-361: sync_with_mock_sequence — 同樣是 async 但沒有 .await，除了呼叫
    ync_with_mock_response。
  • line 363-380: sync_partial_with_failure_at — 這個函數是 async 但沒有 .await
    它模擬 partial failure：在 fail_at 處 break。但這個邏輯有點奇怪：如果 fail_a
    == 0，迴圈直接 break，回傳 SyncResult::Updated，但實際上沒有寫入任何資料。如
    fail_at >= 3，所有 law 都會被 seed。這是測試 helper，意圖可能需要更多文件，
    不算 correctness 問題。

  5. src-tauri/src/realtor_license/mod.rs
  ───────────────────────────────────────

  • line 37-53: verify_realtor_license_ipc — 與 legal_clauses/mod.rs 類似，使用
    awn_blocking 是正確的。但 db.0.lock() 中的 DbState 需要確認。

  6. src-tauri/src/realtor_license/cache.rs
  ─────────────────────────────────────────

  • line 24-32: status_to_str — Timeout 和 Offline 回傳 None，在 write_license_c
    he 中導致不寫入快取。這是設計決策。
  • line 47-50: verified_at 被 parse 為 rfc3339，然後加 7 天作為 expires。如果 v
    ified_at 不是有效的 rfc3339，write_license_cache 會回傳 ToSqlConversionFailu
    錯誤。這是正確的。
  • line 83-95: is_license_cache_valid — read_license_cache 失敗時回傳 false，這
    安全的。
  • line 97-111: seed_expired_license — 函數名稱是 seed_expired_license，但實際
    seed 的是 LicenseStatus::Verified。這名稱有點誤導，但它創造一個過期的 cache
    try（因為 cache_expires_at 是 7 天後，如果 verified_at 是舊日期就會過期）。
    不算 correctness 問題。

  7. src-tauri/src/realtor_license/client.rs
  ──────────────────────────────────────────

  • line 41-43: fetch_license_from_opcos 檢查 license_number.trim().is_empty()，
    確。
  • line 52-55: req.send().await.map_err(|_| RealtorLicenseError::OpcosUnreachab
    ) — 所有網路錯誤都映射為 OpcosUnreachable，包括 timeout。但 build_client 設
    了 3 秒 timeout，timeout 也會變成 OpcosUnreachable，而不是 Timeout。這可能與
    icenseStatus::Timeout 的語意不同。Timeout 似乎是 server 回傳 408 時才使用。
  • line 67-80: body.expires_at.unwrap_or_default() — 如果 API 回傳 verified 但
    有 expires_at，會用空字串。這可能會導致下游顯示空白的到期日。verify_realtor_
    cense 在回傳 LicenseStatus::Verified { expires_at: "" } 時，前端可能無法正確
    示。
  • line 83-94: status_from_cache_str — 對於 cache 中的 verified 和 expired，exp
    es_at 被設為空字串。這意味著從 cache 讀取的 LicenseStatus::Verified 永遠沒有
    xpires_at。這是一個 邏輯錯誤：cache 應該也要儲存 expires_at！

  讓我再看 cache.rs 的 schema：

  license_number TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('verified','not_found','expired')),
  verified_at TEXT NOT NULL,
  cache_expires_at TEXT NOT NULL

  確實沒有 expires_at 欄位。所以從 cache 回復的 Verified 和 Expired 會丟失實際到
  期日資訊。這是一個資料模型缺陷。

  • line 96-163: verify_realtor_license — 這個函數內部呼叫 tauri::async_runtime:
    lock_on(fetch_license_from_opcos(...))。與 legal_clauses 類似，這個函數應該
    是在 spawn_blocking 中執行，所以 block_on 應該是安全的。
  • line 122-124: let _ = cache::write_license_cache(...).map_err(|_| RealtorLic
    seError::CacheWriteFailed)?; 等等，let _ = ... ? 這個寫法很怪！? 會在 Err 時
    前 return，但 let _ = 會在 Ok 時忽略結果。所以這實際上等同于 cache::write_li
    nse_cache(...).map_err(|_| RealtorLicenseError::CacheWriteFailed)?;，只是外
    加了 let _ =。這不算 bug，只是多餘。
  • line 116: match tauri::async_runtime::block_on(fetch_license_from_opcos(lice
    e_number)) 的處理：
    • Ok(Verified | NotFound | Expired)：寫入 cache，回傳 fresh
    • Ok(Timeout)：不回傳 cache，回傳 Timeout（source=fresh）
    • Ok(Offline {..})：不回傳 cache，回傳 Offline（source=offline）
    • Err(OpcosUnreachable)：嘗試讀 cache，如果成功回傳 offline + cache data，否
      ffline + no data
    • Err(e)：直接回傳 e

  問題：Ok(LicenseStatus::Offline { .. }) 這個分支在 fetch_license_from_opcos 中
  永遠不會發生，因為 fetch_license_from_opcos 不會回傳 Offline。所以這個分支是 d
  ead code。不算嚴重問題。

  • line 143-160: Err(RealtorLicenseError::OpcosUnreachable) 時的 offline fallba
    。如果 cache 有資料但已過期，is_license_cache_valid 會回傳 false，所以不會進
    line 107 的快取命中。但在 offline fallback 時，即使 cache 過期，仍然使用 cac
    資料。這是設計上可接受的（offline 時使用任何可用資料）。
  • line 186-204: verify_with_delayed_mock — 這個函數回傳 Pin<Box<dyn Future<...
    >，但定義為 pub fn（不是 async fn）。caller 需要 .await 它。但由於它標記為 #
    fg(test)]，沒問題。

  8. src/lib/pdf-blocks/legal-notice.tsx
  ──────────────────────────────────────

  • line 39-52: ensureBlobTextPatch — 這個函數會修改 Blob.prototype.text，這是一
    全域的 monkey patch。這在 production code 中是非常危險的。它只會執行一次（有
    EGAL_NOTICE_PATCHED_KEY 檢查）。但問題是：如果 Blob.prototype.text 已經被其
    library patch 過，或者之後被 patch，會造成不可預期的行為。更糟的是，它在 Rea
    component render 期間修改全域 prototype。
  • line 43: patchedBlobText 是 async function。original.call(this) 中的 this 綁
    是正確的。
  • line 46: base.startsWith("%PDF-") 檢查確保只對 PDF blob 進行 patch。
  • line 54-61: splitBySize — 這個函數在 input.length > chunkSize 時，最後一個 c
    nk 會被正確處理（slice 會自動處理超出長度）。正確。
  • line 63-74: normalizeMarkdown — replace(/```[\s\S]*?```/g, "") 可能會錯誤處
    未閉合的 code block，但對於預期的輸入應該沒問題。
  • line 76-80: sortClauses — ...(clauses ?? []) 會複製陣列，正確。filter 檢查 c
    use?.law_id && clause.title，但 clause.title 如果是空字串會是 falsy，導致被
    濾掉。這可能不是預期行為——應該檢查 clause.title != null 或 clause.title !==
    defined 而非 Boolean(clause.title)。如果 title 是空字串但存在，會被錯誤過濾
  • line 86-103: getLegalNoticeThemeStyles — colors?.primary ?? tokens.primaryCo
    r ?? "#111827" 這個 fallback 鏈正確。但如果 tokens 沒有 colors 也沒有 primar
    olor，會用預設值。
  • line 109-201: LegalNoticePages — 這個函數在 render 期間設定 globalThis[LEGAL
    OTICE_TEXT_KEY]。這是 side effect in render，可能會造成 hydration mismatch
    re-render 時的重複執行。但在 PDF generation 的上下文中，這可能是可以接受的。
  • line 114: shouldRenderPartialPlaceholder = resolved.length > 0 && resolved.l
    gth < EXPECTED_LAW_COUNT — 如果 resolved.length === EXPECTED_LAW_COUNT（3）
    不顯示 placeholder。正確。
  • line 124: <Page size="A4" break style={{ padding: 28 }}> — break 屬性在 reac
    pdf 的 Page 上應該是 break prop。但 firstPage 初始為 true，所以第一頁 break=
    rue}。這在 react-pdf 中可能不是有效的 prop——Page 通常沒有 break prop，應該是
    rap 或其他。讓我確認 react-pdf API。

  等等，react-pdf 的 Page component 確實沒有 break prop。<Page> 有 size, orienta
  tion, style, wrap 等，但沒有 break。break 是 View 和 Text 的屬性（如 break 布
  林值或 pageNumber 等）。在 Page 上使用 break 會被忽略。但這可能不是 correctnes
  s 問題，只是無效 prop。

  • line 136-193: chunks 迴圈中，firstPage 在每次 chunks.forEach 的第一次迭代時
    true（因為外部 clauseIndex 和 firstPage 的互動）。實際上，firstPage = false
    在 chunks.forEach 的每次迭代最後設定的。所以只有整個文件的第一個 chunk 會有
    eak={true}。這意圖是對的（只在第一頁加 break），但 Page 的 break prop 無效。
  • line 175-187: isLastChunk 時顯示 footer。isLastClause && shouldRenderPartial
    aceholder 會在最後一個 clause 的最後一個 chunk 顯示 placeholder。正確。
  • line 166: <Text wrap style={{...}}> — wrap prop 在 react-pdf 的 Text 上是有
    的（預設 true）。這裡明確指定也沒問題。

  9. src/components/RealtorLicenseField.tsx
  ─────────────────────────────────────────

  • line 9-10: type VerifyResultStatus = "verified" | "not_found" | "expired" —
    Rust 端 LicenseStatus 還有 Timeout 和 Offline。TypeScript 沒有包含這兩個狀態
    但 verify_realtor_license_ipc 會回傳 LicenseVerificationResult，其中 status
    能是 Timeout 或 Offline。

  在 RealtorLicenseField.tsx 中，response.status 被直接 assign 到 LicenseVerific
  ationState['status']，但 LicenseVerificationState['status'] 只接受 "verified"
  | "not_found" | "expired"。如果 Rust 回傳 Timeout 或 Offline，TypeScript 在 ru
  ntime 會有值 "timeout" 或 "offline"，但 type 不涵蓋。這會導致 renderStatus()
  中的邏輯把 timeout 和 offline 都當成 expired 處理（因為最後的 else）。

  這是一個 型別不匹配 問題。

  • line 4: import "@testing-library/jest-dom/vitest" 在 production component 中
    這會導致 jest-dom matchers 被載入到 production bundle。如果 vitest/jest-dom
    devDependency，這可能導致 production build 失敗。這是一個 嚴重問題。
  • line 29-33: toDateOnly — iso.match(/^(\d{4}-\d{2}-\d{2})/) 正確。但如果 iso
    是 ISO 格式，會回傳原始字串。
  • line 41: const requestIdRef = React.useRef(0); — 初始值為 0。
  • line 82-97: debounceTimerRef.current = window.setTimeout(async () => { ... }
    500);
    • requestId = requestIdRef.current + 1; requestIdRef.current = requestId; 正
      用來追蹤最新的 request。
    • if (requestIdRef.current !== requestId) return; — 由於 requestIdRef.curren
      呼叫 invoke 之後才檢查，如果兩個 request 幾乎同時完成，可能會有 race condi
      。但由於 invoke 是 sequential 的，且 requestIdRef 在 await 後檢查，這應該
      確的。
  • line 45-68: useEffect 中的 setTimeout monkey patch！
    timerHost.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: u
    nown[]) => {
    if ((timeout ?? 0) === 0 && typeof handler === "function") {
      handler(...args);
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }
    return originalSetTimeout(handler, timeout, ...args);
    }) as typeof setTimeout;
    這個 patch 會讓所有 setTimeout(fn, 0) 立即同步執行！這在 React 18+ 中非常危
    ，因為 React 內部可能依賴 setTimeout(..., 0) 來排程。這會導致不可預期的行為
    無限迴圈或渲染問題。這是一個 Critical 問題。
    為什麼要這樣做？看起來是為了測試（讓 debounce 在測試中同步執行）。但這是在 p
    duction component 中！而且 import "@testing-library/jest-dom/vitest" 也證實
    這個檔案可能混入了測試程式碼。
  • line 108: verification.source === "offline" 的檢查。但 LicenseVerificationSt
    e['source'] 的 type 是 VerifySource = "fresh" | "offline"。然而 verify_realt
    _license_ipc 回傳的 source 可以是 "cache"。RealtorLicenseField.tsx 沒有處理
    ache" source！
  • line 92-96: source: response.source ?? "fresh" — 如果 Rust 回傳 "cache"，這
    會正確設定為 "cache"，但 TypeScript type VerifySource 不包含 "cache"。所以 T
    eScript 會抱怨（如果嚴格檢查的話），或者靜默通過（如果從 any 轉型）。

  讓我再看一下 verify_realtor_license_ipc 的回傳值：

  pub struct LicenseVerificationResult {
      pub status: LicenseStatus,
      pub verified_at: String,
      pub source: String, // "cache" | "fresh" | "offline"
  }

  確實有 "cache"。但 RealtorLicenseField.tsx 只定義了 "fresh" | "offline"。

  • line 148: onChange(value); scheduleVerification(value); — 每次 onChange 都會
    發 verification。這會對每個按鍵都 debounce 500ms 後呼叫後端。這是可接受的 UX

  讓我整理所有發現：

  Critical
  ────────

  1. src/components/RealtorLicenseField.tsx:4: import "@testing-library/jest-dom
     test" 在 production component 中。這會把測試 library 引入 production bundle
     可能導致 build 失敗或增加 bundle size。
  2. src/components/RealtorLicenseField.tsx:45-68: setTimeout monkey patch 在 mo
     時修改全域 setTimeout。這會導致 setTimeout(fn, 0) 同步執行，可能破壞 React
     程和其他 library。
  3. src-tauri/src/legal_clauses/scheduler.rs:62: let _ = tokio::task::spawn_blo
     ng(...).await; 完全忽略 sync_legal_clauses 的回傳值。同步失敗時靜默忽略，沒
     日誌或錯誤處理。

  Warning
  ───────

  4. src/components/RealtorLicenseField.tsx:9-22: VerifyResultStatus 缺少 "timeo
     和 "offline"；VerifySource 缺少 "cache"。Rust 回傳這些值時會導致型別不匹配
     renderStatus() 會把 timeout/offline 誤判為 expired。
  5. src-tauri/src/realtor_license/client.rs:83-94: status_from_cache_str 對 ver
     ed/expired 使用 expires_at: String::new()。但 cache.rs 的 schema 沒有儲存 e
     res_at，導致從 cache 回復的 Verified/Expired 永遠遺失到期日資訊。
  6. src-tauri/src/legal_clauses/sync.rs:260-269: any_updated 的計算使用 cache::
     _law(...).ok().flatten()。如果 get_law 回傳 Err，any_updated 會被設為 true
     upsert_law 可能後續也失敗。這會導致 SyncResult::Updated 被回傳但實際上沒有
     。
  7. src-tauri/src/realtor_license/client.rs:71-80: fetch_license_from_opcos 回
     k(LicenseStatus::Verified { expires_at: body.expires_at.unwrap_or_default()
     。如果 API 沒有提供 expires_at，下游會拿到空字串。status_from_cache_str 也
     回傳空字串。這會導致前端顯示空白的到期日。

  Suggestion
  ──────────

  8. src-tauri/src/legal_clauses/mod.rs:50-51: std::env::var("OPCOS_LEGAL_CLAUSE
     NDPOINT") 每次 IPC 呼叫都讀取環境變數。建議在啟動時讀取一次。
  9. src/lib/pdf-blocks/legal-notice.tsx:76-80: filter 使用 Boolean(clause.title
     會把空字串 title 過濾掉。如果空 title 是合法的（例如資料問題），應該檢查 cl
     e.title != null。
  10. src-tauri/src/legal_clauses/sync.rs:227: tauri::async_runtime::block_on 在
      wn_blocking 中雖然目前安全，但如果未來改變呼叫方式可能會 panic。建議將 syn
      gal_clauses 改為 async fn。
  11. src/lib/pdf-blocks/legal-notice.tsx:39-52: ensureBlobTextPatch 修改全域 Bl
      rototype。這是 side effect 且難以追蹤。建議改用 wrapper function 或更乾淨
      式注入 metadata。
  12. src-tauri/src/realtor_license/cache.rs:17: CHECK (status IN ('verified','n
      ound','expired')) 約束不包含 timeout 和 offline。這是設計決策，但如果未來
      cache timeout 狀態，需要修改 schema。

  讓我再仔細檢查 RealtorLicenseField.tsx 的 setTimeout patch。這個 patch 的邏輯
  ：

  if ((timeout ?? 0) === 0 && typeof handler === "function") {
    handler(...args);
    return 0 as unknown as ReturnType<typeof setTimeout>;
  }

  這只影響 timeout === 0 的呼叫。React 內部在某些情況下會使用 setTimeout(fn, 0)
  ，但 React 18 主要使用 MessageChannel 或 scheduler package。所以這個 patch 可
  能不會直接破壞 React，但會影響任何依賴 setTimeout(fn, 0) 來 deffer 執行的 libr
  ary（例如某些 debounce/throttle 實現）。

  但等等，這個 patch 在 cleanup 時會 restore。所以它只在 component mount 期間有
  效。不過這個 component 可能是表單的一部分，會被 mount/unmount。這仍然是很奇怪
  的實踐。

  更糟的是：這個 patch 回傳 0 作為 timer id，但 clearTimeout(0) 會清除 id 為 0
  的 timeout（如果存在的話）。如果某個 library 儲存了這個 id 並呼叫 clearTimeout
  ，可能會意外清除其他 timeout。

  還有：handler(...args) 是同步執行的。如果 handler 拋出異常，會在 setTimeout 呼
  叫處拋出，而不是在 event loop 中拋出。這改變了錯誤處理語意。

  這絕對是 Critical。

  再檢查 legal-notice.tsx 的 ensureBlobTextPatch：

  const original = Blob.prototype.text;
  Blob.prototype.text = async function patchedBlobText(): Promise<string> {
    const base = await original.call(this);
    ...
  };

  這裡保存了 original 的 reference。但如果 Blob.prototype.text 在這個函數執行前
  已經不是原生 function（例如被其他 library patch），original 會是已被 patch 的
  版本。這會導致 double patch 或無限遞迴（如果其他 library 也保存並呼叫 original
  ）。不過這比較不太可能，算 Warning 級別。

  還有 original.call(this) — 在 async arrow function 中，this 的綁定需要確認。as
  ync function patchedBlobText() 是一個普通函數（不是 arrow function），所以 thi
  s 會是呼叫時的 blob 物件。這是正確的。

  但我注意到 ensureBlobTextPatch 在 LegalNoticePages 中被呼叫，而 LegalNoticePag
  es 每次 render 都會執行（雖然有 g[LEGAL_NOTICE_PATCHED_KEY] 檢查）。這沒問題。

  再來看看 legal_clauses/sync.rs 的 sync_legal_clauses：

  pub fn sync_legal_clauses(
      conn: &Connection,
      endpoint: &str,
  ) -> Result<SyncResult, LegalClausesError> {

  這個函數在 spawn_blocking 中執行。但在 sync_ipc 中：

  tauri::async_runtime::spawn_blocking(move || sync_legal_clauses(&conn, &endpoi
  nt))
      .await
      .map_err(|_| LegalClausesError::CacheWriteFailed)?

  spawn_blocking 的 join error（如果 task panic）被轉為 CacheWriteFailed。這不太
  準確——panic 應該被記錄，而不是被當成 cache 錯誤。不過這在 production 中可能還
  可以。

  在 scheduler.rs 中：

  let _ = tokio::task::spawn_blocking(move || sync_legal_clauses(&conn, &endpoin
  t)).await;

  完全忽略 join error 和回傳值。如果 sync_legal_clauses panic，await 會回傳 Err
  ，但 let _ = 會忽略它。這可能導致靜默 panic。這算 Critical 嗎？panicked task
  不會影響整個程序（tokio 的 spawn_blocking 會隔離 panic），但同步失敗會被忽略。
  我認為這算 Critical，因為定期同步失敗時沒有任何通知。

  讓我再看看 realtor_license/mod.rs 的 verify_realtor_license_ipc：

  tauri::async_runtime::spawn_blocking(move || {
      client::verify_realtor_license(&conn, &license_number)
  })
  .await
  .map_err(|_| RealtorLicenseError::CacheWriteFailed)?

  這裡正確地將 spawn_blocking 的 join error 轉為 CacheWriteFailed。雖然同樣不精
  確，但至少不會靜默失敗。

  還有 legal_clauses/mod.rs 的 get_legal_clause_ipc：

  pub fn get_legal_clause_ipc(
      law_id: String,
      db: State<'_, DbState>,
  ) -> Result<LegalClause, LegalClausesError> {
      let conn =
          db.0.lock()
              .map_err(|_| LegalClausesError::CacheWriteFailed)?;
      get_legal_clause(&*conn, &law_id)
  }

  這裡 db.0.lock() 中的 DbState 定義為何？讓我搜尋一下 DbState。

• Used Grep (struct DbState)

• 好的，DbState 定義為 pub struct DbState(pub Mutex<Connection>)，其中 Mutex 是
  std::sync::Mutex。這意味著：

  1. legal_clauses/mod.rs 和 realtor_license/mod.rs 中的 db.0.lock() 使用的是 st
     sync::Mutex。
  2. legal_clauses/scheduler.rs 的 start_sync_scheduler 接收的是 Arc<tokio::sync
     utex<rusqlite::Connection>>，這與 DbState 的型別不一致。

  這意味著 scheduler 無法直接使用 DbState！如果有人用 DbState 呼叫 start_sync_sc
  heduler，會編譯失敗。讓我看看有沒有人呼叫 start_sync_scheduler。

  讓我搜尋 start_sync_scheduler 的使用。

• Used Grep (start_sync_scheduler)

• 讓我看一下 scheduler tests 中 db_arc 是如何建立的，以確認型別是否匹配。

• Used ReadFile (src-tauri/src/legal_clauses/scheduler/tests.rs)

• 好的，測試中明確使用 std::sync::Arc::new(tokio::sync::Mutex::new(db))，所以 st
  art_sync_scheduler 的簽名與測試一致。這不是 bug，只是與 DbState 的 std::sync::
  Mutex 不同。這可能是設計意圖（scheduler 使用 tokio mutex 以配合 async context
  ）。但這會導致 start_sync_scheduler 無法直接接收 DbState。

  讓我檢查是否有實際呼叫 start_sync_scheduler 的 production code（非測試）。

• Used Grep (start_sync_scheduler)

• start_sync_scheduler 只在測試中被呼叫，沒有 production 呼叫點。所以它與 DbStat
  e 的型別不一致暫時不是問題（因為沒人用），但如果將來要整合會有問題。這可以算 S
  uggestion。

  讓我再檢查一些其他潛在問題：

  realtor_license/client.rs 的 fetch_license_from_opcos
  ─────────────────────────────────────────────────────

  pub async fn fetch_license_from_opcos(
      license_number: &str,
  ) -> Result<LicenseStatus, RealtorLicenseError> {

  這個函數是 async，但在 verify_realtor_license 中被 tauri::async_runtime::block
  _on 呼叫。這是安全的，因為 verify_realtor_license 在 spawn_blocking 中執行。

  legal_clauses/sync.rs 的 get_with_bearer_retry
  ──────────────────────────────────────────────

  if resp.status().as_u16() == 401 {
      let mut req2 = client.get(url);
      if let Some(t) = bearer_token().as_ref() {
          req2 = req2.bearer_auth(t);
      }

  第一次請求和第二次請求使用相同的 token。這裡的「retry」其實沒有做任何不同的事
  。如果 token 被撤銷或過期，第二次也會 401。註釋說 "Max one retry on 401" 是正
  確的——只重試一次。但這個 retry 在沒有重新獲取 token 的情況下意義不大。不過這是
  設計決策，不算 bug。

  legal_clauses/sync.rs 的 sync_legal_clauses 中的 test_fixture_three_laws
  ────────────────────────────────────────────────────────────────────────

  let laws: Vec<LegalClause> = if endpoint == TEST_OK_ENDPOINT {
      test_fixture_three_laws()
  } else {

  TEST_OK_ENDPOINT 是 "http://localhost:19999/v1/legal-clauses"，這也剛好是 sync
  _ipc 中的預設 endpoint（當 OPCOS_LEGAL_CLAUSES_ENDPOINT 沒設定時）。這意味著如
  果沒有設定環境變數，sync_ipc 會使用 test fixture 而非真實 API！

  讓我確認：

  • sync_ipc line 50-51: std::env::var("OPCOS_LEGAL_CLAUSES_ENDPOINT").unwrap_or
    lse(|_| "http://localhost:19999/v1/legal-clauses".to_string())
  • sync.rs line 9: const TEST_OK_ENDPOINT: &str = "http://localhost:19999/v1/le
    l-clauses";

  這是一個 Critical 問題！如果使用者沒有設定 OPCOS_LEGAL_CLAUSES_ENDPOINT，同步
  會使用測試資料（fixture）而非真實 API！這會導致 production 環境中寫入假資料。

  等等，但 sync_legal_clauses 的 else branch：

  } else {
      // Real call: GET {endpoint} returns {"laws":[...]}
      let resp = match tauri::async_runtime::block_on(get_with_bearer_retry(endp
  oint, 5)) {

  如果 endpoint == TEST_OK_ENDPOINT，它會進入 if branch（line 223）回傳 fixture
  。如果 endpoint 是其他值（例如 production URL），它會進入 else branch 做真實 H
  TTP 呼叫。

  問題是預設值 http://localhost:19999/v1/legal-clauses 剛好等於 TEST_OK_ENDPOINT
  。在 production 中，如果沒設定環境變數，這個預設 localhost URL 會被視為 TEST_O
  K_ENDPOINT，回傳 fixture 而非嘗試連線到 localhost。這可能不是預期行為。

  不過仔細想想：如果沒設定環境變數，在 production 中 http://localhost:19999 大概
  也連不上，所以 get_with_bearer_retry 會失敗。但由於 TEST_OK_ENDPOINT 的檢查在
  HTTP 呼叫之前，它會回傳 fixture 而非嘗試連線。

  這是一個非常嚴重的問題！測試 fixture 不應該在 production 中被使用。

  讓我再確認 sync_ipc 是否使用 TEST_OK_ENDPOINT：

  let endpoint = std::env::var("OPCOS_LEGAL_CLAUSES_ENDPOINT")
      .unwrap_or_else(|_| "http://localhost:19999/v1/legal-clauses".to_string())
  ;

  是的，預設值就是 TEST_OK_ENDPOINT。這意味著沒有環境變數時，sync_legal_clauses
  會回傳測試資料。

  這算 Critical。

  但等等，sync_legal_clauses 的註釋說：

  // Test harness endpoints are fully mocked to keep unit tests deterministic.
  if endpoint == TEST_UNREACHABLE_ENDPOINT {
      return fallback_result(conn);
  }

  TEST_OK_ENDPOINT 也是 test harness endpoint 之一。這個設計的目的是讓單元測試在
  沒有 mock server 的情況下能跑。但在 production 中，如果環境變數沒設定，就會觸
  發這個 test harness。

  解決方案：把 test harness 的 endpoint 改成不會在 production 出現的值，例如 htt
  p://__test_ok__/v1/legal-clauses 或類似的。或者更進一步，用 feature flag #[cfg
  (test)] 來區分。

  好，讓我整理最終報告。

  還有一件事：legal-notice.tsx 的 EMPTY_CACHE_PLACEHOLDER 和 CONTINUATION_MARKE…
  中使用了全形括號。在 normalizeMarkdown 中：

  .replace(/\[(.*?)\]\((.*?)\)/g, "$1")

  這個 regex 會移除 markdown 連結，保留連結文字。但如果連結文字包含全形括號，應
  該沒問題。

  還有 replace(/^\s{0,3}#{1,6}\s+/gm, "") 移除 markdown heading。這會把 # 標題
  變成 標題，但會保留 heading 後面的換行。因為 regex 包含 \s+，它會移除 heading
  標記和後續空白，但保留換行。這沒問題。

  讓我再看看 RealtorLicenseField.tsx 的 renderStatus()：

  if (verification.status === "verified") {
    // ...
    {verification.source === "offline" && verification.verifiedAt ? (...) : null
  }
  }

  if (verification.status === "not_found") {
    // ...
  }

  return (
    <div className="mt-2 inline-flex items-center gap-1.5 text-sm text-amber-600
  ">
      <AlertTriangle className="h-4 w-4" aria-hidden />
      <span>⚠ 證號已過期</span>
    </div>
  );

  如果 Rust 回傳 timeout 或 offline（但 TypeScript 型別沒涵蓋），會落到最後的 el
  se，顯示「證號已過期」。這是錯誤的 UX：timeout 應該顯示連線逾時，offline 應該
  顯示離線狀態。

  好，現在整理報告。

  ──────────────────────────────────────────────────────────────────────────────
  報告結構
  ────────

  Critical
  ────────

  1. src/components/RealtorLicenseField.tsx:4 - production code import 測試 libr
  2. src/components/RealtorLicenseField.tsx:45-68 - 全域 setTimeout monkey patch
  3. src-tauri/src/legal_clauses/sync.rs:9,223 - TEST_OK_ENDPOINT 與 sync_ipc 預
     值衝突，production 無環境變數時會使用 test fixture
  4. src-tauri/src/legal_clauses/scheduler.rs:62 - spawn_blocking 結果完全忽略

  Warning
  ───────

  5. src/components/RealtorLicenseField.tsx:9-22 - TypeScript 型別與 Rust enum
     配（timeout/offline/cache 缺失）
  6. src-tauri/src/realtor_license/client.rs:83-94 - cache schema 未儲存 expires
     ，從 cache 回復時遺失到期日
  7. src-tauri/src/realtor_license/client.rs:71-80 - API 未回傳 expires_at 時使
     字串，導致顯示空白
  8. src-tauri/src/legal_clauses/sync.rs:260-269 - any_updated 在 get_law Err 時
     能誤報 Updated
  9. src/lib/pdf-blocks/legal-notice.tsx:76-80 - filter 把空字串 title 當成不存
     濾掉

  Suggestion
  ──────────

  10. src-tauri/src/legal_clauses/mod.rs:50-51 - 每次 IPC 都讀環境變數
  11. src-tauri/src/legal_clauses/scheduler.rs:42-43 - start_sync_scheduler 簽名
      tokio::sync::Mutex，與 DbState 的 std::sync::Mutex 不一致
  12. src/lib/pdf-blocks/legal-notice.tsx:39-52 - 全域 Blob.prototype monkey pat
  13. src-tauri/src/legal_clauses/sync.rs:227,240 - sync function 中使用 block_o
      對 future runtime 耦合過深

  讓我再確認 sync_ipc 中 TEST_OK_ENDPOINT 的問題是否真的 Critical。

  sync_ipc line 50-51:

  let endpoint = std::env::var("OPCOS_LEGAL_CLAUSES_ENDPOINT")
      .unwrap_or_else(|_| "http://localhost:19999/v1/legal-clauses".to_string())
  ;

  sync.rs line 9:

  const TEST_OK_ENDPOINT: &str = "http://localhost:19999/v1/legal-clauses";

  是的，完全一致。當沒有環境變數時，sync_ipc 會傳入 TEST_OK_ENDPOINT，sync_legal
  _clauses 會回傳 fixture 資料（三條假法律）。這些假資料會被寫入 SQLite cache。
  這絕對是 Critical。

  但再想想：也許這個預設值只是開發用的，production 一定會設定環境變數？但 correc
  tness 審查就是要找出這種「如果忘記設定就會壞掉」的問題。是的，這算 Critical。

  還有 realtor_license/mod.rs 的 verify_realtor_license_ipc：

  #[tauri::command(rename = "verify_realtor_license")]
  pub async fn verify_realtor_license_ipc(...)

  這個 command 名稱是 verify_realtor_license，與 RealtorLicenseField.tsx 中 invo
  ke("verify_realtor_license", ...) 匹配。

  好，讓我寫出最終報告。

• Correctness 審查報告：aire-phase1-legal-clauses-autofill
  ────────────────────────────────────────────────────────

  ──────────────────────────────────────────────────────────────────────────────

  🔴 Critical
  ───────────

  1. src/components/RealtorLicenseField.tsx:4
  • 問題：Production component 直接 import "@testing-library/jest-dom/vitest"，
    把測試 library（含 expect extend、DOM matchers）打包進 production bundle。若
    est-dom 是 devDependency，production build 會直接報錯；即使能編過，也會無故
    大 bundle size 與污染全域。
  • 建議修法：移到測試檔案（如 __tests__/RealtorLicenseField.test.tsx）或 mock
    案，絕對不要出現在 src/components/ 的 production code。
  2. src/components/RealtorLicenseField.tsx:45-68
  • 問題：Component mount 時對全域 setTimeout 做 monkey patch，讓 setTimeout(fn,
    ) 變成同步立即執行。這會破壞 React 排程語意、任何依賴 setTimeout(..., 0) 來
    fer 的 library（debounce、polyfill、動畫框架），且 clearTimeout(0) 可能意外
    除其他合法的 timer。
  • 建議修法：移除這段 patch。若為了測試 debounce，應該在測試層用 vi.useFakeTime
    () 控制時間，而不是在 production component 修改全域 prototype。
  3. src-tauri/src/legal_clauses/sync.rs:9 + src-tauri/src/legal_clauses/mod.rs:
  50-51
  • 問題：TEST_OK_ENDPOINT = "http://localhost:19999/v1/legal-clauses" 與 sync_i
    的 fallback endpoint 完全字串相等。若 production 忘記設定 OPCOS_LEGAL_CLAUSE
    ENDPOINT，sync_legal_clauses 會命中 if endpoint == TEST_OK_ENDPOINT 分支，直
    寫入三筆 test fixture 假資料到 SQLite，而非嘗試連線真實 API。
  • 建議修法：test harness endpoint 應使用絕不會出現在 production 的字串（如 htt
    //__test_ok__/v1/legal-clauses）；或把 test_fixture_three_laws() 整段包在 #[
    g(test)] 裡。
  4. src-tauri/src/legal_clauses/scheduler.rs:62
  • 問題：let _ = tokio::task::spawn_blocking(move || sync_legal_clauses(&conn,
    ndpoint)).await; 完全丟棄 spawn_blocking 的 join error 與 sync_legal_clauses
    的 Result<SyncResult, LegalClausesError>。背景排程若遇到網路錯誤、panic、或
    證失敗，將靜默失敗，UI 與日誌都不會知道。
  • 建議修法：至少記錄錯誤，例如：
    if let Err(e) = tokio::task::spawn_blocking(...).await {
      log::error!("背景法規同步失敗: {:?}", e);
    }
  ──────────────────────────────────────────────────────────────────────────────

  ⚠️ Warning
  ─────────

  5. src/components/RealtorLicenseField.tsx:9-22
  • 問題：TypeScript 型別 VerifyResultStatus = "verified" | "not_found" | "expir
    " 與 Rust LicenseStatus 不符，缺少 "timeout" 與 "offline"；VerifySource = "f
    sh" | "offline" 缺少 "cache"。當 Rust 回傳這些值時，runtime 會落到 renderSta
    s() 最後的 else，把 timeout/offline 都誤顯示為「證號已過期」。
  • 建議修法：補齊型別並新增對應的 UI branch：
    type VerifyResultStatus = "verified" | "not_found" | "expired" | "timeout" |
    offline";
    type VerifySource = "fresh" | "offline" | "cache";
  6. src-tauri/src/realtor_license/client.rs:83-94
  • 問題：status_from_cache_str 對 verified/expired 一律使用 expires_at: String:
    ew()，但 realtor_license/cache.rs 的 schema 根本沒有 expires_at 欄位。這導致
    cache 回復的 LicenseStatus::Verified 永遠遺失到期日資訊，前端會顯示空白。
  • 建議修法：在 realtor_licenses table 新增 expires_at 欄位，並在 write_license
    ache / read_license_cache 中讀寫該欄位。
  7. src-tauri/src/realtor_license/client.rs:71-80
  • 問題：fetch_license_from_opcos 對 API 回傳的 expires_at 使用 unwrap_or_defau
    ()。若後端未提供該欄位，LicenseStatus::Verified { expires_at: "" } 會一路傳
    前端，造成到期日顯示空白。
  • 建議修法：與後端確認 expires_at 是否為必填欄位；若可能缺失，應在 Rust 層回傳
    確錯誤或預設值，而不是空字串。
  8. src-tauri/src/legal_clauses/sync.rs:260-269
  • 問題：計算 any_updated 時使用 cache::get_law(...).ok().flatten()。若 get_law
    回傳 Err（如資料庫損毀），.ok().flatten() 會變成 None，與 Some(clause.versio
    date) 比較結果為 true，誤設 any_updated = true。後續 upsert_law 若也失敗，整
    function 會回傳 Err，但 caller 在其他情境下可能誤解為「有更新但寫入失敗」。
  • 建議修法：明確區分「讀取失敗」與「無資料」：
    let needs_update = match cache::get_law(conn, &clause.law_id) {
      Ok(Some(c)) => c.version_date != clause.version_date,
      Ok(None) => true,
      Err(e) => return Err(LegalClausesError::CacheWriteFailed),
    };
  9. src/lib/pdf-blocks/legal-notice.tsx:76-80
  • 問題：filter((clause) => Boolean(clause?.law_id && clause.title)) 會把 title
    == "" 的合法條文過濾掉。若後端回傳空 title（資料異常），該條文會無故消失，使
    者看不到任何錯誤提示。
  • 建議修法：改為檢查存在性而非 truthiness：
    .filter((clause) => clause?.law_id != null && clause.title != null)
  ──────────────────────────────────────────────────────────────────────────────

  💡 Suggestion
  ─────────────

  10. src-tauri/src/legal_clauses/mod.rs:50-51
  • 問題：每次 IPC 呼叫都重新 std::env::var("OPCOS_LEGAL_CLAUSES_ENDPOINT")。環
    變數在程式生命週期內不會改變，重複讀取無意義。
  • 建議修法：使用 once_cell::sync::Lazy 或 std::sync::OnceLock 在啟動時讀取一次
  11. src-tauri/src/legal_clauses/scheduler.rs:42-43
  • 問題：start_sync_scheduler 要求 Arc<tokio::sync::Mutex<rusqlite::Connection>
    ，但專案共用的 DbState（lib.rs:58）使用的是 std::sync::Mutex<Connection>。兩
    型別不一致，導致 scheduler 無法直接接收 DbState，將來整合時一定會遇到型別轉
    問題。
  • 建議修法：統一使用 std::sync::Mutex（在 async 中搭配 lock().map_err(...)）或
    DbState 也改用 tokio::sync::Mutex。
  12. src/lib/pdf-blocks/legal-notice.tsx:39-52
  • 問題：ensureBlobTextPatch() 在 runtime 修改全域 Blob.prototype.text。若其他
    brary（或日後的程式碼）也做類似 patch，可能產生無限遞迴或相互覆蓋，且這種 si
    effect 極難追蹤。
  • 建議修法：避免 monkey patch。改為在 PDF 產出流程最後，明確把 readableParts
    容 append 到 output buffer，而不是透過 Blob.prototype.text 偷渡。
  13. src-tauri/src/legal_clauses/sync.rs:227,240
  • 問題：同步函數 sync_legal_clauses 內部使用 tauri::async_runtime::block_on(..
    。雖然目前總是從 spawn_blocking 呼叫，暫時安全，但這種「sync wrapper 呼叫 as
    c」的模式與 Tauri runtime 強耦合。若未來改在 tokio 的 block_in_place 或一般
    行緒中呼叫，可能 panic。
  • 建議修法：將 sync_legal_clauses 改為 async fn，讓 caller（spawn_blocking 或
    C）決定如何執行，而非在函數內部硬塞 block_on。

```

## security lens
```
• The user wants a security audit of specific files in the project. Let me first
  locate and read all the specified files, then analyze them against the securit
  y criteria mentioned.

  The files to audit:

  1. src-tauri/src/legal_clauses (likely a directory or file)
  2. src-tauri/src/realtor_license (likely a directory or file)
  3. src/lib/pdf-blocks/legal-notice.tsx
  4. src/components/RealtorLicenseField.tsx

  Let me first explore what exists at these paths.

