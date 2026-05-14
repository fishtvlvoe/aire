/**
 * pdf-theme registry
 *
 * Module-scope Map<string, PdfTheme>
 * - registerTheme: idempotent（同 id 覆蓋，不重複新增）
 * - getTheme: returns undefined for unknown id
 * - listThemes: returns all registered themes
 * - resolveThemeOrFallback: 給 caller 做 fallback 判斷
 */

import type { PdfTheme } from "./types";
export type { PdfTheme, ThemeTokens } from "./types";
export { ThemeError, ThemeErrorCode } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// 內部 registry
// ─────────────────────────────────────────────────────────────────────────────
const _registry = new Map<string, PdfTheme>();

// ─────────────────────────────────────────────────────────────────────────────
// 純函式 API
// ─────────────────────────────────────────────────────────────────────────────

/** 注冊主題（同 id 覆蓋，不重複新增）*/
export function registerTheme(theme: PdfTheme): void {
  _registry.set(theme.id, theme);
}

/** 取得主題（未知 id 回傳 undefined）*/
export function getTheme(id: string): PdfTheme | undefined {
  return _registry.get(id);
}

/** 列出所有已注冊主題 */
export function listThemes(): PdfTheme[] {
  return Array.from(_registry.values());
}

// ─────────────────────────────────────────────────────────────────────────────
// resolveThemeOrFallback — 給 PdfPreviewer / document.tsx 用
// ─────────────────────────────────────────────────────────────────────────────
export interface ThemeResolution {
  theme: PdfTheme;
  fellBack: boolean;
  requestedId: string;
}

export function resolveThemeOrFallback(id: string): ThemeResolution {
  const found = getTheme(id);
  if (found) {
    return { theme: found, fellBack: false, requestedId: id };
  }
  // fallback 到 theme-a-minimal
  console.warn(
    `[pdf-themes] 找不到主題 "${id}"，降回 theme-a-minimal。`
  );
  const fallback = getTheme("theme-a-minimal")!;
  return { theme: fallback, fellBack: true, requestedId: id };
}

// ─────────────────────────────────────────────────────────────────────────────
// 模組載入時注冊兩個內建主題
// 測試 PTS-001 expects: theme-a-minimal + theme-b-professional
// ─────────────────────────────────────────────────────────────────────────────
import { themeAMinimal } from "./theme-a-minimal";
import { themeBProfessional } from "./theme-b-professional";

registerTheme(themeAMinimal);
registerTheme(themeBProfessional);
