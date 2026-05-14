/**
 * Theme persistence
 *
 * PTS-006：setTheme persist + emit branding-changed event within 100ms
 * PTS-007：unknown theme fallback to theme-a-minimal + banner UI
 *
 * 儲存層：localStorage（瀏覽器環境）/ memory fallback（Node/測試環境）
 */

import { getTheme } from "./registry";

// ─────────────────────────────────────────────────────────────────────────────
// 常數
// ─────────────────────────────────────────────────────────────────────────────
export const BRANDING_CHANGED_EVENT = "branding-changed";
const STORAGE_KEY = "aire:theme-id";
const FALLBACK_THEME_ID = "theme-a-minimal";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface ThemePersistenceResult {
  success: boolean;
  themeId: string;
  didFallback: boolean;
  originalThemeId?: string;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 內部儲存（localStorage 優先，否則 memory fallback）
// ─────────────────────────────────────────────────────────────────────────────
let _memoryStore: string | null = null;

function _persist(themeId: string): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, themeId);
    }
  } catch {
    // 忽略 localStorage 不可用的情況
  }
  _memoryStore = themeId;
}

function _load(): string | null {
  try {
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return stored;
    }
  } catch {
    // 忽略
  }
  return _memoryStore;
}

// ─────────────────────────────────────────────────────────────────────────────
// 內部：emit branding-changed 事件
// ─────────────────────────────────────────────────────────────────────────────
function _emitBrandingChanged(
  themeId: string,
  fallback: boolean
): void {
  const detail = { themeId, fallback };
  const event = new CustomEvent(BRANDING_CHANGED_EVENT, { detail });
  if (typeof window !== "undefined") {
    window.dispatchEvent(event);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// setTheme — 持久化 + 發 event，<100ms
// ─────────────────────────────────────────────────────────────────────────────
export async function setTheme(
  requestedId: string
): Promise<ThemePersistenceResult> {
  const found = getTheme(requestedId);

  if (found) {
    _persist(requestedId);
    _emitBrandingChanged(requestedId, false);
    return {
      success: true,
      themeId: requestedId,
      didFallback: false,
    };
  }

  // 找不到 → fallback 到 theme-a-minimal
  const fallbackThemeId = FALLBACK_THEME_ID;
  _persist(fallbackThemeId);
  _emitBrandingChanged(fallbackThemeId, true);

  return {
    success: true,
    themeId: fallbackThemeId,
    didFallback: true,
    originalThemeId: requestedId,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// loadPersistedTheme — 讀取持久化的 theme id
// ─────────────────────────────────────────────────────────────────────────────
export async function loadPersistedTheme(): Promise<string | null> {
  return _load();
}
