import type Database from 'better-sqlite3'

/**
 * Shared query logic for listRecentListings.
 * Useful for tests to run against an injected db instance.
 */
const BASE_FILTER = `NOT (
  status = 'draft'
  AND (
    field_visit_data IS NULL
    OR field_visit_data = ''
    OR field_visit_data = '{}'
  )
  AND datetime(created_at) < datetime('now', '-24 hours')
)`;

export function executeListRecentListings<T = unknown>(db: Database.Database, limit: number = 10, ownerId?: number): T[] {
  if (ownerId !== undefined) {
    return db
      .prepare(`SELECT * FROM listings WHERE ${BASE_FILTER} AND owner_id = ? ORDER BY updated_at DESC LIMIT ?`)
      .all(ownerId, limit) as T[];
  }
  return db
    .prepare(`SELECT * FROM listings WHERE ${BASE_FILTER} ORDER BY updated_at DESC LIMIT ?`)
    .all(limit) as T[];
}
