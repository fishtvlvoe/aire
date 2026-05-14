use std::sync::{atomic::{AtomicU64, Ordering}, Arc};

#[derive(Clone, Debug)]
pub struct DiskGuard {
    available_bytes: Arc<AtomicU64>,
}

impl DiskGuard {
    pub fn simulate_full_disk() -> Self {
        Self {
            available_bytes: Arc::new(AtomicU64::new(0)),
        }
    }

    pub fn unrestricted() -> Self {
        Self {
            available_bytes: Arc::new(AtomicU64::new(u64::MAX)),
        }
    }

    pub fn available_bytes(&self) -> u64 {
        self.available_bytes.load(Ordering::SeqCst)
    }

    pub fn simulate_space_freed(&mut self, available_bytes: u64) {
        self.available_bytes.store(available_bytes, Ordering::SeqCst);
    }
}

#[cfg(all(test, feature = "phase2-red-tests"))]
pub mod tests;
