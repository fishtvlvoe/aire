use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use tauri::{Emitter, State, Window};

use crate::DbState;

pub mod logo;
pub mod theme;

const MAX_LOGO_BYTES: usize = 2 * 1024 * 1024; // 2 MiB

#[derive(Debug, Serialize, Clone)]
pub enum BrandingError {
    CorruptedImage,
    UnsupportedFormat,
    LogoTooLarge,
    DatabaseError(String),
}

impl BrandingError {
    fn db(msg: impl Into<String>) -> Self {
        BrandingError::DatabaseError(msg.into())
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LogoData {
    pub bytes: Vec<u8>,
    pub mime: String,
}

fn lock(db: &DbState) -> Result<std::sync::MutexGuard<'_, Connection>, BrandingError> {
    db.0.lock()
        .map_err(|e| BrandingError::db(format!("db lock poisoned: {e}")))
}

fn ensure_schema(conn: &Connection) -> Result<(), BrandingError> {
    conn.execute_batch(include_str!("../../migrations/002_branding.sql"))
        .map_err(|e| BrandingError::db(e.to_string()))?;
    Ok(())
}

fn validate_logo_strict(bytes: &[u8], mime: &str) -> Result<(), BrandingError> {
    if bytes.len() > MAX_LOGO_BYTES {
        return Err(BrandingError::LogoTooLarge);
    }
    if mime != "image/png" && mime != "image/jpeg" {
        return Err(BrandingError::UnsupportedFormat);
    }
    image::load_from_memory(bytes).map_err(|_| BrandingError::CorruptedImage)?;
    Ok(())
}

#[tauri::command]
pub async fn save_logo(
    bytes: Vec<u8>,
    mime: String,
    db: State<'_, DbState>,
) -> Result<(), BrandingError> {
    validate_logo_strict(&bytes, &mime)?;

    let conn = lock(&db)?;
    ensure_schema(&conn)?;

    conn.execute(
        "UPDATE branding SET logo_blob=?1, logo_mime=?2, logo_uploaded_at=datetime('now') WHERE id=1",
        params![bytes, mime],
    )
    .map_err(|e| BrandingError::db(e.to_string()))?;

    Ok(())
}

#[tauri::command]
pub async fn load_logo(db: State<'_, DbState>) -> Result<Option<LogoData>, BrandingError> {
    let conn = lock(&db)?;
    ensure_schema(&conn)?;

    let r = conn.query_row(
        "SELECT logo_blob, logo_mime FROM branding WHERE id=1",
        [],
        |row| {
            let blob: Option<Vec<u8>> = row.get(0)?;
            let mime: Option<String> = row.get(1)?;
            Ok((blob, mime))
        },
    );

    match r {
        Ok((Some(bytes), Some(mime))) => Ok(Some(LogoData { bytes, mime })),
        Ok((None, _)) => Ok(None),
        Ok((_, None)) => Ok(None),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(BrandingError::db(e.to_string())),
    }
}

#[tauri::command]
pub async fn delete_logo(db: State<'_, DbState>) -> Result<(), BrandingError> {
    let conn = lock(&db)?;
    ensure_schema(&conn)?;

    conn.execute(
        "UPDATE branding SET logo_blob=NULL, logo_mime=NULL, logo_uploaded_at=NULL WHERE id=1",
        [],
    )
    .map_err(|e| BrandingError::db(e.to_string()))?;

    Ok(())
}

#[derive(Debug, Serialize, Clone)]
struct BrandingChangedEvent {
    theme_id: String,
}

#[tauri::command]
pub async fn set_theme(
    theme_id: String,
    window: Window,
    db: State<'_, DbState>,
) -> Result<(), BrandingError> {
    let theme_id_trimmed = theme_id.trim();
    if theme_id_trimmed.is_empty() {
        return Err(BrandingError::DatabaseError(
            "theme_id cannot be empty".into(),
        ));
    }

    let conn = lock(&db)?;
    ensure_schema(&conn)?;

    conn.execute(
        "UPDATE branding SET theme_id=?1, updated_at=datetime('now') WHERE id=1",
        params![theme_id_trimmed],
    )
    .map_err(|e| BrandingError::db(e.to_string()))?;

    let _ = window.emit(
        "branding-changed",
        BrandingChangedEvent {
            theme_id: theme_id_trimmed.to_string(),
        },
    );

    Ok(())
}

#[tauri::command]
pub async fn get_theme(db: State<'_, DbState>) -> Result<String, BrandingError> {
    let conn = lock(&db)?;
    ensure_schema(&conn)?;

    let r: Result<String, rusqlite::Error> =
        conn.query_row("SELECT theme_id FROM branding WHERE id=1", [], |row| {
            row.get(0)
        });

    match r {
        Ok(theme_id) => Ok(theme_id),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok("theme-a-minimal".into()),
        Err(e) => Err(BrandingError::db(e.to_string())),
    }
}

#[cfg(test)]
pub mod tests {
    // 讓 include! 進來的測試可以透過 `super::logo` / `super::theme` 解析到實作。
    pub mod logo {
        pub use super::super::logo::*;
    }
    pub mod theme {
        pub use super::super::theme::*;
    }

    include!("tests.rs");
}
