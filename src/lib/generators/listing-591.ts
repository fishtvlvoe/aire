import { runCodex } from '@/lib/codex-client';
import type { PropertyDossier } from '@/lib/models/property-dossier';
import type { TranscriptParseResult } from '@/lib/parsers/transcript-parser';
import { buildListing591Prompt } from '@/lib/prompts/listing-591-prompt';

const BANNED = ['房價會漲', '投資必賺', '漲幅', '增值保證'];

function stripBanned(text: string): string {
  let out = text;
  for (const w of BANNED) out = out.split(w).join('');
  return out;
}

function pendingIfMissing(dossier: PropertyDossier, text: string): string {
  const missing: string[] = [];
  if (!dossier.address?.trim()) missing.push('地址');
  if (!dossier.property_type?.trim()) missing.push('物件類型');
  if (!Number.isFinite(dossier.total_price)) missing.push('總價');
  if (missing.length === 0) return text;
  if (text.includes('待補')) return text;
  return `${text}\n\n---\n缺少欄位（待補）：${missing.join('、')}`;
}

export async function generateListing591(
  dossier: PropertyDossier,
  transcript?: TranscriptParseResult
): Promise<string> {
  // 1) merge transcript → dossier (best-effort)
  const merged: PropertyDossier = {
    ...dossier,
    ...(transcript?.fields ?? {}),
    transcript: transcript ?? dossier.transcript,
  };

  // 2+3) Layer2/3: parallel fetch
  const safeAddress = merged.address?.replace(/[\r\n]+/g, ' ').replace(/^\s*(SYSTEM|USER|ASSISTANT)\s*:/gim, '').trim() || '待補地址';
  const [facilityRes, futureRes] = await Promise.allSettled([
    runCodex(`SYSTEM: 你是地圖資料整理助理。\nUSER: 請列出「${safeAddress}」500m 內可能的生活機能設施（分類列點）。`),
    runCodex(`SYSTEM: 你是城市規劃資料整理助理。\nUSER: 請整理「${safeAddress}」周邊可能的交通建設/政府計畫（列點，若不確定請寫待補）。`),
  ]);
  const nearby_facilities = (facilityRes.status === 'fulfilled' && facilityRes.value.success ? facilityRes.value.output ?? '' : '').trim() || '待補';
  const future_development = (futureRes.status === 'fulfilled' && futureRes.value.success ? futureRes.value.output ?? '' : '').trim() || '待補';

  // 4) build prompt → LLM正文
  const prompt = buildListing591Prompt({ dossier: merged, nearby_facilities, future_development });
  const res = await runCodex(prompt);
  const raw = res.success ? (res.output ?? '待補') : '待補';

  // 5) post process
  const cleaned = stripBanned(raw);
  return pendingIfMissing(merged, cleaned);
}
