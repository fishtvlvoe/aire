import { runCodex } from '@/lib/codex-client';
import type { PropertyDossier } from '@/lib/models/property-dossier';
import type { PlatformStrategy, PlatformStrategySummary } from '@/lib/trackers/algorithm-tracker';
import { AlgorithmTracker } from '@/lib/trackers/algorithm-tracker';
import {
  buildFacebookPrompt,
  buildInstagramPrompt,
  buildThreadsPrompt,
  buildTiktokPrompt,
  buildYoutubePrompt,
} from '@/lib/prompts/social-media-prompt';
import { buildImagePrompt } from '@/lib/prompts/image-prompt-builder';
export interface SocialMediaResult {
  facebook: { content: string; image_prompts: string[] };
  instagram: { reels_script: string; slides: string[]; image_prompts: string[] };
  threads: { content: string };
  tiktok: { script: string; image_prompts: string[] };
  youtube: { title: string; outline: string };
}

const BANNED = ['房價會漲', '投資必賺', '漲幅', '增值保證'];

function stripBanned(text: string): string {
  let out = text;
  for (const w of BANNED) out = out.split(w).join('');
  return out;
}

function pickStrategy(summary: PlatformStrategySummary | null, platform: PlatformStrategy['platform']): PlatformStrategy | undefined {
  return summary?.platforms.find((p) => p.platform === platform);
}

export async function generateSocialMedia(
  dossier: PropertyDossier,
  options?: { strategy?: PlatformStrategySummary; ig_slides?: string[] }
): Promise<SocialMediaResult> {
  const tracker = new AlgorithmTracker();
  const summary = options?.strategy ?? tracker.getLatestSummary();

  const [fb, ig, th, tk, yt] = await Promise.all([
    runCodex(buildFacebookPrompt(dossier, { strategy: pickStrategy(summary, 'facebook') })),
    runCodex(buildInstagramPrompt(dossier, { strategy: pickStrategy(summary, 'instagram') })),
    runCodex(buildThreadsPrompt(dossier, { strategy: pickStrategy(summary, 'threads') })),
    runCodex(buildTiktokPrompt(dossier, { strategy: pickStrategy(summary, 'tiktok') })),
    runCodex(buildYoutubePrompt(dossier, { strategy: pickStrategy(summary, 'youtube') })),
  ]);

  const fbText = stripBanned(fb.success ? (fb.output ?? '待補') : '待補');
  const igReels = stripBanned(ig.success ? (ig.output ?? '待補') : '待補');
  const thText = stripBanned(th.success ? (th.output ?? '待補') : '待補');
  const tkScript = stripBanned(tk.success ? (tk.output ?? '待補') : '待補');
  const ytRaw = stripBanned(yt.success ? (yt.output ?? '待補') : '待補');

  const slides: string[] = options?.ig_slides ?? Array(7).fill('待補');

  const [ytTitle, ...ytOutlineLines] = ytRaw.split(/\r?\n/);

  return {
    facebook: {
      content: fbText,
      image_prompts: [
        buildImagePrompt({ property_type: dossier.property_type, scene: '外觀' }),
        buildImagePrompt({ property_type: dossier.property_type, scene: '客廳' }),
      ],
    },
    instagram: {
      reels_script: igReels,
      slides,
      image_prompts: [
        buildImagePrompt({ property_type: dossier.property_type, scene: '社區' }),
        buildImagePrompt({ property_type: dossier.property_type, scene: '生活機能' }),
      ],
    },
    threads: {
      content: thText,
    },
    tiktok: {
      script: tkScript,
      image_prompts: [
        buildImagePrompt({ property_type: dossier.property_type, scene: '外觀' }),
        buildImagePrompt({ property_type: dossier.property_type, scene: '街景' }),
      ],
    },
    youtube: {
      title: ytTitle || '待補',
      outline: ytOutlineLines.join('\n').trim() || '待補',
    },
  };
}
