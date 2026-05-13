'use client';

const CACHE_KEY = 'license_features_cache';

export type Features = string[];

/** 啟動時從 license server 同步功能列表，存入 sessionStorage */
export async function syncFeatures(): Promise<Features> {
  try {
    const res = await fetch('/api/license/features', { cache: 'no-store' });
    if (!res.ok) return getLocalFeatures();
    const data = (await res.json()) as { features: Features };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data.features));
    return data.features;
  } catch {
    return getLocalFeatures();
  }
}

export function getLocalFeatures(): Features {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Features) : [];
  } catch {
    return [];
  }
}

export function hasFeature(features: Features, key: string): boolean {
  // 開發模式允許所有功能
  if (process.env.NEXT_PUBLIC_APP_MODE !== 'production') return true;
  return features.includes(key);
}
