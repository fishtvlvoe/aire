use crate::commands::cases::IpcError;
use crate::land_registry::billing_log::{monthly_count, monthly_total, BillingLog, BillingLogEntry};
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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct BillingLineItem {
    pub service_name: String,
    pub target: String,
    pub status_label: String,
    pub transaction_id: String,
    pub cost: i64,
    pub charged_at: String,
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

fn service_name(api_id: &str) -> String {
    match api_id {
        "MOI_API_005" | "building_ownership" => "建物所有權資料",
        "MOI_API_037" | "address_building_lookup" => "門牌建號查詢",
        "MOI_API_009" | "co_owners" => "所有權人比對服務",
        "MOI_API_041" | "account_balance" => "帳務查詢",
        "building_registry" => "建物標示資料",
        "land_registry" => "土地標示資料",
        "land_value" => "土地公告現值",
        "mortgages" => "他項權利資料",
        "zoning" => "使用分區資料",
        other => other,
    }
    .to_string()
}

fn line_item(entry: BillingLogEntry) -> BillingLineItem {
    let rounded_cost = entry.cost().round() as i64;
    BillingLineItem {
        service_name: service_name(entry.api_id()),
        target: entry.parcel_id().to_string(),
        status_label: if rounded_cost > 0 {
            "查詢成功".to_string()
        } else if entry.api_id() == "account_balance" || entry.api_id() == "MOI_API_041" {
            "免費".to_string()
        } else {
            "查詢失敗".to_string()
        },
        transaction_id: entry.transaction_id().to_string(),
        cost: rounded_cost,
        charged_at: entry.timestamp().to_string(),
    }
}

pub fn get_billing_line_items(billing_log: &BillingLog) -> Vec<BillingLineItem> {
    billing_log.entries().into_iter().map(line_item).collect()
}

#[tauri::command]
pub async fn land_registry_get_balance(
    billing: State<'_, LandRegistryBillingState>,
) -> Result<BalanceInfo, IpcError> {
    Ok(get_balance_from_log(&billing.0))
}

#[tauri::command]
pub async fn land_registry_list_billing_entries(
    billing: State<'_, LandRegistryBillingState>,
) -> Result<Vec<BillingLineItem>, IpcError> {
    Ok(get_billing_line_items(&billing.0))
}

#[cfg(test)]
mod tests {
    use super::{get_balance_info, get_balance_info_with_limit, get_billing_line_items};
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

    #[test]
    fn exposes_billing_line_items_for_frontend() {
        let billing_log = BillingLog::new_in_memory();
        billing_log
            .record_call("0301-0001", "building_ownership", 27.0, "TXN-SUCCESS")
            .unwrap();
        billing_log
            .record_call("0301-0001", "address_building_lookup", 0.0, "TXN-FAIL")
            .unwrap();

        let rows = get_billing_line_items(&billing_log);

        assert_eq!(rows.len(), 2);
        assert_eq!(rows[0].service_name, "建物所有權資料");
        assert_eq!(rows[0].status_label, "查詢成功");
        assert_eq!(rows[0].cost, 27);
        assert_eq!(rows[1].service_name, "門牌建號查詢");
        assert_eq!(rows[1].cost, 0);
    }
}
