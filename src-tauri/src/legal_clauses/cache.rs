use rusqlite::{params, Connection};

use crate::legal_clauses::LegalClause;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CacheWriteError {
    StorageFull {
        available_bytes: u64,
        law_id: String,
    },
    Sqlite {
        law_id: String,
        message: String,
    },
}

fn ensure_schema(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS legal_clauses (\
            law_id TEXT PRIMARY KEY,\
            title TEXT NOT NULL,\
            content_markdown TEXT NOT NULL,\
            version_date TEXT NOT NULL,\
            fetched_at TEXT NOT NULL,\
            source_url TEXT NOT NULL\
        );",
    )
}

pub fn upsert_law(conn: &Connection, clause: &LegalClause) -> Result<(), CacheWriteError> {
    ensure_schema(conn).map_err(|e| CacheWriteError::Sqlite {
        law_id: clause.law_id.clone(),
        message: e.to_string(),
    })?;

    let res = conn.execute(
        "INSERT OR REPLACE INTO legal_clauses \
         (law_id, title, content_markdown, version_date, fetched_at, source_url) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            clause.law_id,
            clause.title,
            clause.content_markdown,
            clause.version_date,
            clause.fetched_at,
            clause.source_url
        ],
    );

    match res {
        Ok(_) => Ok(()),
        Err(rusqlite::Error::SqliteFailure(err, _)) if err.extended_code == 13 => {
            Err(CacheWriteError::StorageFull {
                available_bytes: 0,
                law_id: clause.law_id.clone(),
            })
        }
        Err(e) => Err(CacheWriteError::Sqlite {
            law_id: clause.law_id.clone(),
            message: e.to_string(),
        }),
    }
}

pub fn get_law(conn: &Connection, law_id: &str) -> Result<Option<LegalClause>, rusqlite::Error> {
    ensure_schema(conn)?;

    let mut stmt = conn.prepare(
        "SELECT law_id, title, content_markdown, version_date, fetched_at, source_url \
         FROM legal_clauses WHERE law_id=?1",
    )?;

    let mut rows = stmt.query([law_id])?;
    if let Some(row) = rows.next()? {
        Ok(Some(LegalClause {
            law_id: row.get(0)?,
            title: row.get(1)?,
            content_markdown: row.get(2)?,
            version_date: row.get(3)?,
            fetched_at: row.get(4)?,
            source_url: row.get(5)?,
        }))
    } else {
        Ok(None)
    }
}

pub fn list_laws(conn: &Connection) -> Result<Vec<LegalClause>, rusqlite::Error> {
    ensure_schema(conn)?;

    let mut stmt = conn.prepare(
        "SELECT law_id, title, content_markdown, version_date, fetched_at, source_url FROM legal_clauses",
    )?;

    let iter = stmt.query_map([], |row| {
        Ok(LegalClause {
            law_id: row.get(0)?,
            title: row.get(1)?,
            content_markdown: row.get(2)?,
            version_date: row.get(3)?,
            fetched_at: row.get(4)?,
            source_url: row.get(5)?,
        })
    })?;

    let mut out = Vec::new();
    for r in iter {
        out.push(r?);
    }
    Ok(out)
}

pub fn max_fetched_at(conn: &Connection) -> Result<Option<String>, rusqlite::Error> {
    ensure_schema(conn)?;

    let v: Option<String> =
        conn.query_row("SELECT MAX(fetched_at) FROM legal_clauses", [], |r| {
            r.get(0)
        })?;
    Ok(v)
}

pub fn is_cache_stale(fetched_at: &str, now: &str, ttl_days: i64) -> bool {
    let fetched = chrono::DateTime::parse_from_rfc3339(fetched_at).ok();
    let now = chrono::DateTime::parse_from_rfc3339(now).ok();
    if let (Some(f), Some(n)) = (fetched, now) {
        let age = n.signed_duration_since(f);
        age > chrono::Duration::days(ttl_days)
    } else {
        true
    }
}

// Compatibility re-exports for test names
pub fn write_clause(conn: &Connection, clause: &LegalClause) -> Result<(), CacheWriteError> {
    upsert_law(conn, clause)
}

pub fn read_clause(conn: &Connection, law_id: &str) -> Result<LegalClause, rusqlite::Error> {
    get_law(conn, law_id)?.ok_or(rusqlite::Error::QueryReturnedNoRows)
}

pub fn is_cache_stale_check(fetched_at: &str, now: &str, ttl_days: i64) -> bool {
    is_cache_stale(fetched_at, now, ttl_days)
}

#[cfg(test)]
include!("cache/tests.rs");
