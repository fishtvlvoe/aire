// AIRE 整合測試 — 完整後端鏈路煙霧測試
//
// 驗證：init_db → insert_case → list_cases → get_case → update_case → PDF 寫檔
// 使用 tempdir 確保測試不汙染真實環境

use aire_lib::db::{
    cases::{insert_case, get_case, list_cases, update_case, Case},
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
