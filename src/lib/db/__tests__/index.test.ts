import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

let db: typeof import('../index').db;
let createListing: typeof import('../index').createListing;
let getListing: typeof import('../index').getListing;
let updateListingFieldVisit: typeof import('../index').updateListingFieldVisit;
let updateSupplementaryData: typeof import('../index').updateSupplementaryData;
let updateDocuments: typeof import('../index').updateDocuments;

describe('db listing status transitions', () => {
  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    const mod = await import('../index');
    db = mod.db;
    createListing = mod.createListing;
    getListing = mod.getListing;
    updateListingFieldVisit = mod.updateListingFieldVisit;
    updateSupplementaryData = mod.updateSupplementaryData;
    updateDocuments = mod.updateDocuments;
  });

  beforeEach(() => {
    db.exec('DELETE FROM listings;');
  });

  afterAll(() => {
    db.close();
  });

  it("createListing('residential') creates listing with status 'draft' and field_visit_status 'draft'", () => {
    const listing = createListing('residential');
    expect(listing.status).toBe('draft');
    expect(listing.field_visit_status).toBe('draft');

    const persisted = getListing(listing.id);
    expect(persisted).toBeTruthy();
    expect(persisted!.status).toBe('draft');
    expect(persisted!.field_visit_status).toBe('draft');
  });

  it("updateListingFieldVisit(..., 'field-visit-incomplete') sets field_visit_status to 'field-visit-incomplete'", () => {
    const listing = createListing('residential');

    updateListingFieldVisit(listing.id, { note: 'missing some items' }, 'field-visit-incomplete');

    const updated = getListing(listing.id)!;
    expect(updated.field_visit_status).toBe('field-visit-incomplete');
    expect(updated.status).toBe('draft');
  });

  it("updateListingFieldVisit(..., 'field-visit-complete') sets field_visit_status and status to 'field-visit-complete'", () => {
    const listing = createListing('residential');

    updateListingFieldVisit(listing.id, { done: true }, 'field-visit-complete');

    const updated = getListing(listing.id)!;
    expect(updated.field_visit_status).toBe('field-visit-complete');
    expect(updated.status).toBe('field-visit-complete');
  });

  it("updateSupplementaryData(...) sets status to 'ready-for-generation'", () => {
    const listing = createListing('residential');

    updateSupplementaryData(listing.id, { zoning: 'R1' });

    const updated = getListing(listing.id)!;
    expect(updated.status).toBe('ready-for-generation');
  });

  it("updateDocuments(...) sets status to 'documents-ready'", () => {
    const listing = createListing('residential');

    updateDocuments(listing.id, { pdf: 'base64...' });

    const updated = getListing(listing.id)!;
    expect(updated.status).toBe('documents-ready');
  });
});
