use rusqlite::{params, Connection};

use super::LegalClause;

pub fn upsert_law(conn: &Connection, law: &LegalClause) -> Result<(), String> {
    conn.execute(
        r#"
        INSERT OR REPLACE INTO legal_clauses
        (law_id, title, content_markdown, version_date, fetched_at, source_url)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        "#,
        params![
            law.law_id,
            law.title,
            law.content_markdown,
            law.version_date,
            law.fetched_at,
            law.source_url
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_law(conn: &Connection, law_id: &str) -> Result<Option<LegalClause>, String> {
    let mut stmt = conn
        .prepare(
            r#"
            SELECT law_id, title, content_markdown, version_date, fetched_at, source_url
            FROM legal_clauses
            WHERE law_id = ?1
        "#,
        )
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query(params![law_id]).map_err(|e| e.to_string())?;
    let Some(row) = rows.next().map_err(|e| e.to_string())? else {
        return Ok(None);
    };

    Ok(Some(LegalClause {
        law_id: row.get(0).map_err(|e| e.to_string())?,
        title: row.get(1).map_err(|e| e.to_string())?,
        content_markdown: row.get(2).map_err(|e| e.to_string())?,
        version_date: row.get(3).map_err(|e| e.to_string())?,
        fetched_at: row.get(4).map_err(|e| e.to_string())?,
        source_url: row.get(5).map_err(|e| e.to_string())?,
    }))
}

pub fn list_laws(conn: &Connection) -> Result<Vec<LegalClause>, String> {
    let mut stmt = conn
        .prepare(
            r#"
            SELECT law_id, title, content_markdown, version_date, fetched_at, source_url
            FROM legal_clauses
            ORDER BY law_id
        "#,
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(LegalClause {
                law_id: row.get(0)?,
                title: row.get(1)?,
                content_markdown: row.get(2)?,
                version_date: row.get(3)?,
                fetched_at: row.get(4)?,
                source_url: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

pub fn max_fetched_at(conn: &Connection) -> Result<Option<String>, String> {
    conn.query_row("SELECT MAX(fetched_at) FROM legal_clauses", [], |row| row.get(0))
        .map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_conn() -> Connection {
        let conn = Connection::open_in_memory().expect("open in memory");
        conn.execute_batch(
            r#"
            CREATE TABLE legal_clauses (
              law_id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              content_markdown TEXT NOT NULL,
              version_date TEXT NOT NULL,
              fetched_at TEXT NOT NULL,
              source_url TEXT NOT NULL
            );
        "#,
        )
        .expect("create table");
        conn
    }

    fn sample(id: &str, fetched_at: &str) -> LegalClause {
        LegalClause {
            law_id: id.to_string(),
            title: "標題".to_string(),
            content_markdown: "內容".to_string(),
            version_date: "2026-05-15".to_string(),
            fetched_at: fetched_at.to_string(),
            source_url: "https://example.com".to_string(),
        }
    }

    #[test]
    fn upsert_and_get_work() {
        let conn = setup_conn();
        upsert_law(&conn, &sample("civil_code", "2026-05-15T00:00:00Z")).expect("upsert");
        let law = get_law(&conn, "civil_code").expect("get").expect("some");
        assert_eq!(law.law_id, "civil_code");
    }

    #[test]
    fn list_and_max_work() {
        let conn = setup_conn();
        upsert_law(&conn, &sample("a", "2026-05-10T00:00:00Z")).expect("upsert a");
        upsert_law(&conn, &sample("b", "2026-05-15T00:00:00Z")).expect("upsert b");
        let laws = list_laws(&conn).expect("list");
        assert_eq!(laws.len(), 2);
        let max = max_fetched_at(&conn).expect("max");
        assert_eq!(max.as_deref(), Some("2026-05-15T00:00:00Z"));
    }
}
