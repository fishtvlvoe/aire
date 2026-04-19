// 一次性清理腳本：刪除 DB 中純空 draft listings
// 使用：npx tsx scripts/cleanup-empty-drafts.ts
// 執行前請務必備份：cp data/listings.db data/listings.db.bak.$(date +%Y%m%d)

import type Database from 'better-sqlite3'
import BetterSqlite3 from 'better-sqlite3'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DB_PATH = path.join(process.cwd(), 'data/listings.db')

export function cleanupEmptyDrafts(
  db: Database.Database,
  logger: (msg: string) => void = console.log
): number {
  const whereClause =
    "status = 'draft' AND (field_visit_data IS NULL OR field_visit_data = '' OR field_visit_data = '{}')"

  const countRow = db
    .prepare(`SELECT COUNT(*) as count FROM listings WHERE ${whereClause}`)
    .get() as { count: number }

  if (countRow.count === 0) {
    logger('nothing to delete')
    return 0
  }

  logger(`found ${countRow.count} empty drafts, deleting...`)

  const result = db.prepare(`DELETE FROM listings WHERE ${whereClause}`).run()
  const remaining = db.prepare('SELECT COUNT(*) as count FROM listings').get() as { count: number }
  logger(`deleted ${result.changes}, remaining listings: ${remaining.count}`)

  return result.changes
}

function main() {
  console.log('⚠️  執行前請確認已備份：cp data/listings.db data/listings.db.bak.$(date +%Y%m%d)')
  const db = new BetterSqlite3(DB_PATH)
  try {
    cleanupEmptyDrafts(db, console.log)
  } finally {
    db.close()
  }
}

// Avoid side effects when imported from tests.
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main()
}
