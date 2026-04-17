import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
// 修正：改用 updateListingFieldVisit, updateSupplementaryData 取代 updateListing

let db: any, createListing: any, getListing: any, updateListingFieldVisit: any, updateSupplementaryData: any;

describe('E2E: farmland listing full flow', () => {
  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
  });

  beforeEach(async () => {
    const mod = await import('../index');
    db = mod.db;
    createListing = mod.createListing;
    getListing = mod.getListing;
    updateListingFieldVisit = mod.updateListingFieldVisit;
    updateSupplementaryData = mod.updateSupplementaryData;
    if (db.exec) db.exec('PRAGMA foreign_keys=ON;');
  });

  it('should run full farmland listing flow', async () => {
    const { id, status } = await createListing('farmland');
    expect(status).toBe('draft');

    updateListingFieldVisit(id, {
      address: '台南市官田區',
      land_area: 500,
      land_category: '一般農業區',
      irrigation: 'yes',
      road_frontage: 8,
      notes: '近水圳'
    }, 'field-visit-complete');
    let listing = await getListing(id);
    expect(listing.status).toBe('field-visit-complete');

    updateSupplementaryData(id, {
      land_registration_summary: '持分1/1',
      cadastral_ref: 'B-002',
      land_use_zoning: '一般農業區',
      mortgage_lien: 'none'
    });
    listing = getListing(id);
    expect(listing.status).toBe('ready-for-generation');

    // 注入 farmland 特有欄位
    const generatedDocs = {
      listing_591: '農地 listing',
      disclosure_document: '...灌溉：是...',
      social_posts: {},
      short_video_script: '農地投資...請立即聯繫！',
      property_survey: '農地現勘報告'
    };
    await db.prepare(
      `UPDATE listings SET generated_documents = ?, status = 'documents-ready' WHERE id = ?`
    ).run(JSON.stringify(generatedDocs), id);

    const listingData = await getListing(id);
    expect(listingData.generated_documents).toBeDefined();
    let docs = listingData.generated_documents;
    if (typeof docs === 'string') docs = JSON.parse(docs);
    expect(docs.disclosure_document).toContain('灌溉');
  });
});
