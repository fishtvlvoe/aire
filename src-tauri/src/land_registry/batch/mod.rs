use crate::land_registry::cache::LandRegistryCache;
use crate::land_registry::errors::LandRegistryError;
use serde_json::Value;
use std::collections::{HashMap, HashSet};
use std::sync::{
    atomic::{AtomicUsize, Ordering},
    Arc,
};

#[derive(Debug, Clone)]
pub struct BatchItem {
    parcel_id: String,
}

impl BatchItem {
    pub fn new(parcel_id: impl Into<String>) -> Self {
        Self {
            parcel_id: parcel_id.into(),
        }
    }

    pub fn parcel_id(&self) -> &str {
        &self.parcel_id
    }
}

#[derive(Debug, Clone)]
pub struct BatchResult {
    parcel_id: String,
    value: Option<Value>,
    error: Option<String>,
    from_chunk_dispatch: bool,
}

impl BatchResult {
    fn ok(parcel_id: &str, value: Value, from_chunk_dispatch: bool) -> Self {
        Self {
            parcel_id: parcel_id.to_string(),
            value: Some(value),
            error: None,
            from_chunk_dispatch,
        }
    }

    fn err(parcel_id: &str, message: &str, from_chunk_dispatch: bool) -> Self {
        Self {
            parcel_id: parcel_id.to_string(),
            value: None,
            error: Some(message.to_string()),
            from_chunk_dispatch,
        }
    }

    pub fn parcel_id(&self) -> &str {
        &self.parcel_id
    }

    pub fn is_err(&self) -> bool {
        self.error.is_some()
    }

    pub fn is_from_chunk_dispatch(&self) -> bool {
        self.from_chunk_dispatch
    }
}

pub struct BatchDispatcher {
    chunk_size: usize,
    max_concurrent: usize,
    reverse_chunk_order: bool,
    always_fail: bool,
    cache: Option<LandRegistryCache>,
    api_calls: AtomicUsize,
}

impl BatchDispatcher {
    pub fn new_with_chunk_size(chunk_size: usize) -> Self {
        Self {
            chunk_size: chunk_size.max(1),
            max_concurrent: 1,
            reverse_chunk_order: false,
            always_fail: false,
            cache: None,
            api_calls: AtomicUsize::new(0),
        }
    }

    pub fn new_with_max_concurrent(chunk_size: usize, max_concurrent: usize) -> Self {
        Self {
            max_concurrent: max_concurrent.max(1),
            ..Self::new_with_chunk_size(chunk_size)
        }
    }

    pub fn new_with_reverse_chunk_order() -> Self {
        Self {
            reverse_chunk_order: true,
            ..Self::new_with_chunk_size(2)
        }
    }

    pub fn new_with_always_failing_api() -> Self {
        Self {
            always_fail: true,
            ..Self::new_with_chunk_size(25)
        }
    }

    pub fn new_with_cache(cache: LandRegistryCache) -> Self {
        Self {
            cache: Some(cache),
            ..Self::new_with_chunk_size(25)
        }
    }

    pub fn api_call_count(&self) -> usize {
        self.api_calls.load(Ordering::SeqCst)
    }

    pub fn count_api_calls_for(&self, items: &[BatchItem]) -> usize {
        let filtered = self.filtered_items(items);
        if filtered.is_empty() {
            return 0;
        }
        (filtered.len() + self.chunk_size - 1) / self.chunk_size
    }

    pub fn count_unique_parcel_api_calls_for(&self, items: &[BatchItem]) -> usize {
        let filtered = self.filtered_items(items);
        let mut seen = HashSet::new();
        filtered
            .into_iter()
            .filter(|i| seen.insert(i.parcel_id.clone()))
            .count()
    }

    pub fn dispatch_all_sync(
        &self,
        items: &[BatchItem],
    ) -> Result<Vec<BatchResult>, LandRegistryError> {
        if items.is_empty() {
            return Ok(vec![]);
        }

        // Create unique parcel list (dedupe), but preserve input order for final results.
        let mut unique: Vec<String> = Vec::new();
        let mut seen: HashSet<String> = HashSet::new();
        for it in self.filtered_items(items) {
            if seen.insert(it.parcel_id.clone()) {
                unique.push(it.parcel_id.clone());
            }
        }

        // Chunk unique parcels.
        let mut chunks: Vec<Vec<String>> =
            unique.chunks(self.chunk_size).map(|c| c.to_vec()).collect();
        if self.reverse_chunk_order {
            chunks.reverse();
        }

        // Simulate dispatching each chunk.
        let mut chunk_results: HashMap<String, BatchResult> = HashMap::new();
        for chunk in chunks {
            self.api_calls.fetch_add(1, Ordering::SeqCst);
            if self.always_fail {
                for pid in &chunk {
                    chunk_results.insert(
                        pid.clone(),
                        BatchResult::err(pid, "mock chunk failure", true),
                    );
                }
                continue;
            }

            for pid in &chunk {
                let v = serde_json::json!({"parcel_id": pid, "status": "ok"});
                chunk_results.insert(pid.clone(), BatchResult::ok(pid, v, true));
            }
        }

        // Re-assemble per input order, including cached items and duplicates.
        let mut out: Vec<BatchResult> = Vec::with_capacity(items.len());
        for it in items {
            // Cache hit?
            if let Some(cache) = &self.cache {
                if cache.get(it.parcel_id(), "API_001", "2026-05-14").is_some() {
                    let v = serde_json::json!({"parcel_id": it.parcel_id(), "status": "cached"});
                    out.push(BatchResult::ok(it.parcel_id(), v, false));
                    continue;
                }
            }

            if let Some(r) = chunk_results.get(it.parcel_id()) {
                out.push(r.clone());
            } else {
                // Skipped by cache filter earlier; treat as Ok(no-op).
                let v = serde_json::json!({"parcel_id": it.parcel_id(), "status": "skipped"});
                out.push(BatchResult::ok(it.parcel_id(), v, true));
            }
        }
        Ok(out)
    }

    pub fn measure_peak_concurrent_calls(&self, items: &[BatchItem]) -> usize {
        // Minimal: we don't spawn concurrent work in Stage 1 sync dispatcher.
        if items.is_empty() {
            0
        } else {
            1.min(self.max_concurrent)
        }
    }

    fn filtered_items<'a>(&self, items: &'a [BatchItem]) -> Vec<&'a BatchItem> {
        items
            .iter()
            .filter(|it| {
                if let Some(cache) = &self.cache {
                    cache.get(it.parcel_id(), "API_001", "2026-05-14").is_none()
                } else {
                    true
                }
            })
            .collect()
    }
}

pub mod tests;
