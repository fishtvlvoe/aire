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

/// 品牌文字設定（業務員與公司資訊）
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct BrandTextSettings {
    pub agent_name: Option<String>,
    pub agent_cert_no: Option<String>,
    pub company_name: Option<String>,
    pub company_license_no: Option<String>,
    pub company_address: Option<String>,
    pub company_phone: Option<String>,
    pub realtor_name: Option<String>,
}

fn ensure_brand_text_columns(conn: &Connection) -> Result<(), BrandingError> {
    // ADD COLUMN 失敗即欄位已存在，忽略即可
    let cols = [
        "agent_name", "agent_cert_no", "company_name", "company_license_no",
        "company_address", "company_phone", "realtor_name",
    ];
    for col in cols {
        let _ = conn.execute(&format!("ALTER TABLE branding ADD COLUMN {col} TEXT"), []);
    }
    Ok(())
}

fn ensure_brand_row(conn: &Connection) -> Result<(), BrandingError> {
    ensure_schema(conn)?;
    ensure_brand_text_columns(conn)
}

#[tauri::command]
pub async fn get_brand_text_settings(
    db: State<'_, DbState>,
) -> Result<BrandTextSettings, BrandingError> {
    let conn = lock(&db)?;
    ensure_brand_row(&conn)?;

    let r = conn.query_row(
        "SELECT agent_name, agent_cert_no, company_name, company_license_no, \
         company_address, company_phone, realtor_name FROM branding WHERE id=1",
        [],
        |row| {
            Ok(BrandTextSettings {
                agent_name: row.get(0)?,
                agent_cert_no: row.get(1)?,
                company_name: row.get(2)?,
                company_license_no: row.get(3)?,
                company_address: row.get(4)?,
                company_phone: row.get(5)?,
                realtor_name: row.get(6)?,
            })
        },
    );

    match r {
        Ok(s) => Ok(s),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(BrandTextSettings::default()),
        Err(e) => Err(BrandingError::db(e.to_string())),
    }
}

#[tauri::command]
pub async fn save_brand_text_settings(
    settings: BrandTextSettings,
    db: State<'_, DbState>,
) -> Result<(), BrandingError> {
    let conn = lock(&db)?;
    ensure_brand_row(&conn)?;

    conn.execute(
        "UPDATE branding SET agent_name=?1, agent_cert_no=?2, company_name=?3, \
         company_license_no=?4, company_address=?5, company_phone=?6, realtor_name=?7 \
         WHERE id=1",
        params![
            settings.agent_name,
            settings.agent_cert_no,
            settings.company_name,
            settings.company_license_no,
            settings.company_address,
            settings.company_phone,
            settings.realtor_name,
        ],
    )
    .map_err(|e| BrandingError::db(e.to_string()))?;

    Ok(())
}

#[cfg(test)]
pub mod tests {
    use rusqlite::Connection;
    use crate::db::tests::open_in_memory;
    use super::{BrandTextSettings, ensure_brand_row};

    fn conn() -> Connection {
        let c = open_in_memory();
        ensure_brand_row(&c).unwrap();
        c
    }

    #[test]
    fn brand_text_default_returns_all_none() {
        let c = conn();
        let r = c.query_row(
            "SELECT agent_name, company_name FROM branding WHERE id=1",
            [],
            |row| Ok((row.get::<_, Option<String>>(0)?, row.get::<_, Option<String>>(1)?)),
        ).unwrap();
        assert!(r.0.is_none());
        assert!(r.1.is_none());
    }

    #[test]
    fn save_and_retrieve_brand_text() {
        let c = conn();
        let settings = BrandTextSettings {
            company_name: Some("大安不動產".into()),
            agent_name: Some("王小明".into()),
            ..Default::default()
        };
        c.execute(
            "UPDATE branding SET agent_name=?1, agent_cert_no=?2, company_name=?3, \
             company_license_no=?4, company_address=?5, company_phone=?6, realtor_name=?7 \
             WHERE id=1",
            rusqlite::params![
                settings.agent_name,
                settings.agent_cert_no,
                settings.company_name,
                settings.company_license_no,
                settings.company_address,
                settings.company_phone,
                settings.realtor_name,
            ],
        ).unwrap();

        let got: BrandTextSettings = c.query_row(
            "SELECT agent_name, agent_cert_no, company_name, company_license_no, \
             company_address, company_phone, realtor_name FROM branding WHERE id=1",
            [],
            |row| Ok(BrandTextSettings {
                agent_name: row.get(0)?,
                agent_cert_no: row.get(1)?,
                company_name: row.get(2)?,
                company_license_no: row.get(3)?,
                company_address: row.get(4)?,
                company_phone: row.get(5)?,
                realtor_name: row.get(6)?,
            }),
        ).unwrap();

        assert_eq!(got.company_name.as_deref(), Some("大安不動產"));
        assert_eq!(got.agent_name.as_deref(), Some("王小明"));
        assert!(got.agent_cert_no.is_none());
    }

    // 讓 include! 進來的測試可以透過 `super::logo` / `super::theme` 解析到實作。
    pub mod logo {
        pub use super::super::logo::*;
    }
    pub mod theme {
        pub use super::super::theme::*;
    }

    include!("tests.rs");
}
