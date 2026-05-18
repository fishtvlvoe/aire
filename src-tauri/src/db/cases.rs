// AIRE — Cases CRUD repository
//
// 依據：openspec/changes/aire-desktop-phase1/design.md D2
// capability: local-database / Cases table schema、Boundary handling on database errors

use rusqlite::{params, Connection, Row};
use serde::{Deserialize, Serialize};

use super::DbError;

/// 案件資料。對應 `cases` 表。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Case {
    pub id: String,              // UUID v4
    pub case_no: Option<String>, // 案件編號（助理自填）
    pub property_type: String,   // 'residential' | 'land'
    pub land_lot_no: String,
    pub address: String,
    pub owner_name: Option<String>,
    pub status: String, // 'draft' | 'completed' | 'exported'
    pub created_at: i64,
    pub updated_at: i64,
    pub case_name: Option<String>,
    pub building_lot_no: Option<String>,
    pub asking_price: Option<i64>,
}

fn map_row(row: &Row<'_>) -> rusqlite::Result<Case> {
    Ok(Case {
        id: row.get(0)?,
        case_no: row.get(1)?,
        property_type: row.get(2)?,
        land_lot_no: row.get(3)?,
        address: row.get(4)?,
        owner_name: row.get(5)?,
        status: row.get(6)?,
        created_at: row.get(7)?,
        updated_at: row.get(8)?,
        case_name: row.get(9)?,
        building_lot_no: row.get(10)?,
        asking_price: row.get(11)?,
    })
}

const COLS: &str =
    "id, case_no, property_type, land_lot_no, address, owner_name, status, created_at, updated_at, \
     case_name, building_lot_no, asking_price";

/// 插入新案件。
pub fn insert_case(conn: &Connection, c: &Case) -> Result<(), DbError> {
    conn.execute(
        &format!("INSERT INTO cases ({COLS}) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)"),
        params![
            c.id,
            c.case_no,
            c.property_type,
            c.land_lot_no,
            c.address,
            c.owner_name,
            c.status,
            c.created_at,
            c.updated_at,
            c.case_name,
            c.building_lot_no,
            c.asking_price,
        ],
    )?;
    Ok(())
}

/// 取得單一案件。找不到回 `DbError { code: "not_found", ... }`。
pub fn get_case(conn: &Connection, id: &str) -> Result<Case, DbError> {
    conn.query_row(
        &format!("SELECT {COLS} FROM cases WHERE id = ?1"),
        [id],
        map_row,
    )
    .map_err(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => DbError::not_found("case"),
        other => DbError::from(other),
    })
}

/// 列出所有案件（依 updated_at DESC）。空表回 `Ok(vec![])`。
pub fn list_cases(conn: &Connection) -> Result<Vec<Case>, DbError> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {COLS} FROM cases ORDER BY updated_at DESC"
    ))?;
    let rows = stmt.query_map([], map_row)?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(DbError::from)?);
    }
    Ok(out)
}

/// 更新案件全欄位（除了 id、created_at）。
pub fn update_case(conn: &Connection, c: &Case) -> Result<(), DbError> {
    let n = conn.execute(
        "UPDATE cases SET case_no=?1, property_type=?2, land_lot_no=?3, address=?4, \
         owner_name=?5, status=?6, updated_at=?7, case_name=?8, building_lot_no=?9, \
         asking_price=?10 WHERE id=?11",
        params![
            c.case_no,
            c.property_type,
            c.land_lot_no,
            c.address,
            c.owner_name,
            c.status,
            c.updated_at,
            c.case_name,
            c.building_lot_no,
            c.asking_price,
            c.id,
        ],
    )?;
    if n == 0 {
        return Err(DbError::not_found("case"));
    }
    Ok(())
}

/// 刪除案件（相關 disclosure_drafts 透過 FK CASCADE 自動刪除）。
pub fn delete_case(conn: &Connection, id: &str) -> Result<(), DbError> {
    let n = conn.execute("DELETE FROM cases WHERE id = ?1", [id])?;
    if n == 0 {
        return Err(DbError::not_found("case"));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::tests::open_in_memory;

    fn sample(id: &str, ts: i64) -> Case {
        Case {
            id: id.to_string(),
            case_no: Some("C001".into()),
            property_type: "residential".into(),
            land_lot_no: "台北市信義區XX段 123-4".into(),
            address: "台北市信義區XX路 1 號".into(),
            owner_name: Some("王小明".into()),
            status: "draft".into(),
            created_at: ts,
            updated_at: ts,
            case_name: None,
            building_lot_no: None,
            asking_price: None,
        }
    }

    #[test]
    fn list_empty_returns_ok_empty() {
        let conn = open_in_memory();
        let v = list_cases(&conn).unwrap();
        assert!(v.is_empty());
    }

    #[test]
    fn insert_then_get_and_list() {
        let conn = open_in_memory();
        let c = sample("11111111-1111-1111-1111-111111111111", 1700_000_000);
        insert_case(&conn, &c).unwrap();

        let got = get_case(&conn, &c.id).unwrap();
        assert_eq!(got.address, c.address);

        let all = list_cases(&conn).unwrap();
        assert_eq!(all.len(), 1);
    }

    #[test]
    fn update_and_delete() {
        let conn = open_in_memory();
        let mut c = sample("22222222-2222-2222-2222-222222222222", 1700_000_000);
        insert_case(&conn, &c).unwrap();
        c.status = "completed".into();
        c.updated_at = 1700_000_100;
        update_case(&conn, &c).unwrap();
        let got = get_case(&conn, &c.id).unwrap();
        assert_eq!(got.status, "completed");

        delete_case(&conn, &c.id).unwrap();
        let err = get_case(&conn, &c.id).unwrap_err();
        assert_eq!(err.code, "not_found");
    }

    #[test]
    fn get_missing_returns_not_found() {
        let conn = open_in_memory();
        let err = get_case(&conn, "no-such-id").unwrap_err();
        assert_eq!(err.code, "not_found");
    }

    #[test]
    fn new_fields_round_trip() {
        let conn = open_in_memory();
        let mut c = sample("33333333-3333-3333-3333-333333333333", 1700_000_000);
        c.case_name = Some("台北信義案".into());
        c.building_lot_no = Some("556-1".into());
        c.asking_price = Some(25_000_000);
        insert_case(&conn, &c).unwrap();

        let got = get_case(&conn, &c.id).unwrap();
        assert_eq!(got.case_name.as_deref(), Some("台北信義案"));
        assert_eq!(got.building_lot_no.as_deref(), Some("556-1"));
        assert_eq!(got.asking_price, Some(25_000_000));

        // 更新後仍可取回
        let mut updated = got.clone();
        updated.asking_price = Some(30_000_000);
        updated.updated_at = 1700_000_100;
        update_case(&conn, &updated).unwrap();
        let got2 = get_case(&conn, &c.id).unwrap();
        assert_eq!(got2.asking_price, Some(30_000_000));
        assert_eq!(got2.case_name.as_deref(), Some("台北信義案"));
    }
}
