import { describe, it, expect } from 'vitest';
import { isLandType } from '../codex-provider';

describe('isLandType', () => {
  it.each([
    '農地',
    '建地',
    '商業地',
    '工業地',
    '鄉村區建地',
    '其他土地',
  ])('returns true for land type "%s"', (propertyType) => {
    expect(isLandType(propertyType)).toBe(true);
  });

  it.each([
    '公寓',
    '透天別墅',
    '',
  ])('returns false for non-land type "%s"', (propertyType) => {
    expect(isLandType(propertyType)).toBe(false);
  });
});
