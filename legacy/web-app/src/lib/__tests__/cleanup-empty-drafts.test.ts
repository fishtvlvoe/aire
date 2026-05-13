import Database from 'better-sqlite3'
import { describe, expect, it, vi } from 'vitest'

import { initDb } from '@/lib/db/schema'
import { cleanupEmptyDrafts } from '../../../scripts/cleanup-empty-drafts'

describe('cleanupEmptyDrafts', () => {
  it('deletes 2 empty drafts, logs, and is idempotent', () => {
    const db = new Database(':memory:')
    initDb(db)

    db.prepare(
      `INSERT INTO listings (id, propertyType, status, field_visit_data)
       VALUES (?, ?, ?, ?)`
    ).run(1, 'apartment', 'draft', '{}')

    db.prepare(
      `INSERT INTO listings (id, propertyType, status, field_visit_data)
       VALUES (?, ?, ?, ?)`
    ).run(2, 'apartment', 'draft', '{"address":"台南"}')

    db.prepare(
      `INSERT INTO listings (id, propertyType, status, field_visit_data)
       VALUES (?, ?, ?, ?)`
    ).run(3, 'apartment', 'documents-ready', null)

    db.prepare(
      `INSERT INTO listings (id, propertyType, status, field_visit_data)
       VALUES (?, ?, ?, ?)`
    ).run(4, 'apartment', 'documents-ready', '{"address":"台北"}')

    db.prepare(
      `INSERT INTO listings (id, propertyType, status, field_visit_data)
       VALUES (?, ?, ?, ?)`
    ).run(5, 'apartment', 'draft', '')

    const logger = vi.fn<(msg: string) => void>()

    const deleted1 = cleanupEmptyDrafts(db, logger)
    expect(deleted1).toBe(2)
    expect(logger).toHaveBeenCalledWith('found 2 empty drafts, deleting...')

    const remaining = db.prepare('SELECT COUNT(*) as count FROM listings').get() as { count: number }
    expect(remaining.count).toBe(3)

    logger.mockClear()
    const deleted2 = cleanupEmptyDrafts(db, logger)
    expect(deleted2).toBe(0)
    expect(logger).toHaveBeenCalledWith('nothing to delete')

    db.close()
  })
})
