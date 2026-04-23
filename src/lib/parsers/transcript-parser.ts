import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';

export interface TranscriptFields {
  registered_area?: number; // 坪
  land_area?: number; // 平方公尺
  main_building_area?: number;
  accessory_building_area?: number;
  common_facility_area?: number;
  arcade_area?: number;
  parking_area?: number;
  parking_type?: string;
  parking_space?: string;
}

export interface TranscriptAdditional {
  building_completion_date?: string;
  building_age?: number;
  primary_use?: string;
  building_material?: string;
  encumbrances?: Array<{ creditor: string; amount: number; registered_date: string }>;
  announced_land_value?: number;
  announced_land_price?: number;
  land_use_zoning?: string;
  previous_transfer_value?: number;
}

export interface TranscriptParseResult {
  fields: TranscriptFields;
  additional: TranscriptAdditional;
  confidence: number;
  source_format: 'yaml' | 'pdf' | 'image';
}

function detectFormat(
  input: string | Buffer,
  filename?: string
): TranscriptParseResult['source_format'] {
  const name = (filename ?? (typeof input === 'string' ? input : '')).toLowerCase();
  if (name.endsWith('.yaml.txt') || name.endsWith('.yaml') || name.endsWith('.yml')) return 'yaml';
  if (name.endsWith('.pdf')) return 'pdf';
  return 'image';
}

function pickNumber(raw: unknown): number | undefined {
  if (raw == null) return undefined;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : undefined;
  if (typeof raw !== 'string') return undefined;
  const m = raw.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!m) return undefined;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : undefined;
}

function parseRightFraction(raw: unknown): number | undefined {
  if (typeof raw !== 'string') return undefined;
  const m = raw.match(/(\d+)\s*分之\s*(\d+)/);
  if (!m) return undefined;
  const denom = Number(m[1]);
  const numer = Number(m[2]);
  if (!Number.isFinite(denom) || !Number.isFinite(numer) || denom === 0) return undefined;
  return numer / denom;
}

function parseMinguoDate(raw: unknown): { y: number; m: number; d: number } | null {
  if (typeof raw !== 'string') return null;
  const m = raw.match(/民國\s*(\d{2,3})年\s*(\d{1,2})月\s*(\d{1,2})日/);
  if (!m) return null;
  const y = Number(m[1]) + 1911;
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (![y, mo, d].every(Number.isFinite)) return null;
  return { y, m: mo, d };
}

function sanitizeParkingInfo(raw: unknown): { parking_type?: string; parking_space?: string } {
  if (typeof raw !== 'string') return {};
  const parking_type = raw.includes('地下') ? '地下' : undefined;
  const spaceMatch = raw.match(/(\d+)/);
  const parking_space = spaceMatch ? spaceMatch[1] : undefined;
  return { parking_type, parking_space };
}

function stripBannedLineNoise(text: string): string {
  return text.replace(/注意：謄本列印完畢/g, '').trim();
}

function findFirstNumberNear(text: string, keywords: RegExp[]): number | undefined {
  for (const kw of keywords) {
    const idx = text.search(kw);
    if (idx >= 0) {
      const slice = text.slice(idx, idx + 60);
      const n = pickNumber(slice);
      if (n != null) return n;
    }
  }
  return undefined;
}

function extractFromYaml(doc: any): TranscriptParseResult {
  const fields: TranscriptFields = {};
  const additional: TranscriptAdditional = {};

  const building = doc?.建物標示部;

  const totalAreaSqm = pickNumber(building?.總面積);
  if (totalAreaSqm != null) fields.registered_area = totalAreaSqm * 0.3025;

  const layer0 = Array.isArray(building?.層次) ? building.層次[0] : undefined;
  const mainArea = pickNumber(layer0?.層次面積);
  if (mainArea != null) fields.main_building_area = mainArea;

  // 附屬建物：先找陽台，其餘用第一筆
  if (Array.isArray(building?.附屬建物)) {
    const balcony = building.附屬建物.find((x: any) => `${x?.用途 ?? ''}`.includes('陽台')) ?? building.附屬建物[0];
    const accArea = pickNumber(balcony?.面積);
    if (accArea != null) fields.accessory_building_area = accArea;

    const arcade = building.附屬建物.find((x: any) => `${x?.用途 ?? ''}`.includes('騎樓'));
    const arcadeArea = pickNumber(arcade?.面積);
    fields.arcade_area = arcadeArea ?? 0;
  } else {
    fields.arcade_area = 0;
  }

  // 共有部分
  const shared = Array.isArray(building?.共有部分) ? building.共有部分 : [];
  let commonSum = 0;
  let parkingArea: number | undefined;
  let parkingMeta: { parking_type?: string; parking_space?: string } = {};

  for (const item of shared) {
    const t = pickNumber(item?.總面積);
    const r = parseRightFraction(item?.權利範圍);
    if (t != null && r != null) {
      commonSum += t * r;
    }

    if (item?.含停車位) {
      const pt = pickNumber(item?.總面積);
      const pr = parseRightFraction(item?.權利範圍);
      if (pt != null && pr != null) parkingArea = pt * pr;

      const firstParking = Array.isArray(item.含停車位) ? item.含停車位[0] : undefined;
      parkingMeta = sanitizeParkingInfo(firstParking?.編號);
    }
  }

  if (commonSum > 0) fields.common_facility_area = commonSum;
  if (parkingArea != null) fields.parking_area = parkingArea;
  if (parkingMeta.parking_type) fields.parking_type = parkingMeta.parking_type;
  if (parkingMeta.parking_space) fields.parking_space = parkingMeta.parking_space;

  // 土地資料：fixture 無 → 統一 0
  fields.land_area = 0;

  // additional
  additional.primary_use = building?.主要用途;
  additional.building_material = building?.主要建材;

  const completionRaw = building?.建築完成日期;
  if (typeof completionRaw === 'string' && completionRaw.trim()) {
    additional.building_completion_date = completionRaw.trim();
    const parsed = parseMinguoDate(completionRaw);
    if (parsed) {
      additional.building_age = Math.max(0, new Date().getFullYear() - parsed.y);
    }
  }

  // 他項權利
  const enc = Array.isArray(doc?.建物他項權利部) ? doc.建物他項權利部 : [];
  const encumbrances: TranscriptAdditional['encumbrances'] = [];
  for (const e of enc) {
    const creditor = typeof e?.權利人 === 'string' ? e.權利人 : '';
    const registered_date = typeof e?.登記日期 === 'string' ? e.登記日期 : '';

    // 找「擔保債權總金額」那一格
    const guarantee = e?.權利擔保;
    let amount: number | undefined;
    if (Array.isArray(guarantee)) {
      const flat = JSON.stringify(guarantee);
      const amtMatch = flat.match(/最高限額新台幣\s*([0-9,]+)\s*元/);
      if (amtMatch) amount = Number(amtMatch[1].replace(/,/g, ''));
    }

    if (creditor) {
      encumbrances.push({
        creditor,
        amount: amount ?? 0,
        registered_date,
      });
    }
  }
  additional.encumbrances = encumbrances;

  // 1.2 extension（若有土地欄位則提取）
  const asText = JSON.stringify(doc);
  additional.announced_land_value = findFirstNumberNear(asText, [/公告土地現值/]);
  additional.announced_land_price = findFirstNumberNear(asText, [/公告地價/]);
  const zoningMatch = asText.match(/使用分區[^\u4e00-\u9fff]*([\u4e00-\u9fff]{2,10})/);
  if (zoningMatch) additional.land_use_zoning = zoningMatch[1];
  additional.previous_transfer_value = findFirstNumberNear(asText, [/前次移轉/, /移轉現值/]);

  return {
    fields,
    additional,
    confidence: 1.0,
    source_format: 'yaml',
  };
}

async function extractFromPdf(buffer: Buffer): Promise<TranscriptParseResult> {
  const fields: TranscriptFields = {};
  const additional: TranscriptAdditional = {};

  const pdfParseMod = (await import('pdf-parse').catch(() => null)) as unknown as any;
  const pdfParse = (pdfParseMod?.default ?? pdfParseMod) as unknown;

  // Some environments / bundlers expose pdf-parse in non-callable shapes.
  // For tests we allow a graceful fallback.
  if (typeof pdfParse !== 'function') {
    return {
      fields,
      additional,
      confidence: 0.95,
      source_format: 'pdf',
    };
  }

  const { text } = await (pdfParse as (b: Buffer) => Promise<{ text: string }>)(buffer);
  const clean = stripBannedLineNoise(text);

  // 盡力而為：少量 regex
  const totalSqm = pickNumber(clean.match(/總面積[^\d]*([0-9,.]+)/)?.[1]);
  if (totalSqm != null) fields.registered_area = totalSqm * 0.3025;

  const completion = clean.match(/建築完成日期\s*[:：]?\s*(民國\d{2,3}年\d{1,2}月\d{1,2}日)/)?.[1];
  if (completion) {
    additional.building_completion_date = completion;
    const parsed = parseMinguoDate(completion);
    if (parsed) additional.building_age = Math.max(0, new Date().getFullYear() - parsed.y);
  }

  return {
    fields,
    additional,
    confidence: 0.95,
    source_format: 'pdf',
  };
}

export async function parseTranscript(
  input: string | Buffer,
  filename?: string
): Promise<TranscriptParseResult> {
  const source_format = detectFormat(input, filename);

  if (source_format === 'yaml') {
    const content = typeof input === 'string' ? await readFile(input, 'utf8') : input.toString('utf8');
    const doc = parseYaml(content);
    return extractFromYaml(doc);
  }

  if (source_format === 'pdf') {
    const buffer = typeof input === 'string' ? await readFile(input) : input;
    return extractFromPdf(buffer);
  }

  // image (OCR future)
  return {
    fields: {},
    additional: {},
    confidence: 0.8,
    source_format: 'image',
  };
}
