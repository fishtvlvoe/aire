import { runCodex } from '@/lib/codex-client';
import type { PropertyDossier } from '@/lib/models/property-dossier';
import { buildDmBrochurePrompt, buildIgCarouselPrompt } from '@/lib/prompts/dm-brochure-prompt';
import { buildImagePrompt } from '@/lib/prompts/image-prompt-builder';

export interface DmBrochureResult {
  content: string; // Landing Page 5 區 Markdown
  ig_slides: string[]; // 7 張 IG 輪播圖文案
  quality_score: number; // 0-50
  image_prompts?: string[];
}

function ensureFiveZones(md: string): string {
  const zones = ['鉤子', '痛點', '解決方案', '強調', 'CTA'];
  const hasAll = zones.every((z) => md.includes(z));
  if (hasAll) return md;
  return [
    '## 鉤子\n待補',
    '## 痛點\n待補',
    '## 解決方案\n待補',
    '## 強調\n待補',
    '## CTA\n待補',
    '',
    md,
  ].join('\n');
}

function removeEmojiStacking(text: string): string {
  // replace 2+ consecutive pictographic characters with the first one
  return text.replace(/(\p{Extended_Pictographic})(\p{Extended_Pictographic}+)/gu, '$1');
}

function scoreQuality(content: string): number {
  let score = 0;
  const zones = ['鉤子', '痛點', '解決方案', '強調', 'CTA'];
  score += zones.filter((z) => content.includes(z)).length * 6;
  if (!/\p{Extended_Pictographic}{2,}/u.test(content)) score += 10;
  if (!content.includes('房價會漲') && !content.includes('投資必賺')) score += 10;
  return Math.max(0, Math.min(50, score));
}

function parseSlides(raw: string): string[] {
  try {
    const json = JSON.parse(raw.trim());
    if (Array.isArray(json)) return json.map(String);
  } catch {
    // ignore
  }
  // fallback: split lines
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function ensureSeven(slides: string[]): string[] {
  const s = slides.slice(0, 7);
  while (s.length < 7) s.push('待補');
  return s;
}

export async function generateDmBrochure(
  dossier: PropertyDossier,
  options?: { persona?: string }
): Promise<DmBrochureResult> {
  const dmPrompt = buildDmBrochurePrompt({ dossier, persona: options?.persona });
  const dmRes = await runCodex(dmPrompt);
  const rawContent = dmRes.success ? (dmRes.output ?? '待補') : '待補';

  const content = removeEmojiStacking(ensureFiveZones(rawContent));

  const igPrompt = buildIgCarouselPrompt(content);
  const igRes = await runCodex(igPrompt);
  const slides = ensureSeven(parseSlides(igRes.success ? (igRes.output ?? '') : ''));

  const image_prompts = [
    buildImagePrompt({ property_type: dossier.property_type, target_persona: options?.persona, scene: '外觀' }),
    buildImagePrompt({ property_type: dossier.property_type, target_persona: options?.persona, scene: '客廳' }),
    buildImagePrompt({ property_type: dossier.property_type, target_persona: options?.persona, scene: '社區' }),
  ];

  return {
    content,
    ig_slides: slides,
    quality_score: scoreQuality(content),
    image_prompts,
  };
}
