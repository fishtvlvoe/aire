import { runCodex } from '@/lib/codex-client';
import type { PropertyDossier, PublicFacility } from '@/lib/models/property-dossier';
import type { TranscriptParseResult } from '@/lib/parsers/transcript-parser';
import { TaxCalculator } from '@/lib/scrapers/tax-calculator';
import { BankEstimator } from '@/lib/scrapers/bank-estimator';
import { appendDisclaimer } from './disclaimer';

function display(v: unknown, unit?: string): string {
  if (v === null || v === undefined || v === '') return '待補';
  if (typeof v === 'number') return unit ? `${v}${unit}` : String(v);
  return String(v);
}

const ALL_FACILITIES: PublicFacility[] = [
  '游泳池',
  '健身房',
  '水療室',
  '撞球間',
  '籃球場',
  '三溫暖',
  '網球場',
  '其他',
];

export async function generatePropertySheet(
  dossier: PropertyDossier,
  transcript?: TranscriptParseResult
): Promise<string> {
  const mergedTranscript = transcript ?? dossier.transcript;

  const base: PropertyDossier = {
    ...dossier,
    transcript: mergedTranscript,
    ...(mergedTranscript?.fields ?? {}),
  };

  // L2: system calculators
  const taxCalc = new TaxCalculator();
  const bank = new BankEstimator();

  const landValue = mergedTranscript?.additional.announced_land_value ?? 0;
  const prevTransfer = mergedTranscript?.additional.previous_transfer_value ?? 0;
  const landArea = mergedTranscript?.fields.land_area ?? 0;

  const [taxSettled, bankSettled] = await Promise.allSettled([
    taxCalc.calculate({
      announced_land_value: Number(landValue) || 0,
      previous_transfer_value: Number(prevTransfer) || 0,
      area: Number(landArea) || 0,
    }),
    bank.estimate(base.total_price * 10_000),
  ]);
  if (taxSettled.status === 'fulfilled') base.tax_result = taxSettled.value;
  if (bankSettled.status === 'fulfilled') base.mortgage_scenarios = bankSettled.value.mortgage_scenarios;

  // LLM: pros/cons analysis
  let aiAnalysis = '待補';
  try {
    const res = await runCodex(
      [
        'SYSTEM: 你是台灣房仲助理，請用白話、務實口吻做物件優劣勢分析。禁止寫「房價會漲/投資必賺/增值保證」。',
        `USER: 物件類型=${base.property_type}，地址=${base.address}，總價=${base.total_price}萬元。`,
        '請輸出：優點(3-5點) / 缺點(2-4點) / 建議客群(2類)。',
      ].join('\n')
    );
    if (res.success) aiAnalysis = (res.output ?? '').trim() || '待補';
  } catch {
    // tolerate
  }

  const f = mergedTranscript?.fields ?? {};
  const a = mergedTranscript?.additional ?? {};

  const lines: string[] = [];
  lines.push('# 物件表');
  lines.push('');
  lines.push('## 基本資訊');
  lines.push(`- 物件類型：${display(base.property_type)}`);
  lines.push(`- 地址：${display(base.address)}`);
  lines.push(`- 總價：${display(base.total_price, ' 萬元')}`);
  lines.push('');

  lines.push('## 九項面積（謄本）');
  lines.push('| 欄位 | 數值 |');
  lines.push('| --- | --- |');
  lines.push(`| 登記坪數 | ${display(f.registered_area, ' 坪')} |`);
  lines.push(`| 土地面積 | ${display(f.land_area, ' ㎡')} |`);
  lines.push(`| 主建物 | ${display(f.main_building_area, ' ㎡')} |`);
  lines.push(`| 附屬建物 | ${display(f.accessory_building_area, ' ㎡')} |`);
  lines.push(`| 共有部分 | ${display(f.common_facility_area, ' ㎡')} |`);
  lines.push(`| 騎樓 | ${display(f.arcade_area, ' ㎡')} |`);
  lines.push(`| 停車面積 | ${display(f.parking_area, ' ㎡')} |`);
  lines.push(`| 停車型式 | ${display(f.parking_type)} |`);
  lines.push(`| 停車編號 | ${display(f.parking_space)} |`);
  lines.push('');

  lines.push('## 公設（Checkbox）');
  const set = new Set(base.public_facilities ?? []);
  for (const item of ALL_FACILITIES) {
    const checked = set.has(item) ? 'x' : ' ';
    lines.push(`- [${checked}] ${item}`);
  }
  lines.push('');

  lines.push('## 稅費試算（L2）');
  if (base.tax_result) {
    lines.push(`- 土增稅(一般)：${base.tax_result.land_value_increment_tax_general}`);
    lines.push(`- 土增稅(自用)：${base.tax_result.land_value_increment_tax_self_use}`);
    lines.push(`- 來源：${base.tax_result.source}`);
  } else {
    lines.push('待補');
  }
  lines.push('');

  lines.push('## 房貸三情境（L2）');
  if (base.mortgage_scenarios?.length) {
    for (const s of base.mortgage_scenarios) {
      lines.push(
        `- ${(s.loan_ratio * 100).toFixed(0)}%：頭期款 ${Math.round(s.down_payment)}，月付 ${Math.round(s.monthly_payment)}（${s.source}）`
      );
    }
  } else {
    lines.push('待補');
  }
  lines.push('');

  lines.push('## AI 分析');
  lines.push(aiAnalysis);

  // disclosure-related quick fields
  lines.push('');
  lines.push('## 產權補充');
  lines.push(`- 建築完成日期：${display(a.building_completion_date)}`);
  lines.push(`- 屋齡：${display(a.building_age, ' 年')}`);

  return appendDisclaimer(lines.join('\n'));
}
