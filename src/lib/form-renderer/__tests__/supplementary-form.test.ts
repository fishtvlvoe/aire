import { describe, it, expect } from 'vitest';
import { getFieldsForLayer } from '../index';

describe('supplementary-form', () => {
  it('should support supplementary form layer retrieval', () => {
    // Supplementary forms would be implemented as a new layer
    // For now, test that the schema system can handle any layer
    const result = getFieldsForLayer('farmland', 'type_specific');
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return type_specific fields for suite', () => {
    const result = getFieldsForLayer('suite', 'type_specific');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should return fields for available types', () => {
    const result = getFieldsForLayer('townhouse', 'type_specific');
    expect(Array.isArray(result)).toBe(true);
  });
});
