use std::collections::HashMap;

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub enum ConflictStrategy {
    Overwrite,
    KeepNewer,
    Skip,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ConflictItem {
    pub case_id: u64,
    pub existing_updated_at: i64,
    pub incoming_updated_at: i64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ConflictResolution {
    pub case_id: u64,
    pub use_incoming: bool,
}

#[derive(Debug, Copy, Clone, PartialEq, Eq)]
pub struct ApplyToAllState {
    pub strategy: ConflictStrategy,
}

#[derive(Debug, thiserror::Error)]
pub enum ConflictError {
    #[error("conflict resolution error: {0}")]
    Invalid(String),
}

pub fn resolve_single_conflict(
    item: &ConflictItem,
    strategy: ConflictStrategy,
) -> Result<ConflictResolution, ConflictError> {
    let use_incoming = match strategy {
        ConflictStrategy::Overwrite => true,
        ConflictStrategy::Skip => false,
        ConflictStrategy::KeepNewer => item.incoming_updated_at >= item.existing_updated_at,
    };

    Ok(ConflictResolution {
        case_id: item.case_id,
        use_incoming,
    })
}

pub fn apply_strategy_to_all(
    items: &[ConflictItem],
    strategy: ConflictStrategy,
) -> Result<Vec<ConflictResolution>, ConflictError> {
    items
        .iter()
        .map(|it| resolve_single_conflict(it, strategy))
        .collect()
}

pub struct ConflictResolver {
    per_case: HashMap<u64, ConflictStrategy>,
    apply_to_all: Option<ApplyToAllState>,
}

impl ConflictResolver {
    pub fn new() -> Self {
        Self {
            per_case: HashMap::new(),
            apply_to_all: None,
        }
    }

    pub fn decide(&mut self, case_id: u64, strategy: ConflictStrategy) {
        self.per_case.insert(case_id, strategy);
    }

    pub fn set_apply_to_all(&mut self, strategy: ConflictStrategy) {
        self.apply_to_all = Some(ApplyToAllState { strategy });
    }

    pub fn apply_to_all_state(&self) -> Option<ApplyToAllState> {
        self.apply_to_all
    }

    pub fn resolve(&self, item: &ConflictItem) -> Result<ConflictResolution, ConflictError> {
        if let Some(state) = self.apply_to_all {
            return resolve_single_conflict(item, state.strategy);
        }

        if let Some(strategy) = self.per_case.get(&item.case_id).copied() {
            return resolve_single_conflict(item, strategy);
        }

        // Default behavior if not decided: KeepNewer.
        resolve_single_conflict(item, ConflictStrategy::KeepNewer)
    }
}

// Pull in the existing Phase 2/3 contract tests.
#[cfg(test)]
include!("conflict/tests.rs");
