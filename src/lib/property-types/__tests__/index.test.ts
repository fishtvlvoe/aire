import { describe, it, expect } from 'vitest';
import { getPropertyType, PROPERTY_TYPES } from '../index';

describe('property-type-registry', () => {
  it('getPropertyType should return correct info for farmland', () => {
    const result = getPropertyType('farmland');
    expect(result).toBeDefined();
    expect(result?.id).toBe('farmland');
    expect(result?.displayName).toBe('農地');
    expect(result?.category).toBe('land');
    expect(result?.available).toBe(true);
  });

  it('getPropertyType should return correct info for townhouse', () => {
    const result = getPropertyType('townhouse');
    expect(result).toBeDefined();
    expect(result?.id).toBe('townhouse');
    expect(result?.displayName).toBe('透天');
    expect(result?.category).toBe('building');
    expect(result?.available).toBe(true);
  });

  it('getPropertyType should return available=true for suite', () => {
    const result = getPropertyType('suite');
    expect(result).toBeDefined();
    expect(result?.available).toBe(true);
  });

  it('getPropertyType should return undefined for invalid type', () => {
    const result = getPropertyType('invalid-type');
    expect(result).toBeUndefined();
  });

  it('PROPERTY_TYPES should have 13 types', () => {
    const typeCount = Object.keys(PROPERTY_TYPES).length;
    expect(typeCount).toBe(13);
  });

  it('should have exactly 13 available types', () => {
    const availableCount = Object.values(PROPERTY_TYPES).filter(
      (type) => type.available
    ).length;
    expect(availableCount).toBe(13);
  });

  it('should have correct available types', () => {
    const availableTypes = Object.values(PROPERTY_TYPES)
      .filter((type) => type.available)
      .map((type) => type.id);

    const expectedTypes = [
      'farmland',
      'townhouse',
      'apartment',
      'highrise',
      'residential-land',
      'farmhouse',
      'suite',
      'shop',
      'factory',
      'industrial-land',
      'commercial-land',
      'rural-land',
      'other-land',
    ];
    expect(availableTypes.sort()).toEqual(expectedTypes.sort());
  });
});
