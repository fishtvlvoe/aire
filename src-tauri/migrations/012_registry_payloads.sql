-- 012_registry_payloads.sql: persist pulled registry snapshots on the local device.

ALTER TABLE cases ADD COLUMN land_registry_data TEXT;
ALTER TABLE cases ADD COLUMN current_step INTEGER NOT NULL DEFAULT 1;
