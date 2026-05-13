// AIRE — 啟動序列決策（Task 4.4）
//
// 依據：openspec/changes/aire-desktop-phase1/design.md D3
//
// 決策樹（不真的去 await OPCOS，避免阻塞主執行緒）：
//   - license_status != 'active' → 跳啟用畫面（前端依 status 路由）
//   - 已啟用 且 距 last verify < 7 天 → 直接進主畫面（離線寬限）
//   - 7-30 天 → 標記 'needs_verify'，前端載入後觸發 verify_license IPC
//   - > 30 天 → 標記 'verify_required'，前端強制走 verify 才能進主畫面
//   - 'revoked' → 跳啟用畫面
//
// 所有路徑都寫 operation_log。

use rusqlite::Connection;

use crate::db::{oplog, settings};

/// 啟動決策結果（同時也是寫進 settings.license_runtime_state 的值）。
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StartupDecision {
    /// 未啟用或被撤銷 → 強制啟用畫面
    NeedActivation,
    /// 已啟用、< 7 天 → 直接進主畫面
    Active,
    /// 7-30 天 → 進主畫面但需重新 verify（背景觸發）
    NeedsVerify,
    /// > 30 天 → 阻擋主畫面直到 verify 成功
    VerifyRequired,
    /// 被遠端撤銷 → 跳啟用畫面
    Revoked,
}

impl StartupDecision {
    pub fn as_str(&self) -> &'static str {
        match self {
            StartupDecision::NeedActivation => "need_activation",
            StartupDecision::Active => "active",
            StartupDecision::NeedsVerify => "needs_verify",
            StartupDecision::VerifyRequired => "verify_required",
            StartupDecision::Revoked => "revoked",
        }
    }
}

const SEVEN_DAYS_SECS: i64 = 7 * 24 * 60 * 60;
const THIRTY_DAYS_SECS: i64 = 30 * 24 * 60 * 60;

fn now_secs() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

/// 核心決策邏輯（純函式，可單元測試）。
pub fn decide(status: Option<&str>, verified_at: Option<i64>, now: i64) -> StartupDecision {
    match status {
        Some("revoked") => StartupDecision::Revoked,
        Some("active") => {
            let elapsed = match verified_at {
                Some(v) => now.saturating_sub(v),
                None => return StartupDecision::VerifyRequired,
            };
            if elapsed < SEVEN_DAYS_SECS {
                StartupDecision::Active
            } else if elapsed < THIRTY_DAYS_SECS {
                StartupDecision::NeedsVerify
            } else {
                StartupDecision::VerifyRequired
            }
        }
        _ => StartupDecision::NeedActivation,
    }
}

/// 從 DB 讀狀態 → 套用決策 → 寫 operation_log + settings.license_runtime_state。
pub fn run_startup_decision(conn: &Connection) -> StartupDecision {
    let status = settings::get_setting(conn, "license_status")
        .ok()
        .flatten();
    let verified_at = settings::get_setting(conn, "license_verified_at")
        .ok()
        .flatten()
        .and_then(|s| s.parse::<i64>().ok());

    let decision = decide(status.as_deref(), verified_at, now_secs());

    // 寫 operation log（每次啟動都寫一筆）
    let payload = format!(
        "{{\"status\":\"{}\",\"verified_at\":{}}}",
        status.as_deref().unwrap_or(""),
        verified_at.map(|v| v.to_string()).unwrap_or_else(|| "null".to_string())
    );
    let _ = oplog::insert_log(conn, "startup_decision", Some(&payload), "ok");

    // 把 runtime state 寫進 settings（非敏感）— 前端可直接讀來決定首頁
    let _ = settings::set_setting(conn, "license_runtime_state", decision.as_str());

    decision
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn no_status_returns_need_activation() {
        assert_eq!(decide(None, None, 1_000_000), StartupDecision::NeedActivation);
    }

    #[test]
    fn active_within_seven_days_returns_active() {
        let now = 10_000_000;
        let v = now - SEVEN_DAYS_SECS + 60; // 6 天 23 分前
        assert_eq!(decide(Some("active"), Some(v), now), StartupDecision::Active);
    }

    #[test]
    fn active_between_seven_and_thirty_days_returns_needs_verify() {
        let now = 10_000_000;
        let v = now - (SEVEN_DAYS_SECS + 60);
        assert_eq!(decide(Some("active"), Some(v), now), StartupDecision::NeedsVerify);
    }

    #[test]
    fn active_over_thirty_days_returns_verify_required() {
        let now = 10_000_000;
        let v = now - (THIRTY_DAYS_SECS + 60);
        assert_eq!(decide(Some("active"), Some(v), now), StartupDecision::VerifyRequired);
    }

    #[test]
    fn revoked_returns_revoked() {
        assert_eq!(
            decide(Some("revoked"), Some(1_000_000), 2_000_000),
            StartupDecision::Revoked
        );
    }
}
