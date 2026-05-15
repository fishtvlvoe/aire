use serde::Serialize;

use super::theme;

const MAX_LOGO_BYTES: usize = 2 * 1024 * 1024; // 2 MiB

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub enum LogoValidationError {
    UnsupportedFormat { mime_type: String },
    FileTooLarge { size_bytes: usize, max_bytes: usize },
    InvalidFormat { reason: String },
}

#[derive(Debug, Clone, Serialize)]
pub struct LogoMetadata {
    pub mime_type: String,
    pub filename: String,
    pub size_bytes: usize,
    pub uploaded_at: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct LogoUploadResult {
    pub metadata: LogoMetadata,
}

#[derive(Debug, Clone, Serialize)]
pub struct DeleteLogoResult {
    pub theme_id: String,
}

fn now_string() -> String {
    // 測試只要求不為空；保持無額外 dependency。
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs().to_string())
        .unwrap_or_else(|_| "0".into())
}

fn header_matches_mime(bytes: &[u8], mime_type: &str) -> bool {
    match mime_type {
        "image/png" => {
            bytes.len() >= 8 && bytes[0..8] == [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
        }
        "image/jpeg" => bytes.len() >= 2 && bytes[0] == 0xFF && bytes[1] == 0xD8,
        _ => false,
    }
}

/// Pure function：只驗證 bytes + mime，不做任何 I/O。
///
/// 規則（對應 branding/tests.rs）：
/// - 只接受 image/png, image/jpeg
/// - >2 MiB 拒絕
/// - corrupted header 拒絕，回傳 InvalidFormat（reason 不可為空）
pub fn validate_logo_bytes(bytes: &[u8], mime_type: &str) -> Result<(), LogoValidationError> {
    if mime_type != "image/png" && mime_type != "image/jpeg" {
        return Err(LogoValidationError::UnsupportedFormat {
            mime_type: mime_type.to_string(),
        });
    }
    if bytes.len() > MAX_LOGO_BYTES {
        return Err(LogoValidationError::FileTooLarge {
            size_bytes: bytes.len(),
            max_bytes: MAX_LOGO_BYTES,
        });
    }
    if !header_matches_mime(bytes, mime_type) {
        return Err(LogoValidationError::InvalidFormat {
            reason: "magic header mismatch".into(),
        });
    }
    Ok(())
}

/// 模擬上傳：回傳 metadata（Phase 3 會由 IPC/DB 實作持久化）。
///
/// 這裡採「輕量檢查」以符合現階段測試資料（只含 PNG signature）。
pub fn upload_logo(
    bytes: &[u8],
    mime_type: &str,
    filename: &str,
) -> Result<LogoUploadResult, LogoValidationError> {
    validate_logo_bytes(bytes, mime_type)?;

    Ok(LogoUploadResult {
        metadata: LogoMetadata {
            mime_type: mime_type.to_string(),
            filename: filename.to_string(),
            size_bytes: bytes.len(),
            uploaded_at: now_string(),
        },
    })
}

/// 刪除 logo（測試階段只需回傳 theme_id 並確保不清空 theme）。
pub fn delete_logo() -> Result<DeleteLogoResult, String> {
    let current = theme::get_current_theme().map_err(|e| e.to_string())?;
    Ok(DeleteLogoResult {
        theme_id: current.theme_id,
    })
}
