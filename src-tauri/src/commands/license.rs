// AIRE — License IPC commands（Task 4.2 / 4.3）
//
// 依據：openspec/changes/aire-desktop-phase1/design.md D3
// capability: license-activation

use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::db::{oplog, settings};
use crate::opcos;
use crate::secrets;
use crate::{DbState, KeyringState};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LicenseStatus {
    /// 'not_activated' | 'active' | 'revoked' | 'grace' | 'expired'
    pub status: String,
    pub device_id: String,
    pub verified_at: Option<i64>,
    pub valid_until: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ActivationError {
    pub code: String,
    pub message: String,
}

impl ActivationError {
    fn new(code: &str, message: impl Into<String>) -> Self {
        Self {
            code: code.to_string(),
            message: message.into(),
        }
    }
}

impl std::fmt::Display for ActivationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "[{}] {}", self.code, self.message)
    }
}

// ----------------------------------------------------------------------------
// device_id 與 license_status helpers（內部 + 對 startup 暴露）
// ----------------------------------------------------------------------------

/// 首次啟動產 UUID v4 存 settings.device_id；後續啟動讀回。
pub fn ensure_device_id(conn: &Connection) -> Result<String, String> {
    if let Some(existing) = settings::get_setting(conn, "device_id").map_err(|e| e.to_string())? {
        return Ok(existing);
    }
    let id = uuid::Uuid::new_v4().to_string();
    settings::set_setting(conn, "device_id", &id).map_err(|e| e.to_string())?;
    Ok(id)
}

pub fn read_device_id(conn: &Connection) -> Result<String, String> {
    settings::get_setting(conn, "device_id")
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "device_id not initialized".to_string())
}

pub fn read_status(conn: &Connection) -> LicenseStatus {
    let status = settings::get_setting(conn, "license_status")
        .ok()
        .flatten()
        .unwrap_or_else(|| "not_activated".to_string());
    let device_id = settings::get_setting(conn, "device_id")
        .ok()
        .flatten()
        .unwrap_or_default();
    let verified_at = settings::get_setting(conn, "license_verified_at")
        .ok()
        .flatten()
        .and_then(|s| s.parse::<i64>().ok());
    let valid_until = settings::get_setting(conn, "license_valid_until")
        .ok()
        .flatten();
    LicenseStatus {
        status,
        device_id,
        verified_at,
        valid_until,
    }
}

fn now_secs() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

fn os_version_string() -> String {
    let os = std::env::consts::OS;
    let arch = std::env::consts::ARCH;
    format!("{os} {arch}")
}

// ----------------------------------------------------------------------------
// IPC commands
// ----------------------------------------------------------------------------

#[tauri::command]
pub async fn activate_license(
    key: String,
    db: State<'_, DbState>,
    keyring: State<'_, KeyringState>,
) -> Result<LicenseStatus, ActivationError> {
    // 1. 取 device_id（已在啟動時建）
    let device_id = {
        let conn =
            db.0.lock()
                .map_err(|e| ActivationError::new("db_lock", format!("db lock poisoned: {e}")))?;
        read_device_id(&conn).map_err(|e| ActivationError::new("device_id_missing", e))?
    };

    // 2. 呼叫 OPCOS activate
    let device_name = os_version_string();
    let os_ver = os_version_string();
    let resp = opcos::activate_license(&key, &device_id, &device_name, &os_ver)
        .await
        .map_err(|e| match (e.status, e.code.as_str()) {
            (Some(409), _) => ActivationError::new(
                "ALREADY_ACTIVATED_OTHER_DEVICE",
                "此序號已綁定其他裝置，請聯絡客服解除原裝置綁定",
            ),
            (Some(422), "invalid_key") => {
                ActivationError::new("INVALID_KEY", "序號無效，請確認輸入是否正確")
            }
            (Some(422), "quota_exhausted") => {
                ActivationError::new("QUOTA_EXHAUSTED", "授權額度已用盡，請聯絡客服加購")
            }
            (Some(s), c) if s >= 500 => ActivationError::new(
                "OPCOS_UNAVAILABLE",
                format!("OPCOS 伺服器錯誤（{s} {c}），請稍後再試"),
            ),
            _ => ActivationError::new("NETWORK_FAILED", format!("無法連線 OPCOS：{e}")),
        })?;

    // 3. 寫 keychain — token 與 key 都進 keychain（D4）
    if let Err(e) = secrets::set_credential(keyring.0.as_ref(), "license_key", &key) {
        let conn = db.0.lock().ok();
        if let Some(c) = conn {
            let _ = oplog::insert_log(&c, "license_activate", Some(&e.code), "error");
        }
        return Err(ActivationError::new(
            "CREDENTIAL_STORE_UNAVAILABLE",
            format!("無法寫入系統憑證儲存區：{e}"),
        ));
    }
    if let Err(e) = secrets::set_credential(keyring.0.as_ref(), "license_token", &resp.token) {
        let conn = db.0.lock().ok();
        if let Some(c) = conn {
            let _ = oplog::insert_log(&c, "license_activate", Some(&e.code), "error");
        }
        // 回收 license_key（避免 keychain 半寫狀態）
        let _ = secrets::delete_credential(keyring.0.as_ref(), "license_key");
        return Err(ActivationError::new(
            "CREDENTIAL_STORE_UNAVAILABLE",
            format!("無法寫入系統憑證儲存區：{e}"),
        ));
    }

    // 4. 寫 settings（非敏感資料）
    let now = now_secs();
    {
        let conn =
            db.0.lock()
                .map_err(|e| ActivationError::new("db_lock", format!("db lock poisoned: {e}")))?;
        settings::set_setting(&conn, "license_status", "active")
            .map_err(|e| ActivationError::new("db_write", e.to_string()))?;
        settings::set_setting(&conn, "license_verified_at", &now.to_string())
            .map_err(|e| ActivationError::new("db_write", e.to_string()))?;
        if let Some(ref vu) = resp.valid_until {
            let _ = settings::set_setting(&conn, "license_valid_until", vu);
        }
        let _ = oplog::insert_log(&conn, "license_activate", None, "ok");
        Ok(read_status(&conn))
    }
}

#[tauri::command]
pub async fn verify_license(
    db: State<'_, DbState>,
    keyring: State<'_, KeyringState>,
) -> Result<LicenseStatus, ActivationError> {
    let (device_id, license_key) = {
        let conn =
            db.0.lock()
                .map_err(|e| ActivationError::new("db_lock", format!("db lock poisoned: {e}")))?;
        let did =
            read_device_id(&conn).map_err(|e| ActivationError::new("device_id_missing", e))?;
        let lk = secrets::get_credential(keyring.0.as_ref(), "license_key")
            .map_err(|e| ActivationError::new("CREDENTIAL_STORE_UNAVAILABLE", e.to_string()))?
            .ok_or_else(|| ActivationError::new("NOT_ACTIVATED", "尚未啟用，請先輸入序號"))?;
        (did, lk)
    };

    let res = opcos::verify_license(&license_key, &device_id).await;
    let conn =
        db.0.lock()
            .map_err(|e| ActivationError::new("db_lock", format!("db lock poisoned: {e}")))?;
    match res {
        Ok(_resp) => {
            let now = now_secs();
            let _ = settings::set_setting(&conn, "license_status", "active");
            let _ = settings::set_setting(&conn, "license_verified_at", &now.to_string());
            let _ = oplog::insert_log(&conn, "license_verify", None, "ok");
            Ok(read_status(&conn))
        }
        Err(e) => {
            // 401/403 → revoked；其他 → 維持原狀回 error
            if matches!(e.status, Some(401) | Some(403)) {
                let _ = settings::set_setting(&conn, "license_status", "revoked");
                let _ = oplog::insert_log(
                    &conn,
                    "license_verify",
                    Some(&format!("{{\"status\":{}}}", e.status.unwrap_or(0))),
                    "error",
                );
                Err(ActivationError::new(
                    "LICENSE_REVOKED",
                    "序號已被遠端撤銷或在其他裝置使用",
                ))
            } else {
                let _ = oplog::insert_log(&conn, "license_verify", Some(&e.code), "error");
                Err(ActivationError::new(
                    "NETWORK_FAILED",
                    format!("無法連線 OPCOS：{e}"),
                ))
            }
        }
    }
}

#[tauri::command]
pub async fn get_license_status(db: State<'_, DbState>) -> Result<LicenseStatus, ActivationError> {
    let conn =
        db.0.lock()
            .map_err(|e| ActivationError::new("db_lock", format!("db lock poisoned: {e}")))?;
    Ok(read_status(&conn))
}

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::tests::open_in_memory;

    #[test]
    fn device_id_is_stable_across_calls() {
        let conn = open_in_memory();
        let id1 = ensure_device_id(&conn).unwrap();
        let id2 = ensure_device_id(&conn).unwrap();
        assert_eq!(id1, id2);
        // 確認是 UUID v4 格式（36 字長度，含 4 個 dash）
        assert_eq!(id1.len(), 36);
        assert_eq!(id1.matches('-').count(), 4);
    }

    #[test]
    fn read_status_defaults_to_not_activated() {
        let conn = open_in_memory();
        let s = read_status(&conn);
        assert_eq!(s.status, "not_activated");
    }
}
