import { describe, it, expect } from 'vitest';
import { normalizeInitialData, getChapterBadgeClassName, shouldShowRequiredDot } from '@/components/forms/FieldVisitForm';
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

describe('FieldVisitForm 純函式（Decision: initialData / badge / 紅點）', () => {
  describe('normalizeInitialData', () => {
    it('undefined → 空物件', () => {
      // 若沒有初始資料，應回傳空物件，避免表單初始化出錯
      expect(normalizeInitialData(undefined)).toEqual({});
    });

    it('字串/數字/boolean 轉字串', () => {
      // 各種原始型別都應被正規化為字串，方便表單欄位直接使用
      expect(
        normalizeInitialData({
          a: 'hello',
          b: 123,
          c: true,
          d: false,
        })
      ).toEqual({
        a: 'hello',
        b: '123',
        c: 'true',
        d: 'false',
      });
    });

    it('null/undefined 值轉空字串', () => {
      // null/undefined 應統一轉為空字串，避免受控元件出現警告
      expect(
        normalizeInitialData({
          a: null,
          b: undefined,
          c: 'ok',
        })
      ).toEqual({
        a: '',
        b: '',
        c: 'ok',
      });
    });

    it('nested object/array 跳過不納入', () => {
      // 物件與陣列不應直接塞入表單字串狀態，需跳過以免格式混亂
      expect(
        normalizeInitialData({
          a: { x: 1 },
          b: [1, 2, 3],
          c: 'ok',
          d: 0,
        })
      ).toEqual({
        c: 'ok',
        d: '0',
      });
    });
  });

  describe('getChapterBadgeClassName', () => {
    it('必填未填 → 灰色 slate', () => {
      // filledRequired=1, totalRequired=3, filledAll=1, totalAll=5 → 'bg-slate-100 text-slate-600'
      expect(getChapterBadgeClassName(1, 3, 1, 5)).toBe('bg-slate-100 text-slate-600');
    });

    it('必填已填但非必填未填 → 琥珀 amber', () => {
      // filledRequired=3, totalRequired=3, filledAll=4, totalAll=5 → 'bg-amber-100 text-amber-700'
      expect(getChapterBadgeClassName(3, 3, 4, 5)).toBe('bg-amber-100 text-amber-700');
    });

    it('全部填完 → 綠 emerald', () => {
      // filledRequired=3, totalRequired=3, filledAll=5, totalAll=5 → 'bg-emerald-100 text-emerald-700'
      expect(getChapterBadgeClassName(3, 3, 5, 5)).toBe('bg-emerald-100 text-emerald-700');
    });

    it('totalAll=0 → 灰色', () => {
      // totalAll=0 時，應回到預設灰色樣式
      expect(getChapterBadgeClassName(0, 0, 0, 0)).toBe('bg-slate-100 text-slate-600');
    });
  });

  describe('shouldShowRequiredDot', () => {
    it('必填未填 → true', () => {
      // filledRequired=1, totalRequired=3 → true
      expect(shouldShowRequiredDot(1, 3)).toBe(true);
    });

    it('必填全填 → false', () => {
      // filledRequired=3, totalRequired=3 → false
      expect(shouldShowRequiredDot(3, 3)).toBe(false);
    });

    it('totalRequired=0 → false', () => {
      // totalRequired=0 時，不應顯示紅點
      expect(shouldShowRequiredDot(0, 0)).toBe(false);
    });
  });
});
