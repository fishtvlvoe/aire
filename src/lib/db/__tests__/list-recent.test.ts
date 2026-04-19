import Database from 'better-sqlite3'
import { describe, expect, it } from 'vitest'

import { initDb } from '../schema'
import { executeListRecentListings } from '../list-recent-helper'

describe('executeListRecentListings', () => {
  it('excludes empty drafts but keeps non-empty drafts and non-drafts', () => {
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

    const rows = executeListRecentListings<{ id: number }>(db, 10)
    const ids = rows.map((r) => r.id)

    expect(rows).toHaveLength(3)
    expect(ids).toEqual(expect.arrayContaining([2, 3, 4]))
    expect(ids).not.toEqual(expect.arrayContaining([1, 5]))

    db.close()
  })
})
