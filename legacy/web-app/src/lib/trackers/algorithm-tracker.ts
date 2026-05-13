import { runCodex } from '@/lib/codex-client';

export interface PlatformStrategy {
  platform: 'facebook' | 'instagram' | 'threads' | 'tiktok' | 'youtube';
  hashtag_count: number;
  optimal_length: string; // e.g. '300-500字'
  content_format: string; // e.g. '長文+圖片'
  cta_style: string;
  algorithm_focus: string;
  updated_at: Date;
}

export interface PlatformStrategySummary {
  platforms: PlatformStrategy[];
  changed: boolean;
  staleness?: boolean;
  surveyed_at: Date;
}

let latestSummary: PlatformStrategySummary | null = null;
let latestFingerprint: string | null = null;

export function resetTrackerState(): void {
  latestSummary = null;
  latestFingerprint = null;
}

function extractJson(text: string): any {
  const trimmed = text.trim();

  // ```json ... ```
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) {
    return JSON.parse(fenced[1]);
  }

  return JSON.parse(trimmed);
}

function fingerprint(platforms: Array<Omit<PlatformStrategy, 'updated_at'>>): string {
  const normalized = [...platforms]
    .map((p) => ({
      platform: p.platform,
      hashtag_count: p.hashtag_count,
      optimal_length: p.optimal_length,
      content_format: p.content_format,
      cta_style: p.cta_style,
      algorithm_focus: p.algorithm_focus,
    }))
    .sort((a, b) => a.platform.localeCompare(b.platform));
  return JSON.stringify(normalized);
}

function buildSurveyPrompt(): string {
  return [
    'SYSTEM: 你是社群平台演算法研究助理。請務必以 JSON 回覆，不要加上多餘文字。',
    'USER: 請針對以下 5 個平台，給出最新的內容策略偏好（以台灣房仲/不動產內容為例）。',
    '平台：facebook / instagram / threads / tiktok / youtube',
    '',
    '回覆 JSON 格式：',
    '{',
    '  "platforms": [',
    '    {',
    '      "platform": "facebook",',
    '      "hashtag_count": 5,',
    '      "optimal_length": "300-500字",',
    '      "content_format": "長文+圖片",',
    '      "cta_style": "私訊/留言",',
    '      "algorithm_focus": "互動/停留"',
    '    }',
    '  ]',
    '}',
  ].join('\n');
}

export class AlgorithmTracker {
  async survey(): Promise<PlatformStrategySummary> {
    const surveyed_at = new Date();

    try {
      const res = await runCodex(buildSurveyPrompt());
      if (!res.success) throw new Error(res.error || 'LLM failed');

      const raw = extractJson(res.output ?? '');
      const now = new Date();
      const platforms = (raw?.platforms ?? []).map((p: any) => ({
        platform: p.platform,
        hashtag_count: Number(p.hashtag_count ?? 0),
        optimal_length: String(p.optimal_length ?? ''),
        content_format: String(p.content_format ?? ''),
        cta_style: String(p.cta_style ?? ''),
        algorithm_focus: String(p.algorithm_focus ?? ''),
        updated_at: now,
      })) as PlatformStrategy[];

      const fp = fingerprint(platforms.map(({ updated_at, ...rest }) => rest));
      const changed = latestFingerprint !== null && fp !== latestFingerprint;

      const summary: PlatformStrategySummary = {
        platforms,
        changed,
        surveyed_at,
      };

      latestSummary = summary;
      latestFingerprint = fp;
      return summary;
    } catch {
      if (latestSummary) {
        return {
          ...latestSummary,
          changed: false,
          staleness: true,
          surveyed_at,
        };
      }

      return {
        platforms: [],
        changed: false,
        staleness: true,
        surveyed_at,
      };
    }
  }

  getLatestSummary(): PlatformStrategySummary | null {
    return latestSummary;
  }
}
