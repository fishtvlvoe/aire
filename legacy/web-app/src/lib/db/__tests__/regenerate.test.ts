import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

let db: typeof import('../index').db;
let createListing: typeof import('../index').createListing;
let getListing: typeof import('../index').getListing;
let updateDocuments: typeof import('../index').updateDocuments;

describe('Regenerate single document', () => {
  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    const mod = await import('../index');
    db = mod.db;
    createListing = mod.createListing;
    getListing = mod.getListing;
    updateDocuments = mod.updateDocuments;
  });

  beforeEach(() => {
    db.exec('DELETE FROM listings;');
  });

  it('should only update listing_591 and keep disclosure_document unchanged', () => {
    const initialDocuments = {
      listing_591: '初始 listing_591',
      disclosure_document: '原始 disclosure_document',
    };
    const listing = createListing('residential-land');
    db.prepare('UPDATE listings SET status = ?, generated_documents = ? WHERE id = ?')
      .run('documents-ready', JSON.stringify(initialDocuments), listing.id);

    const merged = { ...initialDocuments, listing_591: '新 listing_591' };
    updateDocuments(listing.id, merged);

    const updated = getListing(listing.id);
    const docs = JSON.parse(updated?.generated_documents ?? '{}');
    expect(docs.listing_591).toBe('新 listing_591');
    expect(docs.disclosure_document).toBe('原始 disclosure_document');
  });
});
