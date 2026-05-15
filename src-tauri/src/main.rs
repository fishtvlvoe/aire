// 主執行檔入口 — 在 Windows release build 隱藏 console window
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use aire_lib::encryption::KeychainState;
use aire_lib::land_registry::migration_rollback::MigrationManager;
use aire_lib::land_registry::opcos_offline_grace::OfflineGraceChecker;
use aire_lib::land_registry::time_sync::TimeSyncModule;

fn initialize_land_registry_foundation() -> Result<(), String> {
    // 1) keychain key
    let keychain = KeychainState::available();
    if !keychain.is_available() {
        return Err("keychain key unavailable".to_string());
    }

    // 2) encrypted DB layer
    // In the current foundation wiring, keychain availability gates the encryption layer.
    let _encryption_ready = keychain.clone();

    // 3) migration_rollback
    let migration = MigrationManager::new_in_memory();
    migration
        .run_migration_001()
        .map_err(|e| format!("migration_001 failed: {e}"))?;
    migration
        .run_migration_002()
        .map_err(|e| format!("migration_002 failed: {e}"))?;

    // 4) time_sync
    let time_sync = TimeSyncModule::new_in_memory_db();
    let _ = time_sync.sync_with_fallback();

    // 5) opcos_offline_grace
    let grace = OfflineGraceChecker::new_with_keychain(keychain);
    grace
        .check_grace_period()
        .map_err(|e| format!("opcos offline grace check failed: {e}"))?;

    Ok(())
}

fn main() {
    initialize_land_registry_foundation()
        .expect("failed to initialize land_registry foundation startup chain");
    aire_lib::run();
}
