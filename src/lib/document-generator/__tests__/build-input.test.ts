import { describe, it, expect } from 'vitest';
import { buildDocumentInput } from '../build-input';
import type { Listing } from '../../db';

function makeListing(partial: Partial<Listing> = {}): Listing {
  return {
    id: 1,
    property_type: 'apartment',
    field_visit_status: 'field-visit-complete',
    status: 'ready-for-generation',
    field_visit_data: null,
    supplementary_data: null,
    generated_documents: null,
    pre_commission_data: null,
    market_summary: null,
    attachments: null,
    extracted_data: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

describe('buildDocumentInput', () => {
  it('基礎組裝：解析各 JSON 欄位並回傳 DocumentGeneratorInput', () => {
    const listing = makeListing({
      field_visit_data: JSON.stringify({ address: '台南市', total_price: 1200 }),
      supplementary_data: JSON.stringify({ management_fee: 2000 }),
      pre_commission_data: JSON.stringify({ owner_name: '王小明', owner_phone: '0912345678' }),
      market_summary: '周邊行情摘要',
      attachments: JSON.stringify([{ type: 'market_research', path: '/uploads/1/market.png' }]),
    });

    const input = buildDocumentInput(listing);

    expect(input.property_type).toBe('apartment');
    expect(input.field_visit_data).toEqual({ address: '台南市', total_price: 1200 });
    expect(input.supplementary_data).toEqual({ management_fee: 2000 });
    expect(input.pre_commission_data).toEqual({ owner_name: '王小明', owner_phone: '0912345678' });
    expect(input.extracted_data).toEqual({});
    expect(input.market_research).toEqual({
      summary: '周邊行情摘要',
      attachments: ['/uploads/1/market.png'],
    });
  });

  it('extracted_data 為 ExtractedDataPayload 格式時，從 merged_fields 提取扁平 value', () => {
    const listing = makeListing({
      extracted_data: JSON.stringify({
        by_attachment: {},
        merged_fields: {
          announced_land_value: { value: '45000', confidence: 0.92, provenance: 'ocr-pdf', from: 'transcript.pdf' },
          rights_range: { value: '1/2', confidence: 0.88, provenance: 'ocr-pdf' },
          land_section: { value: '中西區段', confidence: 0.95, provenance: 'ocr-pdf' },
        },
      }),
    });

    const input = buildDocumentInput(listing);

    expect(input.extracted_data).toEqual({
      announced_land_value: '45000',
      rights_range: '1/2',
      land_section: '中西區段',
    });
  });

  it('extracted_data 為扁平格式時直接沿用', () => {
    const listing = makeListing({
      extracted_data: JSON.stringify({ announced_land_value: '32000', building_area: 50 }),
    });

    const input = buildDocumentInput(listing);

    expect(input.extracted_data).toEqual({ announced_land_value: '32000', building_area: 50 });
  });

  it('extracted_data 為 null 時回傳空物件', () => {
    const listing = makeListing({ extracted_data: null });
    const input = buildDocumentInput(listing);
    expect(input.extracted_data).toEqual({});
  });

  it('低信心值欄位被過濾，不進入 extracted_data', () => {
    const listing = makeListing({
      extracted_data: JSON.stringify({
        merged_fields: {
          building_area: { value: '3Ä5㎡', confidence: 0.35, provenance: 'ocr-pdf' },
          land_section: { value: '中西區段', confidence: 0.95, provenance: 'ocr-pdf' },
        },
      }),
    });

    const input = buildDocumentInput(listing);

    expect(input.extracted_data.building_area).toBeUndefined();
    expect(input.extracted_data.land_section).toBe('中西區段');
  });

  it('無 confidence 屬性的舊資料欄位正常帶入（相容模式）', () => {
    const listing = makeListing({
      extracted_data: JSON.stringify({
        merged_fields: {
          building_area: { value: '50', provenance: 'ocr-pdf' },
        },
      }),
    });

    const input = buildDocumentInput(listing);

    expect(input.extracted_data.building_area).toBe('50');
  });

  it('extracted_data JSON 損壞時回傳空物件，不拋錯', () => {
    const listing = makeListing({ extracted_data: 'not-json' });
    const input = buildDocumentInput(listing);
    expect(input.extracted_data).toEqual({});
  });

  describe('system_computed 計算', () => {
    it('area_ping = building_area × 0.3025（取自 field_visit_data）', () => {
      const listing = makeListing({
        field_visit_data: JSON.stringify({ building_area: 84.13 }),
      });
      const input = buildDocumentInput(listing);
      expect(input.system_computed?.area_ping).toBe(25.45);
    });

    it('area_ping = building_area × 0.3025（取自 extracted_data，field_visit_data 為空）', () => {
      const listing = makeListing({
        extracted_data: JSON.stringify({ building_area: 50 }),
      });
      const input = buildDocumentInput(listing);
      expect(input.system_computed?.area_ping).toBe(15.13);
    });

    it('supplementary_data 的 building_area 優先於 extracted_data', () => {
      const listing = makeListing({
        field_visit_data: JSON.stringify({ building_area: 30 }),
        supplementary_data: JSON.stringify({ building_area: 100 }),
        extracted_data: JSON.stringify({ building_area: 60 }),
      });
      const input = buildDocumentInput(listing);
      expect(input.system_computed?.area_ping).toBe(30.25);
    });

    it('building_area 為 0 時 area_ping 為 0（邊界情境）', () => {
      const listing = makeListing({
        field_visit_data: JSON.stringify({ building_area: 0 }),
      });
      const input = buildDocumentInput(listing);
      expect(input.system_computed?.area_ping).toBe(0);
    });

    it('building_age：民國年換算（year_built = 80 → 2026 - 1991 = 35）', () => {
      const listing = makeListing({
        field_visit_data: JSON.stringify({ year_built: 80 }),
      });
      const input = buildDocumentInput(listing);
      expect(input.system_computed?.building_age).toBe(35);
    });

    it('building_age：西元年直接計算（year_built = 1991 → 2026 - 1991 = 35）', () => {
      const listing = makeListing({
        field_visit_data: JSON.stringify({ year_built: 1991 }),
      });
      const input = buildDocumentInput(listing);
      expect(input.system_computed?.building_age).toBe(35);
    });

    it('extracted_data 的 year_built 優先於 field_visit_data', () => {
      const listing = makeListing({
        field_visit_data: JSON.stringify({ year_built: 70 }),
        extracted_data: JSON.stringify({ year_built: 85 }),
      });
      const input = buildDocumentInput(listing);
      expect(input.system_computed?.building_age).toBe(30); // 2026 - (85 + 1911) = 30
    });

    it('report_date 為當天日期', () => {
      const listing = makeListing();
      const input = buildDocumentInput(listing);
      const today = new Date().toISOString().split('T')[0];
      expect(input.system_computed?.report_date).toBe(today);
    });

    it('無 building_area 與 year_built 時 system_computed 僅含 report_date', () => {
      const listing = makeListing();
      const input = buildDocumentInput(listing);
      expect(input.system_computed).toEqual({ report_date: expect.any(String) });
    });
  });

  describe('資料來源優先順序合併（supplementary > extracted > field_visit）', () => {
    it('同欄位存在於 supplementary_data 與 extracted_data，supplementary 優先', () => {
      const listing = makeListing({
        supplementary_data: JSON.stringify({ land_section: '東區段', building_area: 100 }),
        extracted_data: JSON.stringify({ land_section: '中西區段', building_area: 50 }),
      });
      const input = buildDocumentInput(listing);
      // system_computed 應取 supplementary_data 的 building_area
      expect(input.system_computed?.area_ping).toBe(30.25);
    });

    it('同欄位存在於 extracted_data 與 field_visit_data，extracted 優先', () => {
      const listing = makeListing({
        field_visit_data: JSON.stringify({ building_area: 30 }),
        extracted_data: JSON.stringify({ building_area: 60 }),
      });
      const input = buildDocumentInput(listing);
      expect(input.system_computed?.area_ping).toBe(18.15);
    });

    it('field 值為 0 時視為有效值，不跳過', () => {
      const listing = makeListing({
        supplementary_data: JSON.stringify({ building_area: 0 }),
        extracted_data: JSON.stringify({ building_area: 100 }),
      });
      const input = buildDocumentInput(listing);
      expect(input.system_computed?.area_ping).toBe(0);
    });
  });

  describe('getMergedValue null 處理', () => {
    it('supplementary_data 為 null 時 fallback 到 extracted_data', () => {
      const listing = makeListing({
        supplementary_data: JSON.stringify({ building_area: null }),
        extracted_data: JSON.stringify({ building_area: '60' }),
      });
      const input = buildDocumentInput(listing);
      expect(input.system_computed?.area_ping).toBe(18.15);
    });

    it('extracted_data 為 null 時 fallback 到 field_visit_data', () => {
      const listing = makeListing({
        supplementary_data: JSON.stringify({ building_area: null }),
        extracted_data: JSON.stringify({ building_area: null }),
        field_visit_data: JSON.stringify({ building_area: 20 }),
      });
      const input = buildDocumentInput(listing);
      expect(input.system_computed?.area_ping).toBe(6.05);
    });

    it('supplementary_data 為空字串時 fallback 到 extracted_data', () => {
      const listing = makeListing({
        supplementary_data: JSON.stringify({ building_area: '' }),
        extracted_data: JSON.stringify({ building_area: '50' }),
      });
      const input = buildDocumentInput(listing);
      expect(input.system_computed?.area_ping).toBe(15.13);
    });
  });
});
