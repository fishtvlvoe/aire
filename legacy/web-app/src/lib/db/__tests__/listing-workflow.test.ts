import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

let db: typeof import('../index').db;
let createListing: typeof import('../index').createListing;
let getListing: typeof import('../index').getListing;
let updateListingFieldVisit: typeof import('../index').updateListingFieldVisit;
let updateSupplementaryData: typeof import('../index').updateSupplementaryData;

describe('listing-workflow', () => {
  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    const mod = await import('../index');
    db = mod.db;
    createListing = mod.createListing;
    getListing = mod.getListing;
    updateListingFieldVisit = mod.updateListingFieldVisit;
    updateSupplementaryData = mod.updateSupplementaryData;
  });

  beforeEach(() => {
    // 清空 listings 表
    db.prepare('DELETE FROM listings').run();
  });

  afterAll(() => {
    db.close();
  });

  describe('createListing', () => {
    it('should create a listing with valid property type farmland', () => {
      const listing = createListing('farmland');
      expect(listing).toBeDefined();
      expect(listing.property_type).toBe('farmland');
      expect(listing.status).toBe('draft');
    });

    it('should throw invalid-property-type for unknown type', () => {
      expect(() => createListing('invalid-type')).toThrow('invalid-property-type');
    });

    it('should throw invalid-property-type for another unknown type string', () => {
      expect(() => createListing('not-a-real-type')).toThrow('invalid-property-type');
    });

    it('should create listing with correct initial status', () => {
      const listing = createListing('townhouse');
      expect(listing.status).toBe('draft');
      expect(listing.field_visit_status).toBe('draft');
    });
  });

  describe('updateListingFieldVisit', () => {
    it('should save field visit data and update status', () => {
      const listing = createListing('farmland');
      const fieldData = {
        total_price: 500000,
        address: '台南市東區',
        land_area: 100,
      };

      updateListingFieldVisit(listing.id, fieldData, 'field-visit-complete');

      const updated = getListing(listing.id);
      expect(updated).toBeDefined();
      expect(updated?.status).toBe('field-visit-complete');
      expect(updated?.field_visit_status).toBe('field-visit-complete');

      const savedData = JSON.parse(updated?.field_visit_data || '{}');
      expect(savedData.total_price).toBe(500000);
      expect(savedData.address).toBe('台南市東區');
    });
  });

  describe('updateSupplementaryData', () => {
    it('should save supplementary data and advance status', () => {
      const listing = createListing('apartment');
      const supplementaryData = {
        building_age: 15,
        floor_count: 5,
      };

      updateSupplementaryData(listing.id, supplementaryData);

      const updated = getListing(listing.id);
      expect(updated).toBeDefined();
      expect(updated?.status).toBe('ready-for-generation');

      const savedData = JSON.parse(updated?.supplementary_data || '{}');
      expect(savedData.building_age).toBe(15);
      expect(savedData.floor_count).toBe(5);
    });
  });
});
