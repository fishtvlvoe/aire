import { runCodex } from '@/lib/codex-client';
import type { PropertyDossier } from '@/lib/models/property-dossier';
import type { TranscriptParseResult } from '@/lib/parsers/transcript-parser';
import { TaxCalculator } from '@/lib/scrapers/tax-calculator';
import { BankEstimator } from '@/lib/scrapers/bank-estimator';
import {
  buildEncumbranceInterpretationPrompt,
  buildPropertySummaryPrompt,
  buildTranscriptAppendix,
} from '@/lib/prompts/disclosure-document-prompt';

export interface DisclosureDocumentPage {
  page_number: number;
  title: string;
  content: string;
  attachments?: string[];
}

export interface DisclosureDocumentResult {
  pages: DisclosureDocumentPage[]; // 14 頁
  toc_checkboxes: Record<string, boolean>; // 目錄 checkbox
}

function v(x: unknown): string {
  if (x === null || x === undefined) return '待補';
  if (typeof x === 'string') return x.trim() || '待補';
  return String(x);
}

export interface DisclosureMarketResearchInput {
  /** 業務人工填寫的周邊行情摘要（500 字內） */
  market_summary?: string | null;
  /** 業務上傳的周邊行情截圖附件路徑陣列（jpg/png/pdf） */
  market_research_attachments?: string[];
}

export async function generateDisclosureDocument(
  dossier: PropertyDossier,
  transcript?: TranscriptParseResult,
  options?: {
    photos?: string[];
    field_visit_data?: Record<string, unknown>;
  } & DisclosureMarketResearchInput
): Promise<DisclosureDocumentResult> {
  const merged: PropertyDossier = {
    ...dossier,
    ...(transcript?.fields ?? {}),
    transcript: transcript ?? dossier.transcript,
  };

  const t = transcript ?? merged.transcript;

  // L2 calculators (best-effort)
  try {
    merged.tax_result = await new TaxCalculator().calculate({
      announced_land_value: Number(t?.additional.announced_land_value ?? 0) || 0,
      previous_transfer_value: Number(t?.additional.previous_transfer_value ?? 0) || 0,
      area: Number(t?.fields.land_area ?? 0) || 0,
    });
  } catch {
    // tolerate
  }

  try {
    const est = await new BankEstimator().estimate(merged.total_price * 10_000);
    merged.mortgage_scenarios = est.mortgage_scenarios;
  } catch {
    // tolerate
  }

  // LLM
  let summary = '待補';
  try {
    const r = await runCodex(buildPropertySummaryPrompt(merged));
    if (r.success) summary = (r.output ?? '').trim() || '待補';
  } catch {
    // tolerate
  }

  let encText = '待補';
  try {
    const r = await runCodex(buildEncumbranceInterpretationPrompt(t?.additional.encumbrances));
    if (r.success) encText = (r.output ?? '').trim() || '待補';
  } catch {
    // tolerate
  }

  const appendixBuilding = buildTranscriptAppendix(JSON.stringify(t ?? {}, null, 2));

  const pages: DisclosureDocumentPage[] = [
    { page_number: 1, title: '封面', content: `物件：${v(merged.address)}\n總價：${v(merged.total_price)} 萬元` },
    { page_number: 2, title: '物件摘要+主照', content: `${summary}\n\n主照：${options?.photos?.[0] ?? '待補'}` },
    {
      page_number: 3,
      title: '產權調查建物',
      content: `登記坪數：${v(t?.fields.registered_area)}\n建築完成：${v(t?.additional.building_completion_date)}`,
    },
    {
      page_number: 4,
      title: '產權調查土地+他項',
      content: `他項權利（白話）：\n${encText}\n\nencumbrances：${v(t?.additional.encumbrances?.length)}`,
    },
    { page_number: 5, title: '建物現況', content: v(options?.field_visit_data?.['building_status'] ?? '待補') },
    {
      page_number: 6,
      title: '費用一覽+增值稅',
      content: merged.tax_result
        ? `土增稅(一般)：${merged.tax_result.land_value_increment_tax_general}\n土增稅(自用)：${merged.tax_result.land_value_increment_tax_self_use}\n來源：${merged.tax_result.source}`
        : '待補',
    },
    {
      page_number: 7,
      title: '成交行情+房貸',
      content: merged.mortgage_scenarios?.length
        ? merged.mortgage_scenarios
            .map((s) => `${(s.loan_ratio * 100).toFixed(0)}%：頭期款 ${Math.round(s.down_payment)}，月付 ${Math.round(s.monthly_payment)}`)
            .join('\n')
        : '待補',
    },
    {
      page_number: 8,
      title: '周邊機能+優劣勢',
      // 周邊行情章節 SHALL 引用業務人工填寫的 market_summary 與 market_research 附件。
      // 系統 SHALL NOT 自動產生此章節內容（避免 LLM 幻覺與第三方平臺資料抓取的法律風險）。
      content: buildNeighborhoodSection(
        options?.market_summary,
        options?.market_research_attachments
      ),
      attachments: options?.market_research_attachments?.length
        ? options.market_research_attachments
        : undefined,
    },
    { page_number: 9, title: '格局+照片索引', content: `照片數：${v(options?.photos?.length ?? '待補')}` },
    {
      page_number: 10,
      title: '謄本附件土地',
      content: t ? '待補（本案無土地謄本或未提供）' : '待補',
      attachments: t ? ['transcript_land'] : undefined,
    },
    {
      page_number: 11,
      title: '謄本附件建物',
      content: appendixBuilding || '待補',
      attachments: t ? ['transcript_building'] : undefined,
    },
    {
      page_number: 12,
      title: '地籍圖+使用分區',
      content: `使用分區：${v(t?.additional.land_use_zoning)}\n地籍圖：待補`,
      attachments: ['cadastral_map'],
    },
    { page_number: 13, title: '成交條件+告知+稅費', content: '待補' },
    {
      page_number: 14,
      title: '目錄+checkbox+簽章',
      content: '待補',
    },
  ];

  const toc_checkboxes: Record<string, boolean> = {
    謄本附件土地: Boolean(pages.find((p) => p.page_number === 10)?.attachments?.length),
    謄本附件建物: Boolean(pages.find((p) => p.page_number === 11)?.attachments?.length),
    地籍圖與使用分區: Boolean(pages.find((p) => p.page_number === 12)?.attachments?.length),
    周邊機能與優劣勢: Boolean(
      (options?.market_summary && options.market_summary.trim() !== '') ||
        options?.market_research_attachments?.length
    ),
  };

  return { pages, toc_checkboxes };
}

/**
 * 組合「周邊機能 + 優劣勢」章節內容。
 * 規則：
 *  - 有 market_summary → 渲染為「周邊行情摘要」段落
 *  - 有 market_research 附件 → 在摘要下方列出附件路徑
 *  - 兩者都沒有 → 顯示「待補」（與其他空章節一致）
 *  - 系統 SHALL NOT 自動產生此章節內容（避免幻覺與法律風險）
 */
function buildNeighborhoodSection(
  marketSummary: string | null | undefined,
  attachments: string[] | undefined
): string {
  const summary = marketSummary?.trim();
  const hasAttachments = attachments && attachments.length > 0;

  if (!summary && !hasAttachments) {
    return '待補';
  }

  const lines: string[] = [];
  if (summary) {
    lines.push('【周邊行情摘要】', summary);
  }
  if (hasAttachments) {
    if (lines.length > 0) lines.push('');
    lines.push('【附件】');
    attachments!.forEach((p, i) => lines.push(`${i + 1}. ${p}`));
  }
  return lines.join('\n');
}
