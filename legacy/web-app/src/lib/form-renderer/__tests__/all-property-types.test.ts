import { describe, it, expect } from 'vitest';
import { getAllFieldsForVisit } from '../index';
import { PROPERTY_TYPES } from '../../property-types';

const ALL_TYPES = Object.keys(PROPERTY_TYPES) as Array<keyof typeof PROPERTY_TYPES>;

const BUILDING_TYPES = ['apartment', 'highrise', 'townhouse', 'suite', 'shop', 'factory', 'farmhouse'] as const;
const LAND_TYPES = ['residential-land', 'commercial-land', 'industrial-land', 'farmland', 'rural-land', 'other-land'] as const;

describe('7.4 FieldVisitForm: 13 類動態渲染', () => {
  it('所有 13 類都能取得 common 欄位', () => {
    for (const type of ALL_TYPES) {
      const fields = getAllFieldsForVisit(type);
      expect(fields.common.length, `${type} 缺少 common 欄位`).toBeGreaterThan(0);
    }
  });

  it('建物類型使用 building_common（categoryCommon 非空）', () => {
    for (const type of BUILDING_TYPES) {
      const fields = getAllFieldsForVisit(type);
      expect(fields.categoryCommon.length, `${type} building_common 為空`).toBeGreaterThan(0);
    }
  });

  it('土地類型使用 land_common（categoryCommon 非空）', () => {
    for (const type of LAND_TYPES) {
      const fields = getAllFieldsForVisit(type);
      expect(fields.categoryCommon.length, `${type} land_common 為空`).toBeGreaterThan(0);
    }
  });

  it('所有欄位都有 key + label + type', () => {
    for (const type of ALL_TYPES) {
      const { common, categoryCommon, typeSpecific } = getAllFieldsForVisit(type);
      const allFields = [...common, ...categoryCommon, ...typeSpecific];
      for (const f of allFields) {
        expect(f.key, `${type} 欄位缺 key`).toBeTruthy();
        expect(f.label, `${type} 欄位 ${f.key} 缺 label`).toBeTruthy();
        expect(f.type, `${type} 欄位 ${f.key} 缺 type`).toBeTruthy();
      }
    }
  });

  it('address 欄位在所有類型的 common 中存在', () => {
    for (const type of ALL_TYPES) {
      const { common } = getAllFieldsForVisit(type);
      expect(
        common.some((f) => f.key === 'address'),
        `${type} 缺少 address 欄位`
      ).toBe(true);
    }
  });

  it('total_price 欄位在所有類型中存在', () => {
    for (const type of ALL_TYPES) {
      const { common } = getAllFieldsForVisit(type);
      expect(
        common.some((f) => f.key === 'total_price'),
        `${type} 缺少 total_price 欄位`
      ).toBe(true);
    }
  });
});
