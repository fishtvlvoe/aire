import { describe, it, expect } from 'vitest';
import path from 'node:path';

import { parseTranscript } from '@/lib/parsers/transcript-parser';

const FIXTURE_PATH = path.resolve(
  process.cwd(),
  'docs/本/台南市中西區民權路三段400巷18號7樓_20260205.yaml.txt'
);

describe('Task 1 — transcript-parser', () => {
  it('A) Three-Format Input Support（格式偵測）', async () => {
    const yamlResult = await parseTranscript(FIXTURE_PATH);
    expect(yamlResult.source_format).toBe('yaml');
    expect(yamlResult.confidence).toBe(1.0);

    const pdfResult = await parseTranscript(Buffer.from('%PDF-1.4 mock'), 'mock.pdf');
    expect(pdfResult.source_format).toBe('pdf');
    expect(pdfResult.confidence).toBe(0.95);

    const imgResult = await parseTranscript(Buffer.from('jpeg mock'), 'mock.jpg');
    expect(imgResult.source_format).toBe('image');
    expect(imgResult.confidence).toBeGreaterThanOrEqual(0.7);
    expect(imgResult.confidence).toBeLessThanOrEqual(0.9);
  });

  it('B) Nine Property Sheet Fields Extraction（fixture）', async () => {
    const result = await parseTranscript(FIXTURE_PATH);

    const expectedRegistered = 77.26 * 0.3025;
    expect(result.fields.registered_area).toBeTypeOf('number');
    expect(Math.abs((result.fields.registered_area ?? 0) - expectedRegistered)).toBeLessThanOrEqual(0.02);

    expect(result.fields.main_building_area).toBeCloseTo(77.26, 2);
    expect(result.fields.accessory_building_area).toBeCloseTo(9.53, 2);

    // fixture 無騎樓
    expect([0, undefined]).toContain(result.fields.arcade_area as any);

    expect(result.fields.common_facility_area).toBeTypeOf('number');
    expect(Math.abs((result.fields.common_facility_area ?? 0) - 58.0)).toBeLessThan(0.2);

    expect(result.fields.parking_area).toBeTypeOf('number');
    expect(Math.abs((result.fields.parking_area ?? 0) - 39.63)).toBeLessThan(0.05);

    expect(result.fields.parking_type ?? '').toContain('地下');
    expect(result.fields.parking_space ?? '').toContain('71');

    // fixture 無土地資料
    expect([0, undefined]).toContain(result.fields.land_area as any);
  });

  it('C) Additional Field Extraction for Disclosure Document（fixture）', async () => {
    const result = await parseTranscript(FIXTURE_PATH);

    expect(result.additional.building_completion_date).toBeTruthy();
    expect(result.additional.building_age ?? 0).toBeGreaterThan(0);
    expect(result.additional.primary_use).toBe('集合住宅');
    expect(result.additional.building_material ?? '').toContain('鋼筋混凝土');

    expect(Array.isArray(result.additional.encumbrances)).toBe(true);
    const first = result.additional.encumbrances?.[0];
    expect(first?.creditor ?? '').toContain('第一商業銀行');
    expect(first?.amount).toBe(3180000);
  });

  it('D) Unified Output Format', async () => {
    const result = await parseTranscript(FIXTURE_PATH);
    expect(result).toHaveProperty('fields');
    expect(result).toHaveProperty('additional');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('source_format');

    expect(result.fields.registered_area).toBeTypeOf('number');
    expect(Array.isArray(result.additional.encumbrances)).toBe(true);
  });
});
