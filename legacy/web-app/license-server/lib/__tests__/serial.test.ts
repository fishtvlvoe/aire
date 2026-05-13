import { describe, expect, it } from 'vitest';
import { generateSerialBatch, generateSerialKey } from '../serial';

describe('serial generator', () => {
  it('generates key in THREE-XXXX-XXXX-XXXX format', () => {
    const key = generateSerialKey();
    expect(key).toMatch(/^THREE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it('generates unique keys for batch count', () => {
    const keys = generateSerialBatch(50);
    expect(keys).toHaveLength(50);
    expect(new Set(keys).size).toBe(50);
  });
});

