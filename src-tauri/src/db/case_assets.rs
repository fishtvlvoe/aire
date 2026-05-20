// AIRE — Case local assets repository
//
// Bridge 階段只處理 floor_plan raster asset；完整多圖審核流留到後續 SDD。

use rusqlite::{params, Connection, Row};
use serde::{Deserialize, Serialize};

use super::DbError;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CaseAsset {
    pub id: String,
    pub case_id: String,
    pub kind: String,
    pub source: String,
    pub trust_tier: String,
    pub review_status: String,
    pub is_primary: bool,
    pub file_name: String,
    pub mime_type: String,
    pub size_bytes: i64,
    pub storage_path: String,
    pub metadata_json: String,
    pub created_at: String,
    pub updated_at: String,
}

const COLS: &str = "id, case_id, kind, source, trust_tier, review_status, is_primary, \
  file_name, mime_type, size_bytes, storage_path, metadata_json, created_at, updated_at";

fn map_row(row: &Row<'_>) -> rusqlite::Result<CaseAsset> {
    let is_primary_int: i64 = row.get(6)?;
    Ok(CaseAsset {
        id: row.get(0)?,
        case_id: row.get(1)?,
        kind: row.get(2)?,
        source: row.get(3)?,
        trust_tier: row.get(4)?,
        review_status: row.get(5)?,
        is_primary: is_primary_int == 1,
        file_name: row.get(7)?,
        mime_type: row.get(8)?,
        size_bytes: row.get(9)?,
        storage_path: row.get(10)?,
        metadata_json: row.get(11)?,
        created_at: row.get(12)?,
        updated_at: row.get(13)?,
    })
}

pub fn insert_asset(conn: &Connection, asset: &CaseAsset) -> Result<(), DbError> {
    if asset.is_primary {
        conn.execute(
            "UPDATE case_assets SET is_primary=0, updated_at=?1 \
             WHERE case_id=?2 AND kind=?3 AND is_primary=1",
            params![asset.updated_at, asset.case_id, asset.kind],
        )?;
    }

    conn.execute(
        &format!(
            "INSERT INTO case_assets ({COLS}) VALUES \
          (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)"
        ),
        params![
            asset.id,
            asset.case_id,
            asset.kind,
            asset.source,
            asset.trust_tier,
            asset.review_status,
            if asset.is_primary { 1 } else { 0 },
            asset.file_name,
            asset.mime_type,
            asset.size_bytes,
            asset.storage_path,
            asset.metadata_json,
            asset.created_at,
            asset.updated_at,
        ],
    )?;
    Ok(())
}

pub fn list_assets(
    conn: &Connection,
    case_id: &str,
    kind: Option<&str>,
) -> Result<Vec<CaseAsset>, DbError> {
    let sql = if kind.is_some() {
        format!(
            "SELECT {COLS} FROM case_assets WHERE case_id=?1 AND kind=?2 \
             ORDER BY is_primary DESC, updated_at DESC"
        )
    } else {
        format!(
            "SELECT {COLS} FROM case_assets WHERE case_id=?1 \
             ORDER BY is_primary DESC, updated_at DESC"
        )
    };

    let mut stmt = conn.prepare(&sql)?;
    let rows = if let Some(kind) = kind {
        stmt.query_map(params![case_id, kind], map_row)?
            .collect::<Result<Vec<_>, _>>()?
    } else {
        stmt.query_map(params![case_id], map_row)?
            .collect::<Result<Vec<_>, _>>()?
    };
    Ok(rows)
}

pub fn get_asset(conn: &Connection, asset_id: &str) -> Result<CaseAsset, DbError> {
    conn.query_row(
        &format!("SELECT {COLS} FROM case_assets WHERE id=?1"),
        [asset_id],
        map_row,
    )
    .map_err(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => DbError::not_found("case_asset"),
        other => DbError::from(other),
    })
}

pub fn delete_asset(conn: &Connection, asset_id: &str) -> Result<CaseAsset, DbError> {
    let asset = get_asset(conn, asset_id)?;
    let n = conn.execute("DELETE FROM case_assets WHERE id=?1", [asset_id])?;
    if n == 0 {
        return Err(DbError::not_found("case_asset"));
    }
    Ok(asset)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{cases, tests::open_in_memory};

    fn insert_case(conn: &Connection, id: &str) {
        let case = cases::Case {
            id: id.into(),
            case_no: Some("AIRE-ASSET".into()),
            property_type: "residential".into(),
            land_lot_no: "測試段1".into(),
            address: "台南市測試路1號".into(),
            owner_name: Some("測試屋主".into()),
            status: "draft".into(),
            created_at: 1,
            updated_at: 1,
            case_name: None,
            building_lot_no: None,
            asking_price: None,
            land_lots: vec!["測試段1".into()],
            land_registry_data: None,
            current_step: 1,
        };
        cases::insert_case(conn, &case).unwrap();
    }

    fn asset(id: &str, case_id: &str, is_primary: bool, updated_at: &str) -> CaseAsset {
        CaseAsset {
            id: id.into(),
            case_id: case_id.into(),
            kind: "floor_plan".into(),
            source: "manual_upload".into(),
            trust_tier: "assistant_uploaded".into(),
            review_status: "approved".into(),
            is_primary,
            file_name: "floor.png".into(),
            mime_type: "image/png".into(),
            size_bytes: 3,
            storage_path: "/tmp/floor.png".into(),
            metadata_json: "{}".into(),
            created_at: updated_at.into(),
            updated_at: updated_at.into(),
        }
    }

    #[test]
    fn migration_creates_case_assets_table() {
        let conn = open_in_memory();
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='case_assets'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn insert_list_get_and_delete_asset() {
        let conn = open_in_memory();
        insert_case(&conn, "case-asset-1");
        let a = asset("asset-1", "case-asset-1", true, "2026-05-20T12:00:00+08:00");

        insert_asset(&conn, &a).unwrap();
        let list = list_assets(&conn, "case-asset-1", Some("floor_plan")).unwrap();
        assert_eq!(list, vec![a.clone()]);

        let got = get_asset(&conn, "asset-1").unwrap();
        assert_eq!(got.file_name, "floor.png");

        let deleted = delete_asset(&conn, "asset-1").unwrap();
        assert_eq!(deleted.id, "asset-1");
        assert!(list_assets(&conn, "case-asset-1", Some("floor_plan"))
            .unwrap()
            .is_empty());
    }

    #[test]
    fn new_primary_replaces_existing_primary() {
        let conn = open_in_memory();
        insert_case(&conn, "case-asset-2");

        insert_asset(
            &conn,
            &asset(
                "asset-old",
                "case-asset-2",
                true,
                "2026-05-20T12:00:00+08:00",
            ),
        )
        .unwrap();
        insert_asset(
            &conn,
            &asset(
                "asset-new",
                "case-asset-2",
                true,
                "2026-05-20T12:05:00+08:00",
            ),
        )
        .unwrap();

        let list = list_assets(&conn, "case-asset-2", Some("floor_plan")).unwrap();
        assert_eq!(list[0].id, "asset-new");
        assert!(list[0].is_primary);
        assert!(
            !list
                .iter()
                .find(|a| a.id == "asset-old")
                .unwrap()
                .is_primary
        );
    }
}
