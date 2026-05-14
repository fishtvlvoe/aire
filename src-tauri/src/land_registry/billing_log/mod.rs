#[derive(Debug, Clone)]
pub struct BillingLogEntry {
    parcel_id: String,
    api_id: String,
    cost: f64,
    transaction_id: String,
}

impl BillingLogEntry {
    pub fn new(parcel_id: impl Into<String>, api_id: &str, cost: f64, transaction_id: impl Into<String>) -> Self {
        Self {
            parcel_id: parcel_id.into(),
            api_id: api_id.to_string(),
            cost,
            transaction_id: transaction_id.into(),
        }
    }

    pub fn api_id(&self) -> &str {
        &self.api_id
    }
}

#[cfg(all(test, feature = "phase2-red-tests"))]
pub mod tests;
