import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { PROPERTY_TYPES, type PropertyType } from '../property-types';
import { initDb } from './schema';

const DB_PATH = process.env.DATABASE_PATH || process.env.DB_PATH || './data/listings.db';
const dbDir = path.dirname(DB_PATH);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Run schema on initialization
initDb(db);

// Enable WAL mode for better concurrent read performance
// (WAL is not supported for in-memory DBs used in tests)
if (DB_PATH !== ':memory:') {
  db.pragma('journal_mode = WAL');
}

export { db };
export { PROPERTY_TYPES } from '../property-types';

export type { PropertyType };
export type ListingStatus = 'pre-commission' | 'draft' | 'field-visit-complete' | 'ready-for-generation' | 'documents-ready';
export type FieldVisitStatus = 'draft' | 'field-visit-incomplete' | 'field-visit-complete';

export interface Listing {
  id: number;
  property_type: PropertyType;
  field_visit_status: FieldVisitStatus;
  status: ListingStatus;
  field_visit_data: string | null;
  supplementary_data: string | null;
  generated_documents: string | null;
  pre_commission_data: string | null;
  created_at: string;
  updated_at: string;
}

export interface PreCommissionData {
  owner_name: string;
  owner_phone: string;
  parcel_number: string;
  [key: string]: unknown;
}

export function getListing(id: number): Listing | undefined {
  return db.prepare('SELECT * FROM listings WHERE id = ?').get(id) as Listing | undefined;
}

export function getAllListings(): Listing[] {
  return db.prepare('SELECT * FROM listings ORDER BY created_at DESC').all() as Listing[];
}

export function createListing(propertyType: string, initialStatus: ListingStatus = 'draft'): Listing {
  const propertyInfo = Object.prototype.hasOwnProperty.call(PROPERTY_TYPES, propertyType)
    ? PROPERTY_TYPES[propertyType as PropertyType]
    : undefined;

  if (!propertyInfo) {
    throw new Error('invalid-property-type');
  }

  if (!propertyInfo.available) {
    throw new Error('type-not-available');
  }

  const result = db
    .prepare(
      'INSERT INTO listings (propertyType, property_type, status, field_visit_status) VALUES (?, ?, ?, ?) RETURNING *'
    )
    .get(propertyType, propertyType, initialStatus, 'draft') as Listing;
  return result;
}

export interface CreatePreCommissionInput {
  address?: string;
  property_type: string;
  owner_name: string;
  owner_phone: string;
  parcel_number: string;
}

export function createPreCommissionListing(data: CreatePreCommissionInput): Listing {
  const propertyInfo = Object.prototype.hasOwnProperty.call(PROPERTY_TYPES, data.property_type)
    ? PROPERTY_TYPES[data.property_type as PropertyType]
    : undefined;

  if (!propertyInfo) {
    throw new Error('invalid-property-type');
  }

  const preCommissionData: PreCommissionData = {
    owner_name: data.owner_name,
    owner_phone: data.owner_phone,
    parcel_number: data.parcel_number,
  };

  const result = db
    .prepare(
      `INSERT INTO listings (propertyType, property_type, status, field_visit_status, pre_commission_data)
       VALUES (?, ?, 'pre-commission', 'draft', ?) RETURNING *`
    )
    .get(
      data.property_type,
      data.property_type,
      JSON.stringify(preCommissionData)
    ) as Listing;
  return result;
}

export function advanceToFieldVisit(id: number): void {
  const listing = getListing(id);
  if (!listing) {
    throw new Error('listing-not-found');
  }
  if (listing.status !== 'pre-commission') {
    throw { code: 'invalid-transition', current: listing.status, expected: 'pre-commission' };
  }
  db.prepare("UPDATE listings SET status = 'field-visit-complete', field_visit_status = 'field-visit-complete' WHERE id = ?").run(id);
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
