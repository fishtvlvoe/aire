// AIRE — Disclosure drafts repository
//
// 依據：openspec/changes/aire-desktop-phase1/design.md D2
// capability: local-database / Disclosure drafts table schema

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

use super::DbError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DraftData {
    pub case_id: String,
    pub payload_json: String, // 由前端序列化好的 JSON 字串
    pub schema_version: i64,
    pub saved_at: i64,
}

/// UPSERT 草稿（同一 case_id 覆寫）。
///
/// 用 `INSERT OR REPLACE`：第二次寫入同一 case_id 會替換舊 row。
pub fn upsert_draft(
    conn: &Connection,
    case_id: &str,
    payload_json: &str,
    schema_version: i64,
    saved_at: i64,
) -> Result<(), DbError> {
    conn.execute(
        "INSERT OR REPLACE INTO disclosure_drafts \
         (case_id, payload_json, schema_version, saved_at) \
         VALUES (?1, ?2, ?3, ?4)",
        params![case_id, payload_json, schema_version, saved_at],
    )?;
    Ok(())
}

/// 取得草稿；不存在回 `Ok(None)`。
pub fn get_draft(conn: &Connection, case_id: &str) -> Result<Option<DraftData>, DbError> {
    let r = conn.query_row(
        "SELECT case_id, payload_json, schema_version, saved_at \
         FROM disclosure_drafts WHERE case_id = ?1",
        [case_id],
        |row| {
            Ok(DraftData {
                case_id: row.get(0)?,
                payload_json: row.get(1)?,
                schema_version: row.get(2)?,
                saved_at: row.get(3)?,
            })
        },
    );
    match r {
        Ok(d) => Ok(Some(d)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(DbError::from(e)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::cases::{insert_case, Case};
    use crate::db::tests::open_in_memory;

    fn parent_case(conn: &Connection, id: &str) {
        let c = Case {
            id: id.to_string(),
            case_no: None,
            property_type: "land".into(),
            land_lot_no: "X-1".into(),
            address: "addr".into(),
            owner_name: None,
            status: "draft".into(),
            created_at: 1,
            updated_at: 1,
            case_name: None,
            building_lot_no: None,
            asking_price: None,
        };
        insert_case(conn, &c).unwrap();
    }

    #[test]
    fn get_missing_returns_none() {
        let conn = open_in_memory();
        assert!(get_draft(&conn, "no-id").unwrap().is_none());
    }

    #[test]
    fn upsert_and_read_back() {
        let conn = open_in_memory();
        let cid = "33333333-3333-3333-3333-333333333333";
        parent_case(&conn, cid);
        upsert_draft(&conn, cid, "{\"a\":1}", 1, 100).unwrap();
        let d = get_draft(&conn, cid).unwrap().unwrap();
        assert_eq!(d.payload_json, "{\"a\":1}");

        // 第二次 UPSERT 覆寫
        upsert_draft(&conn, cid, "{\"a\":2}", 1, 200).unwrap();
        let d2 = get_draft(&conn, cid).unwrap().unwrap();
        assert_eq!(d2.payload_json, "{\"a\":2}");
        assert_eq!(d2.saved_at, 200);
    }

    #[test]
    fn cascade_delete_when_case_deleted() {
        let conn = open_in_memory();
        let cid = "44444444-4444-4444-4444-444444444444";
        parent_case(&conn, cid);
        upsert_draft(&conn, cid, "{}", 1, 1).unwrap();
        conn.execute("DELETE FROM cases WHERE id = ?1", [cid])
            .unwrap();
        assert!(get_draft(&conn, cid).unwrap().is_none());
    }
}
