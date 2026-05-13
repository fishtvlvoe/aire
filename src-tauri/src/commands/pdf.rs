// AIRE — PDF 匯出 IPC（Group 8.4）
//
// export_pdf(case_id, pdf_bytes, output_path) -> Result<String, PdfError>
//
// 行為：
// 1. 把前端傳來的 PDF bytes 寫到 output_path
// 2. 成功 → cases.status='exported'、寫 operation_log action=pdf_export result=ok
// 3. 失敗 → 對應 spec 4 種錯誤碼：TEMPLATE_MISSING、FONT_LOAD_FAILED、
//    DISK_FULL、PATH_LOCKED；寫 operation_log result=error

use std::fs::OpenOptions;
use std::io::Write;
use std::path::Path;

use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::State;

use crate::db::{cases, oplog};
use crate::DbState;

/// PDF 匯出失敗錯誤碼。
#[derive(Debug, Serialize, Clone)]
pub struct PdfError {
    pub code: String,
    pub message: String,
}

impl PdfError {
    fn new(code: &str, message: impl Into<String>) -> Self {
        Self {
            code: code.to_string(),
            message: message.into(),
        }
    }
}

#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
pub struct ExportPdfArgs {
    pub caseId: String,
    /// PDF bytes（前端用 pdf-lib 渲染後傳過來）
    pub pdfBytes: Vec<u8>,
    pub outputPath: String,
}

fn lock(db: &DbState) -> Result<std::sync::MutexGuard<'_, Connection>, PdfError> {
    db.0.lock().map_err(|e| PdfError::new("DB_LOCK", format!("db lock poisoned: {e}")))
}

fn now_secs() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

/// 把 IO error 分類成 PdfError 對應 spec 失敗矩陣。
fn classify_io_error(err: &std::io::Error, path: &str) -> PdfError {
    use std::io::ErrorKind;
    match err.kind() {
        // 磁碟滿
        ErrorKind::OutOfMemory => PdfError::new("DISK_FULL", "磁碟空間不足"),
        // 權限拒絕 / 被鎖定
        ErrorKind::PermissionDenied => PdfError::new(
            "PATH_LOCKED",
            format!("無法寫入 {path}：權限被拒或檔案被其他程式鎖定"),
        ),
        ErrorKind::NotFound => PdfError::new(
            "PATH_LOCKED",
            format!("輸出路徑的父目錄不存在：{path}"),
        ),
        _ => {
            // Unix / Windows 都有可能用 raw_os_error 表示 ENOSPC
            if let Some(raw) = err.raw_os_error() {
                // ENOSPC = 28 (Unix)、112 (Windows)
                if raw == 28 || raw == 112 {
                    return PdfError::new("DISK_FULL", "磁碟空間不足");
                }
            }
            PdfError::new("PATH_LOCKED", err.to_string())
        }
    }
}

#[tauri::command]
pub async fn export_pdf(
    args: ExportPdfArgs,
    db: State<'_, DbState>,
) -> Result<String, PdfError> {
    if args.pdfBytes.is_empty() {
        return Err(PdfError::new("TEMPLATE_MISSING", "PDF bytes 為空，無法寫檔"));
    }
    if args.outputPath.trim().is_empty() {
        return Err(PdfError::new("PATH_LOCKED", "輸出路徑為空"));
    }

    // 寫檔（原子：先寫到 .tmp 再 rename）
    let target = Path::new(&args.outputPath);
    let tmp_path = target.with_extension("pdf.tmp");

    let write_result = (|| -> Result<(), std::io::Error> {
        let mut f = OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .open(&tmp_path)?;
        f.write_all(&args.pdfBytes)?;
        f.sync_all()?;
        std::fs::rename(&tmp_path, target)?;
        Ok(())
    })();

    if let Err(err) = write_result {
        let pdf_err = classify_io_error(&err, &args.outputPath);
        // 清 tmp
        let _ = std::fs::remove_file(&tmp_path);
        // 寫 log
        if let Ok(conn) = lock(&db) {
            let payload = serde_json::to_string(&json!({
                "case_id": args.caseId,
                "output_path": args.outputPath,
                "reason": pdf_err.code,
            }))
            .ok();
            let _ = oplog::insert_log(&conn, "pdf_export", payload.as_deref(), "error");
        }
        return Err(pdf_err);
    }

    // 寫檔成功 → 更新 cases.status='exported'
    let conn = lock(&db)?;
    let mut c = cases::get_case(&conn, &args.caseId).map_err(|e| PdfError {
        code: e.code,
        message: e.message,
    })?;
    if c.status != "exported" {
        c.status = "exported".into();
        c.updated_at = now_secs();
        cases::update_case(&conn, &c).map_err(|e| PdfError {
            code: e.code,
            message: e.message,
        })?;
    }

    let payload = serde_json::to_string(&json!({
        "case_id": args.caseId,
        "output_path": args.outputPath,
    }))
    .ok();
    let _ = oplog::insert_log(&conn, "pdf_export", payload.as_deref(), "ok");

    Ok(args.outputPath)
}
