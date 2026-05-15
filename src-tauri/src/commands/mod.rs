// Tauri IPC commands
//
// 每個子模組對應一組 capability：
// - cases：案件 CRUD（Group 5）
// - license：序號啟用與驗證（Group 4）
// - drafts：草稿 autosave / reload（Group 6.3 / 6.4 / 7.2）
// - pdf：PDF 匯出（Group 8.4）
// - log：operation_log 查詢（Group 9.2）

pub mod cases;
pub mod drafts;
pub mod license;
pub mod log;
pub mod pdf;
pub mod real_price;
