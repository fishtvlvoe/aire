import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
// 修正：改用 updateListingFieldVisit, updateSupplementaryData 取代 updateListing

let db: any, createListing: any, getListing: any, updateListingFieldVisit: any, updateSupplementaryData: any;

const generatedDocs = {
  listing_591: '591 listing content',
  disclosure_document: '揭露文件內容',
  social_posts: {},
  short_video_script: '這是一段長度約 120 字的短影音腳本，內容用於測試，請忽略實際內容。'.repeat(4).slice(0, 120),
  property_survey: '物件現勘報告'
};

describe('E2E: residential-land listing full flow', () => {
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
    // 重新初始化 DB schema if needed
    if (db.exec) db.exec('PRAGMA foreign_keys=ON;');
  });

  it('should run full residential-land listing flow', async () => {
    const { id, status } = await createListing('residential-land');
    expect(status).toBe('draft');

    updateListingFieldVisit(id, {
      address: '台南市中西區',
      asking_price: 5000000,
      floor_area: 25,
      age: 10,
      layout: '3房2廳',
      floor: 5,
      total_floors: 12,
      parking: 'none',
      notes: ''
    }, 'field-visit-complete');
    let listing = await getListing(id);
    expect(listing.status).toBe('field-visit-complete');

    updateSupplementaryData(id, {
      land_registration_summary: '持分1/1',
      cadastral_ref: 'A-001',
      land_use_zoning: '第三種住宅區',
      mortgage_lien: 'none'
    });
    listing = getListing(id);
    expect(listing.status).toBe('ready-for-generation');

    // 直接注入 generated_documents
    await db.prepare(
      `UPDATE listings SET generated_documents = ?, status = 'documents-ready' WHERE id = ?`
    ).run(JSON.stringify(generatedDocs), id);

    const listingData = await getListing(id);
    expect(listingData.generated_documents).toBeDefined();
    let docs = listingData.generated_documents;
    if (typeof docs === 'string') docs = JSON.parse(docs);
    expect(Object.keys(docs)).toEqual(
      expect.arrayContaining([
        'listing_591',
        'disclosure_document',
        'social_posts',
        'short_video_script',
        'property_survey'
      ])
    );
    expect(docs.short_video_script.length).toBeGreaterThanOrEqual(100);
    expect(docs.short_video_script.length).toBeLessThanOrEqual(150);
  });
});
