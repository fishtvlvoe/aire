// AIRE 整合測試 — 完整後端鏈路煙霧測試
//
// 驗證：init_db → insert_case → list_cases → get_case → update_case → PDF 寫檔
// 使用 tempdir 確保測試不汙染真實環境

use aire_lib::db::{
    cases::{get_case, insert_case, list_cases, update_case, Case},
    init_db,
};
use tempfile::TempDir;

/// 建立暫存目錄並初始化資料庫，回傳 (TempDir, Connection)。
/// TempDir 存活期間目錄不會被清除。
fn setup_db() -> (TempDir, rusqlite::Connection) {
    let dir = TempDir::new().expect("建立暫存目錄失敗");
    let db_path = dir.path().join("test.db");
    let conn = init_db(&db_path).expect("init_db 失敗");
    (dir, conn)
}

/// 產生測試用 Case
fn sample_case() -> Case {
    Case {
        id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee".to_string(),
        case_no: Some("T-001".into()),
        property_type: "residential".into(),
        land_lot_no: "台北市大安區XX段 456-7".into(),
        address: "台北市大安區XX路 99 號".into(),
        owner_name: Some("測試先生".into()),
        status: "draft".into(),
        created_at: 1_700_000_000,
        updated_at: 1_700_000_000,
        case_name: None,
        building_lot_no: None,
        asking_price: None,
        land_lots: vec!["台北市大安區XX段 456-7".into()],
    }
}

/// 完整案件生命週期：新增 → 列表 → 取得 → 更新
#[test]
fn test_full_case_lifecycle() {
    let (_dir, conn) = setup_db();
    let case = sample_case();

    // 1. 新增案件
    insert_case(&conn, &case).expect("insert_case 失敗");

    // 2. 列表應有 1 筆
    let all = list_cases(&conn).expect("list_cases 失敗");
    assert_eq!(all.len(), 1, "新增後應有 1 筆案件");

    // 3. 取得並驗證欄位
    let got = get_case(&conn, &case.id).expect("get_case 失敗");
    assert_eq!(got.property_type, "residential");
    assert_eq!(got.land_lot_no, "台北市大安區XX段 456-7");
    assert_eq!(got.address, "台北市大安區XX路 99 號");
    assert_eq!(got.owner_name.as_deref(), Some("測試先生"));
    assert_eq!(got.status, "draft");

    // 4. 更新 status 為 completed
    let mut updated = got.clone();
    updated.status = "completed".into();
    updated.updated_at = 1_700_000_100;
    update_case(&conn, &updated).expect("update_case 失敗");

    // 5. 確認更新成功
    let after = get_case(&conn, &case.id).expect("更新後 get_case 失敗");
    assert_eq!(after.status, "completed", "status 應已更新為 completed");
    assert_eq!(after.updated_at, 1_700_000_100, "updated_at 應已更新");
    // created_at 不應變動
    assert_eq!(after.created_at, case.created_at, "created_at 不應變動");
}

/// PDF 寫檔驗證：寫 dummy bytes 到 .tmp → rename → 確認存在且內容一致
#[test]
fn test_pdf_write_and_verify() {
    let dir = TempDir::new().expect("建立暫存目錄失敗");
    let output_path = dir.path().join("report.pdf");
    let tmp_path = output_path.with_extension("pdf.tmp");

    // 模擬 PDF bytes（%PDF- 開頭的 dummy 內容）
    let dummy_pdf: Vec<u8> = b"%PDF-1.4 dummy content for smoke test".to_vec();

    // 寫入 .tmp 檔
    std::fs::write(&tmp_path, &dummy_pdf).expect("寫入 .tmp 檔失敗");
    assert!(tmp_path.exists(), ".tmp 檔應存在");

    // rename 到最終路徑（模擬 export_pdf 的 atomic write 邏輯）
    std::fs::rename(&tmp_path, &output_path).expect("rename 失敗");

    // 驗證：.tmp 已不存在，最終檔案存在
    assert!(!tmp_path.exists(), "rename 後 .tmp 應已不存在");
    assert!(output_path.exists(), "最終 PDF 檔應存在");

    // 驗證檔案大小 > 0
    let meta = std::fs::metadata(&output_path).expect("讀取 metadata 失敗");
    assert!(meta.len() > 0, "PDF 檔案大小應 > 0");

    // 驗證內容一致
    let content = std::fs::read(&output_path).expect("讀取 PDF 檔失敗");
    assert_eq!(content, dummy_pdf, "PDF 內容應與寫入的一致");
}

/// Migration 009 驗證：floor_plan_sketches + floor_plan_conversions
#[test]
fn test_floor_plan_sketch_migration() {
    let (_dir, conn) = setup_db();

    // 確認 tables 存在
    let sketch_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM floor_plan_sketches", [], |r| r.get(0))
        .expect("floor_plan_sketches table 應存在");
    assert_eq!(sketch_count, 0, "空 table 應有 0 筆");

    let conv_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM floor_plan_conversions", [], |r| r.get(0))
        .expect("floor_plan_conversions table 應存在");
    assert_eq!(conv_count, 0, "空 table 應有 0 筆");

    // FK 預備：先建立一筆 cases 記錄
    let case = sample_case();
    insert_case(&conn, &case).expect("預備 case 插入應成功");
    let case_id = &case.id;

    // 確認 version unique constraint：同 case_id + version 不可重複
    let ts = "2025-01-01T00:00:00+08:00";
    conn.execute(
        "INSERT INTO floor_plan_sketches (id, case_id, original_asset_id, original_sha256, version, uploaded_at, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6, ?6)",
        rusqlite::params!["s1", case_id, "asset1", "abc123", 1, ts],
    ).expect("第一筆插入應成功");

    let result = conn.execute(
        "INSERT INTO floor_plan_sketches (id, case_id, original_asset_id, original_sha256, version, uploaded_at, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6, ?6)",
        rusqlite::params!["s2", case_id, "asset2", "def456", 1, ts],
    );
    assert!(result.is_err(), "同 case_id + version 重複插入應失敗（unique constraint）");
}

/// 安全驗證：history payload 不含 API key
#[test]
fn test_api_key_not_in_history_payload() {
    // 1. Set a fake API key in environment (or just use a known string)
    let fake_api_key = "sk-FAKE_TEST_KEY_SHOULD_NOT_APPEAR_IN_OUTPUT";

    let env_key = "OPENAI_API_KEY";
    let prev_api_key = std::env::var(env_key).ok();
    std::env::set_var(env_key, fake_api_key);

    // 2. Setup DB
    let (_dir, conn) = setup_db();
    let case = sample_case();
    insert_case(&conn, &case).expect("insert case");

    // 3. Insert a FloorPlanSketch manually
    use aire_lib::db::floor_plan_sketches::{
        current_taipei_ts, insert_conversion, insert_sketch, list_floor_plan_history,
        FloorPlanConversion, FloorPlanSketch,
    };
    let ts = current_taipei_ts();
    let sketch = FloorPlanSketch {
        id: "sketch-001".to_string(),
        case_id: case.id.clone(),
        original_asset_id: "asset-001".to_string(),
        original_sha256: "abc123".to_string(),
        source_type: "field_sketch".to_string(),
        version: 1,
        upload_note: None,
        uploaded_by: None,
        uploaded_at: ts.clone(),
        created_at: ts.clone(),
        updated_at: ts.clone(),
    };
    insert_sketch(&conn, &sketch).expect("insert sketch");

    // 4. Insert a FloorPlanConversion with known model audit fields
    let conv = FloorPlanConversion {
        id: "conv-001".to_string(),
        sketch_id: "sketch-001".to_string(),
        case_id: case.id.clone(),
        status: "draft".to_string(),
        extracted_json: "{}".to_string(),
        manual_edits_json: "{}".to_string(),
        uncertainty_json: "[]".to_string(),
        renderer_version: None,
        rendered_asset_id: None,
        approval_checklist_json: "{}".to_string(),
        approved_by: None,
        approved_at: None,
        model_provider: Some("openai".to_string()),
        model_id: Some("gpt-4o".to_string()),
        prompt_template_version: None,
        response_fingerprint: None,
        created_at: ts.clone(),
        updated_at: ts.clone(),
    };
    insert_conversion(&conn, &conv).expect("insert conversion");

    // 5. Fetch history
    let history = list_floor_plan_history(&conn, &case.id).expect("list history");

    // 6. Serialize to JSON and verify no API key
    let history_json = serde_json::to_string(&history).expect("serialize history");
    assert!(
        !history_json.contains(fake_api_key),
        "history payload must NOT contain API key"
    );

    // 7. Verify audit fields ARE present
    assert_eq!(history.conversions[0].model_provider.as_deref(), Some("openai"));
    assert_eq!(history.conversions[0].model_id.as_deref(), Some("gpt-4o"));

    match prev_api_key {
        Some(v) => std::env::set_var(env_key, v),
        None => std::env::remove_var(env_key),
    }
}
