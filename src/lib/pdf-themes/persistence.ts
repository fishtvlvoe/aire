/**
 * Theme persistence
 *
 * PTS-006：setTheme persist + emit branding-changed event within 100ms
 * PTS-007：unknown theme fallback to theme-a-minimal + banner UI
 *
 * 儲存層：localStorage（瀏覽器環境）/ memory fallback（Node/測試環境）
 */

import { getTheme } from "./registry";
import { safeInvoke } from "@/lib/tauri-bridge";

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
  const resolvedThemeId = found ? requestedId : FALLBACK_THEME_ID;
  const didFallback = !found;

  try {
    // 優先走 Tauri IPC（set_theme），確保 branding.theme_id 寫回 SQLite
    await safeInvoke("set_theme", {
      theme_id: resolvedThemeId,
      themeId: resolvedThemeId,
    });
  } catch {
    // 非 Tauri / mock 或 IPC 失敗時，仍允許前端 fallback 持續運作
  }

  _persist(resolvedThemeId);
  _emitBrandingChanged(resolvedThemeId, didFallback);

  return {
    success: true,
    themeId: resolvedThemeId,
    didFallback,
    originalThemeId: didFallback ? requestedId : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// loadPersistedTheme — 讀取持久化的 theme id
// ─────────────────────────────────────────────────────────────────────────────
export async function loadPersistedTheme(): Promise<string | null> {
  try {
    const themeId = await safeInvoke<string>("get_theme");
    if (themeId) {
      _persist(themeId);
      return themeId;
    }
  } catch {
    // 回退 localStorage / memory
  }
  return _load();
}
