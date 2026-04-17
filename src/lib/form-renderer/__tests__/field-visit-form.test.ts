import { describe, it, expect } from 'vitest';
import { getAllFieldsForVisit, getFieldsForLayer } from '../index';

describe('field-visit-form', () => {
  it('should return common fields for farmland', () => {
    const common = getFieldsForLayer('farmland', 'common');
    expect(common.length).toBeGreaterThan(0);
    expect(common.some((f) => f.key === 'total_price')).toBe(true);
  });

  it('should return land_common fields for farmland', () => {
    const landCommon = getFieldsForLayer('farmland', 'land_common');
    expect(landCommon.length).toBeGreaterThan(0);
  });

  it('should return type_specific fields for farmland (may be empty)', () => {
    const typeSpecific = getFieldsForLayer('farmland', 'type_specific');
    expect(Array.isArray(typeSpecific)).toBe(true);
  });

  it('getAllFieldsForVisit should return all three layers for farmland', () => {
    const allFields = getAllFieldsForVisit('farmland');
    expect(allFields.common.length).toBeGreaterThan(0);
    expect(allFields.categoryCommon.length).toBeGreaterThan(0);
    expect(Array.isArray(allFields.typeSpecific)).toBe(true);
  });

  it('getAllFieldsForVisit should return building_common for apartment', () => {
    const allFields = getAllFieldsForVisit('apartment');
    expect(allFields.common.length).toBeGreaterThan(0);
    expect(allFields.categoryCommon.length).toBeGreaterThan(0);
    expect(Array.isArray(allFields.typeSpecific)).toBe(true);
  });

  it('should return fields for suite', () => {
    const allFields = getAllFieldsForVisit('suite');
    expect(allFields.common.length).toBeGreaterThan(0);
    expect(allFields.categoryCommon.length).toBeGreaterThan(0);
    expect(Array.isArray(allFields.typeSpecific)).toBe(true);
  });
});
