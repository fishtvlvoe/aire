use crate::commands::cases::IpcError;
use crate::land_registry::billing_log::{monthly_count, monthly_total, BillingLog};
use crate::LandRegistryBillingState;
use chrono::{Datelike, Local};
use serde::{Deserialize, Serialize};
use tauri::State;

const DEFAULT_MONTHLY_LIMIT: usize = 100;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct BalanceInfo {
    pub month_query_count: usize,
    pub month_total_cost: i64,
    pub low_balance_warning: bool,
}

pub fn get_balance_info(billing_log: &BillingLog) -> BalanceInfo {
    get_balance_info_with_limit(billing_log, DEFAULT_MONTHLY_LIMIT)
}

pub fn get_balance_info_with_limit(billing_log: &BillingLog, monthly_limit: usize) -> BalanceInfo {
    let now = Local::now();
    let month_prefix = format!("{:04}-{:02}", now.year(), now.month());

    let query_count = monthly_count(billing_log, &month_prefix);
    let total_cost = monthly_total(billing_log, &month_prefix).round() as i64;
    let remaining = monthly_limit.saturating_sub(query_count);

    BalanceInfo {
        month_query_count: query_count,
        month_total_cost: total_cost,
        low_balance_warning: remaining < 10,
    }
}

pub fn get_balance_from_log(billing_log: &BillingLog) -> BalanceInfo {
    get_balance_info(billing_log)
}

#[tauri::command]
pub async fn land_registry_get_balance(
    billing: State<'_, LandRegistryBillingState>,
) -> Result<BalanceInfo, IpcError> {
    Ok(get_balance_from_log(&billing.0))
}

#[cfg(test)]
mod tests {
    use super::{get_balance_info, get_balance_info_with_limit};
    use crate::land_registry::billing_log::BillingLog;

    #[test]
    fn aggregates_monthly_count_and_cost() {
        let billing_log = BillingLog::new_in_memory();
        for i in 0..5 {
            billing_log
                .record_call("0301-0001", "building_registry", 10.0, &format!("TXN-{i}"))
                .unwrap();
        }

        let balance = get_balance_info(&billing_log);
        assert_eq!(balance.month_query_count, 5);
        assert_eq!(balance.month_total_cost, 50);
        assert!(!balance.low_balance_warning);
    }

    #[test]
    fn sets_low_balance_warning_when_remaining_under_ten() {
        let billing_log = BillingLog::new_in_memory();
        for i in 0..95 {
            billing_log
                .record_call("0301-0001", "building_registry", 1.0, &format!("TXN-{i}"))
                .unwrap();
        }

        let balance = get_balance_info_with_limit(&billing_log, 100);
        assert_eq!(balance.month_query_count, 95);
        assert!(balance.low_balance_warning);
    }
}
