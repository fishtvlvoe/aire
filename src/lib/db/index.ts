import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.DB_PATH || './data/listings.db';
const dbDir = path.dirname(DB_PATH);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Run schema on initialization
const schema = fs.readFileSync(
  path.join(process.cwd(), 'src/lib/db/schema.sql'),
  'utf-8'
);
db.exec(schema);

// Enable WAL mode for better concurrent read performance
// (WAL is not supported for in-memory DBs used in tests)
if (DB_PATH !== ':memory:') {
  db.pragma('journal_mode = WAL');
}

export { db };

export type PropertyType = 'residential' | 'farmland';
export type ListingStatus = 'draft' | 'field-visit-complete' | 'ready-for-generation' | 'documents-ready';
export type FieldVisitStatus = 'draft' | 'field-visit-incomplete' | 'field-visit-complete';

export interface Listing {
  id: number;
  property_type: PropertyType;
  field_visit_status: FieldVisitStatus;
  status: ListingStatus;
  field_visit_data: string | null;
  supplementary_data: string | null;
  generated_documents: string | null;
  created_at: string;
  updated_at: string;
}

export function getListing(id: number): Listing | undefined {
  return db.prepare('SELECT * FROM listings WHERE id = ?').get(id) as Listing | undefined;
}

export function getAllListings(): Listing[] {
  return db.prepare('SELECT * FROM listings ORDER BY created_at DESC').all() as Listing[];
}

export function createListing(propertyType: PropertyType): Listing {
  const result = db
    .prepare('INSERT INTO listings (property_type) VALUES (?) RETURNING *')
    .get(propertyType) as Listing;
  return result;
}

export function updateListingFieldVisit(
  id: number,
  data: Record<string, unknown>,
  status: FieldVisitStatus
): void {
  db.prepare(
    'UPDATE listings SET field_visit_data = ?, field_visit_status = ?, status = ? WHERE id = ?'
  ).run(JSON.stringify(data), status, status === 'field-visit-complete' ? 'field-visit-complete' : 'draft', id);
}

export function updateSupplementaryData(
  id: number,
  data: Record<string, unknown>
): void {
  db.prepare(
    'UPDATE listings SET supplementary_data = ?, status = ? WHERE id = ?'
  ).run(JSON.stringify(data), 'ready-for-generation', id);
}

export function updateDocuments(
  id: number,
  docs: Record<string, unknown>
): void {
  db.prepare(
    'UPDATE listings SET generated_documents = ?, status = ? WHERE id = ?'
  ).run(JSON.stringify(docs), 'documents-ready', id);
}

export function updateStatus(id: number, status: ListingStatus): void {
  db.prepare('UPDATE listings SET status = ? WHERE id = ?').run(status, id);
}
