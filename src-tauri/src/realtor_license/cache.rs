use rusqlite::{params, Connection};

use crate::realtor_license::LicenseStatus;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LicenseCacheRow {
    pub license_number: String,
    pub status: String,
    pub verified_at: String,
    pub cache_expires_at: String,
}

fn ensure_schema(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS realtor_licenses (\
            license_number TEXT PRIMARY KEY,\
            status TEXT NOT NULL CHECK (status IN ('verified','not_found','expired')),\
            verified_at TEXT NOT NULL,\
            cache_expires_at TEXT NOT NULL\
        );",
    )
}

fn status_to_str(status: &LicenseStatus) -> Option<&'static str> {
    match status {
        LicenseStatus::Verified { .. } => Some("verified"),
        LicenseStatus::NotFound => Some("not_found"),
        LicenseStatus::Expired { .. } => Some("expired"),
        LicenseStatus::Timeout => None,
        LicenseStatus::Offline { .. } => None,
    }
}

pub fn write_license_cache(
    conn: &Connection,
    license_number: &str,
    status: &LicenseStatus,
    verified_at: &str,
) -> Result<(), rusqlite::Error> {
    ensure_schema(conn)?;

    let status_str = match status_to_str(status) {
        Some(s) => s,
        None => return Ok(()), // do not cache Timeout/Offline
    };

    let verified = chrono::DateTime::parse_from_rfc3339(verified_at)
        .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
    let expires = (verified + chrono::Duration::days(7)).to_rfc3339_opts(chrono::SecondsFormat::Secs, true);

    conn.execute(
        "INSERT OR REPLACE INTO realtor_licenses (license_number, status, verified_at, cache_expires_at) \
         VALUES (?1, ?2, ?3, ?4)",
        params![license_number, status_str, verified_at, expires],
    )?;
    Ok(())
}

pub fn read_license_cache(
    conn: &Connection,
    license_number: &str,
) -> Result<Option<LicenseCacheRow>, rusqlite::Error> {
    ensure_schema(conn)?;

    let mut stmt = conn.prepare(
        "SELECT license_number, status, verified_at, cache_expires_at \
         FROM realtor_licenses WHERE license_number=?1",
    )?;
    let mut rows = stmt.query([license_number])?;
    if let Some(r) = rows.next()? {
        Ok(Some(LicenseCacheRow {
            license_number: r.get(0)?,
            status: r.get(1)?,
            verified_at: r.get(2)?,
            cache_expires_at: r.get(3)?,
        }))
    } else {
        Ok(None)
    }
}

pub fn is_license_cache_valid(conn: &Connection, license_number: &str, now: &str) -> bool {
    let row = match read_license_cache(conn, license_number) {
        Ok(Some(r)) => r,
        _ => return false,
    };

    let now = chrono::DateTime::parse_from_rfc3339(now).ok();
    let exp = chrono::DateTime::parse_from_rfc3339(&row.cache_expires_at).ok();
    match (now, exp) {
        (Some(n), Some(e)) => n <= e,
        _ => false,
    }
}

pub fn seed_expired_license(conn: &Connection, license_number: &str, verified_at: &str) -> Result<(), rusqlite::Error> {
    // seed a verified row whose cache_expires_at is 7 days after verified_at
    write_license_cache(
        conn,
        license_number,
        &LicenseStatus::Verified {
            expires_at: "2030-01-01".to_string(),
        },
        verified_at,
    )
}

#[cfg(test)]
include!("cache/tests.rs");
