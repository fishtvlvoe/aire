import { describe, it, expect } from 'vitest';
import { PROPERTY_TYPES, getPropertyType } from '../index';
import * as schemas from '../schemas';

const ALL_TYPES = Object.keys(PROPERTY_TYPES) as Array<keyof typeof PROPERTY_TYPES>;

describe('property-types: 13 類完整性', () => {
  it('應有 13 種物件類型', () => {
    expect(ALL_TYPES.length).toBe(13);
  });

  it('所有類型 available: true', () => {
    for (const type of ALL_TYPES) {
      expect(PROPERTY_TYPES[type].available).toBe(true);
    }
  });

  it('所有類型有 displayName', () => {
    for (const type of ALL_TYPES) {
      expect(PROPERTY_TYPES[type].displayName).toBeTruthy();
    }
  });

  it('getPropertyType 對所有類型回傳非 null', () => {
    for (const type of ALL_TYPES) {
      expect(getPropertyType(type)).not.toBeNull();
    }
  });
});

describe('property-type schemas: metadata 完整性', () => {
  const schemaNames = ALL_TYPES.map((t) => {
    // 'commercial-land' → 'commercialLandSchema'
    const camel = t.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    return `${camel}Schema`;
  });

  it('所有類型有對應 schema export', () => {
    for (const name of schemaNames) {
      expect((schemas as Record<string, unknown>)[name], `缺少 ${name}`).toBeDefined();
    }
  });

  it('所有 schema 的 common 欄位非空', () => {
    for (const name of schemaNames) {
      const schema = (schemas as Record<string, { common: unknown[] }>)[name];
      expect(schema.common.length, `${name}.common 為空`).toBeGreaterThan(0);
    }
  });

  it('所有 schema 欄位都有 sourceType 和 displayMode', () => {
    for (const name of schemaNames) {
      const schema = (schemas as Record<string, { common: Array<Record<string, unknown>>; type_specific?: Array<Record<string, unknown>> }>)[name];
      const allFields = [
        ...schema.common,
        ...(schema.type_specific ?? []),
      ];
      for (const field of allFields) {
        expect(field.sourceType, `${name} 欄位 ${String(field.key)} 缺 sourceType`).toBeTruthy();
        expect(field.displayMode, `${name} 欄位 ${String(field.key)} 缺 displayMode`).toBeTruthy();
      }
    }
  });
});
