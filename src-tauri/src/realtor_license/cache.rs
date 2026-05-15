use chrono::{Duration, Utc};
use rusqlite::{params, Connection};

use super::LicenseStatus;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct CachedLicense {
    pub status: LicenseStatus,
    pub verified_at: String,
}

pub fn upsert_verification(
    conn: &Connection,
    license_number: &str,
    status: &LicenseStatus,
    verified_at: &str,
) -> Result<(), String> {
    let cache_expires_at = (Utc::now() + Duration::days(7)).to_rfc3339();
    conn.execute(
        r#"
        INSERT OR REPLACE INTO realtor_licenses
        (license_number, status, verified_at, cache_expires_at)
        VALUES (?1, ?2, ?3, ?4)
        "#,
        params![
            license_number,
            status_to_db(status),
            verified_at,
            cache_expires_at
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_cached(
    conn: &Connection,
    license_number: &str,
) -> Result<Option<CachedLicense>, String> {
    let mut stmt = conn
        .prepare(
            r#"
            SELECT status, verified_at, cache_expires_at
            FROM realtor_licenses
            WHERE license_number = ?1
        "#,
        )
        .map_err(|e| e.to_string())?;
    let mut rows = stmt
        .query(params![license_number])
        .map_err(|e| e.to_string())?;
    let Some(row) = rows.next().map_err(|e| e.to_string())? else {
        return Ok(None);
    };

    let expires_at: String = row.get(2).map_err(|e| e.to_string())?;
    let expires_at = chrono::DateTime::parse_from_rfc3339(&expires_at)
        .map_err(|e| e.to_string())?
        .with_timezone(&Utc);
    if Utc::now() > expires_at {
        return Ok(None);
    }

    let status: String = row.get(0).map_err(|e| e.to_string())?;
    let verified_at: String = row.get(1).map_err(|e| e.to_string())?;
    Ok(Some(CachedLicense {
        status: status_from_db(&status)?,
        verified_at,
    }))
}

pub fn get_latest(
    conn: &Connection,
    license_number: &str,
) -> Result<Option<CachedLicense>, String> {
    let mut stmt = conn
        .prepare(
            r#"
            SELECT status, verified_at
            FROM realtor_licenses
            WHERE license_number = ?1
        "#,
        )
        .map_err(|e| e.to_string())?;
    let mut rows = stmt
        .query(params![license_number])
        .map_err(|e| e.to_string())?;
    let Some(row) = rows.next().map_err(|e| e.to_string())? else {
        return Ok(None);
    };
    let status: String = row.get(0).map_err(|e| e.to_string())?;
    let verified_at: String = row.get(1).map_err(|e| e.to_string())?;
    Ok(Some(CachedLicense {
        status: status_from_db(&status)?,
        verified_at,
    }))
}

fn status_to_db(status: &LicenseStatus) -> &'static str {
    match status {
        LicenseStatus::Verified => "verified",
        LicenseStatus::NotFound => "not_found",
        LicenseStatus::Expired => "expired",
    }
}

fn status_from_db(status: &str) -> Result<LicenseStatus, String> {
    match status {
        "verified" => Ok(LicenseStatus::Verified),
        "not_found" => Ok(LicenseStatus::NotFound),
        "expired" => Ok(LicenseStatus::Expired),
        _ => Err("invalid status".to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_conn() -> Connection {
        let conn = Connection::open_in_memory().expect("open in memory");
        conn.execute_batch(
            r#"
            CREATE TABLE realtor_licenses (
              license_number TEXT PRIMARY KEY,
              status TEXT NOT NULL CHECK(status IN ('verified','not_found','expired')),
              verified_at TEXT NOT NULL,
              cache_expires_at TEXT NOT NULL
            );
        "#,
        )
        .expect("create table");
        conn
    }

    #[test]
    fn upsert_and_get_cached_work() {
        let conn = setup_conn();
        upsert_verification(
            &conn,
            "A123456789",
            &LicenseStatus::Verified,
            "2026-05-15T00:00:00Z",
        )
        .expect("upsert");
        let cached = get_cached(&conn, "A123456789").expect("cached");
        assert!(cached.is_some());
    }
}
