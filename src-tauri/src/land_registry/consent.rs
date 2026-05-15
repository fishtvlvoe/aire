use crate::commands::cases::IpcError;
use crate::land_registry::errors::LandRegistryError;
use crate::DbState;
use rusqlite::{params, Connection};
use tauri::State;

fn to_ipc_error(error: LandRegistryError) -> IpcError {
    let code = match error {
        LandRegistryError::ConsentRequired => "ConsentRequired",
        LandRegistryError::ApiKeyNotConfigured => "ApiKeyNotConfigured",
        LandRegistryError::InsufficientBalance { .. } => "InsufficientBalance",
        _ => "InternalError",
    };
    IpcError {
        code: code.to_string(),
        message: error.to_string(),
    }
}

fn ensure_consent_schema(conn: &Connection) -> Result<(), LandRegistryError> {
    conn.execute_batch(include_str!("../../migrations/005_owner_consent_log.sql"))
        .map_err(|error| LandRegistryError::MigrationFailed {
            message: format!("apply owner_consent_log migration failed: {error}"),
        })?;
    Ok(())
}

pub fn record_consent(
    conn: &Connection,
    case_id: &str,
    user_email: &str,
) -> Result<(), LandRegistryError> {
    ensure_consent_schema(conn)?;
    conn.execute(
        "INSERT INTO owner_consent_log (case_id, user_email) VALUES (?1, ?2)",
        params![case_id, user_email],
    )
    .map_err(|error| LandRegistryError::Internal {
        message: format!("insert consent log failed: {error}"),
    })?;
    Ok(())
}

pub fn check_consent(conn: &Connection, case_id: &str) -> Result<bool, LandRegistryError> {
    ensure_consent_schema(conn)?;
    conn.query_row(
        "SELECT EXISTS(SELECT 1 FROM owner_consent_log WHERE case_id = ?1 LIMIT 1)",
        [case_id],
        |row| row.get::<_, i64>(0),
    )
    .map(|exists| exists == 1)
    .map_err(|error| LandRegistryError::Internal {
        message: format!("query consent log failed: {error}"),
    })
}

fn current_user_email() -> String {
    if let Ok(email) = std::env::var("AIRE_USER_EMAIL") {
        let trimmed = email.trim();
        if !trimmed.is_empty() {
            return trimmed.to_string();
        }
    }

    let username = std::env::var("USER")
        .or_else(|_| std::env::var("USERNAME"))
        .unwrap_or_else(|_| "unknown".to_string());
    format!("{}@local", username)
}

#[tauri::command]
pub async fn land_registry_record_consent(
    case_id: String,
    db: State<'_, DbState>,
) -> Result<(), IpcError> {
    let user_email = current_user_email();
    let conn = db.0.lock().map_err(|error| IpcError {
        code: "db_lock".to_string(),
        message: format!("db lock poisoned: {error}"),
    })?;

    record_consent(&conn, &case_id, &user_email).map_err(to_ipc_error)
}

#[cfg(test)]
mod tests {
    use super::{check_consent, record_consent};
    use rusqlite::Connection;

    #[test]
    fn record_then_check_returns_true() {
        let conn = Connection::open_in_memory().unwrap();
        assert!(!check_consent(&conn, "case-001").unwrap());

        record_consent(&conn, "case-001", "agent@example.com").unwrap();
        assert!(check_consent(&conn, "case-001").unwrap());
    }

    #[test]
    fn check_without_record_returns_false() {
        let conn = Connection::open_in_memory().unwrap();
        assert!(!check_consent(&conn, "case-404").unwrap());
    }
}
