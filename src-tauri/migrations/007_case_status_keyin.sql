-- Migration 007: 新增 keyin 案件狀態
-- SQLite 不支援 ALTER TABLE 修改 CHECK constraint，需 recreate 整張表
CREATE TABLE cases_new (
  id TEXT PRIMARY KEY,
  case_no TEXT,
  property_type TEXT NOT NULL,
  land_lot_no TEXT NOT NULL,
  address TEXT NOT NULL,
  owner_name TEXT,
  status TEXT NOT NULL CHECK(status IN ('draft','keyin','completed','exported')) DEFAULT 'draft',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  case_name TEXT,
  building_lot_no TEXT,
  asking_price INTEGER
);
INSERT INTO cases_new (id, case_no, property_type, land_lot_no, address, owner_name, status,
  created_at, updated_at, case_name, building_lot_no, asking_price)
SELECT id, case_no, property_type, land_lot_no, address, owner_name, status,
  created_at, updated_at, case_name, building_lot_no, asking_price
FROM cases;
DROP TABLE cases;
ALTER TABLE cases_new RENAME TO cases;
