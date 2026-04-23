import { describe, it, expect } from 'vitest';
import { isLandType } from '../codex-provider';

describe('isLandType', () => {
  it.each([
    'farmland',
    'residential-land',
    'commercial-land',
    'industrial-land',
    'rural-land',
    'other-land',
  ])('returns true for land type "%s"', (propertyType) => {
    expect(isLandType(propertyType)).toBe(true);
  });

  it.each([
    'apartment',
    'townhouse',
    '',
  ])('returns false for non-land type "%s"', (propertyType) => {
    expect(isLandType(propertyType)).toBe(false);
  });
});
