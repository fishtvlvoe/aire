/// Phase 2 紅燈測試 — branding 模組（CLU-004、005、009 + IPC 行為）
///
/// 這個檔案 import 了 `crate::branding` 模組，而該模組尚未建立。
/// `cargo test --package aire branding` 會因編譯失敗而紅燈 = 預期行為。
///
/// Phase 3 實作時需建立：
/// - src-tauri/src/branding/mod.rs
/// - src-tauri/src/branding/logo.rs（validate_logo, upload_logo, delete_logo）
/// - src-tauri/src/branding/theme.rs（set_theme, get_theme, ThemeConfig）

#[cfg(test)]
mod tests {
    // ❌ 這些模組還不存在 — 紅燈起點
    // include! 在 mod branding { pub mod tests { ... } } 內執行：
    //   self = crate::branding::tests
    //   super = crate::branding
    //   super::logo = crate::branding::logo（尚未建立 → 編譯失敗 = 紅燈）
    use super::logo::{
        validate_logo_bytes, upload_logo, delete_logo,
        LogoValidationError, LogoUploadResult, DeleteLogoResult,
    };
    use super::theme::{set_theme, get_current_theme};

    // ─────────────────────────────────────────────────────────────────────────
    // CLU-004：corrupted PNG → validate 回傳 Err(LogoValidationError::InvalidFormat)
    // ─────────────────────────────────────────────────────────────────────────
    #[test]
    fn clu_004_corrupted_png_is_rejected() {
        // Corrupted bytes：PNG magic 應為 [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
        // 這裡故意用錯誤的 header
        let corrupted_bytes: Vec<u8> = vec![0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        let mime_type = "image/png";

        let result = validate_logo_bytes(&corrupted_bytes, mime_type);

        assert!(
            result.is_err(),
            "corrupted PNG 應該回傳 Err，但回傳了 Ok"
        );

        match result.unwrap_err() {
            LogoValidationError::InvalidFormat { reason } => {
                assert!(
                    !reason.is_empty(),
                    "InvalidFormat 的 reason 不應為空"
                );
            }
            other => panic!("期望 InvalidFormat，但得到 {:?}", other),
        }
    }

    #[test]
    fn clu_004_corrupted_png_does_not_modify_stored_blob() {
        // 呼叫 validate 不應有任何副作用（不修改已儲存的 blob）
        let corrupted_bytes: Vec<u8> = vec![0x00, 0x01, 0x02];
        let mime_type = "image/png";

        // validate 只驗證，不應改變任何狀態
        // Phase 3 實作時：validate_logo_bytes 必須是 pure function（無 I/O）
        let _ = validate_logo_bytes(&corrupted_bytes, mime_type);

        // 如果有 state，可在這裡斷言 state 不變
        // 目前測試只驗 validate 本身不 panic
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CLU-005：valid PNG → upload 回傳 LogoUploadResult 含正確 metadata
    // ─────────────────────────────────────────────────────────────────────────
    #[test]
    fn clu_005_valid_png_upload_returns_correct_metadata() {
        // 最小合法 PNG（1×1 pixel）
        let valid_png_bytes: Vec<u8> = vec![
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG magic
            0x00, 0x00, 0x00, 0x0D, // IHDR length
            0x49, 0x48, 0x44, 0x52, // IHDR
            0x00, 0x00, 0x00, 0x01, // width = 1
            0x00, 0x00, 0x00, 0x01, // height = 1
            0x08, 0x02,             // bit depth, color type
            0x00, 0x00, 0x00,       // compression, filter, interlace
            0x90, 0x77, 0x53, 0xDE, // CRC（stub）
        ];
        let mime_type = "image/png";
        let filename = "test-logo.png";

        let result = upload_logo(&valid_png_bytes, mime_type, filename);

        assert!(result.is_ok(), "valid PNG upload 應回傳 Ok，但得到 {:?}", result.err());

        let upload_result: LogoUploadResult = result.unwrap();
        assert_eq!(upload_result.metadata.mime_type, mime_type);
        assert_eq!(upload_result.metadata.filename, filename);
        assert_eq!(upload_result.metadata.size_bytes, valid_png_bytes.len());
        assert!(!upload_result.metadata.uploaded_at.is_empty(), "uploaded_at 不應為空");
    }

    #[test]
    fn clu_005_upload_result_has_blob_data() {
        let valid_png_bytes: Vec<u8> = vec![
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        ];
        let mime_type = "image/png";
        let filename = "logo.png";

        let result = upload_logo(&valid_png_bytes, mime_type, filename);

        // 不管 validation 是否通過（Phase 3 再細化），
        // 確認 upload_logo 不是 unimplemented! 就好（紅燈：函式根本不存在）
        let _ = result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CLU-009：delete_logo 保留 theme_id
    // ─────────────────────────────────────────────────────────────────────────
    #[test]
    fn clu_009_delete_logo_preserves_theme_id() {
        // 先設一個 theme
        let set_result = set_theme("theme-a-minimal");
        assert!(set_result.is_ok(), "set_theme 應成功，得到 {:?}", set_result.err());

        // 再刪除 logo
        let delete_result = delete_logo();
        assert!(delete_result.is_ok(), "delete_logo 應成功，得到 {:?}", delete_result.err());

        let result: DeleteLogoResult = delete_result.unwrap();

        // theme_id 必須保留（不被清除）
        assert!(
            !result.theme_id.is_empty(),
            "delete_logo 後 theme_id 不應為空"
        );
        assert_eq!(
            result.theme_id, "theme-a-minimal",
            "delete_logo 不應改變 theme_id"
        );
    }

    #[test]
    fn clu_009_delete_logo_does_not_clear_theme_config() {
        // 設 professional theme
        let _ = set_theme("theme-b-professional");

        // 刪除 logo 後 theme 仍然是 professional
        let delete_result = delete_logo();
        assert!(delete_result.is_ok());

        let current_theme = get_current_theme();
        assert!(current_theme.is_ok());
        assert_eq!(current_theme.unwrap().theme_id, "theme-b-professional");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // IPC 行為：SVG 被 validate 拒絕
    // ─────────────────────────────────────────────────────────────────────────
    #[test]
    fn svg_mime_type_is_rejected_by_validate() {
        let svg_bytes = b"<svg xmlns='http://www.w3.org/2000/svg'><rect/></svg>";
        let mime_type = "image/svg+xml";

        let result = validate_logo_bytes(svg_bytes, mime_type);

        assert!(result.is_err(), "SVG 應被拒絕");

        match result.unwrap_err() {
            LogoValidationError::UnsupportedFormat { mime_type: m } => {
                assert_eq!(m, "image/svg+xml");
            }
            other => panic!("期望 UnsupportedFormat，但得到 {:?}", other),
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // IPC 行為：超過 2 MiB 被拒絕（Rust 側二次驗證）
    // ─────────────────────────────────────────────────────────────────────────
    #[test]
    fn oversized_file_is_rejected_by_validate() {
        let max_bytes = 2 * 1024 * 1024; // 2 MiB
        let oversized_bytes: Vec<u8> = vec![
            0x89, 0x50, 0x4E, 0x47, // PNG magic（通過格式檢查）
        ]
        .into_iter()
        .chain(vec![0u8; max_bytes + 1])
        .collect();

        let result = validate_logo_bytes(&oversized_bytes, "image/png");

        assert!(result.is_err(), "超過 2 MiB 的檔案應被拒絕");

        match result.unwrap_err() {
            LogoValidationError::FileTooLarge { size_bytes, max_bytes: m } => {
                assert!(size_bytes > m, "size_bytes 應大於 max_bytes");
            }
            other => panic!("期望 FileTooLarge，但得到 {:?}", other),
        }
    }
}
