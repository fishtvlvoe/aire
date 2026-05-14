/**
 * Phase 2 紅燈測試 — pdf-theme-system (persistence)
 *
 * PTS-006：set_theme persist + emit branding-changed event within 100ms
 * PTS-007：unknown theme fallback to theme-a-minimal + banner UI
 * 所有 import 指向尚未實作的模組 → 編譯失敗 = 紅燈
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ❌ 這些模組還不存在 — 紅燈起點
import {
  setTheme,
  loadPersistedTheme,
  BRANDING_CHANGED_EVENT,
  type ThemePersistenceResult,
} from "../persistence";
import { getTheme } from "../registry";

// ─────────────────────────────────────────────────────────────────────────────
// PTS-006：set_theme persist + emit branding-changed event within 100ms
// ─────────────────────────────────────────────────────────────────────────────
describe("PTS-006 — setTheme persists and emits branding-changed within 100ms", () => {
  beforeEach(() => {
    // 清除任何殘留的 event listeners
    vi.restoreAllMocks();
  });

  it("setTheme 回傳成功的 persistence result", async () => {
    const result: ThemePersistenceResult = await setTheme("theme-a-minimal");
    expect(result.success).toBe(true);
    expect(result.themeId).toBe("theme-a-minimal");
  });

  it("setTheme 在 100ms 內 emit branding-changed 事件", async () => {
    const received: CustomEvent[] = [];
    const handler = (e: Event) => received.push(e as CustomEvent);

    window.addEventListener(BRANDING_CHANGED_EVENT, handler);

    const start = performance.now();
    await setTheme("theme-b-professional");
    const elapsed = performance.now() - start;

    window.removeEventListener(BRANDING_CHANGED_EVENT, handler);

    expect(received).toHaveLength(1);
    expect(received[0].detail).toMatchObject({ themeId: "theme-b-professional" });
    expect(elapsed).toBeLessThan(100);
  });

  it("設定後 loadPersistedTheme 回傳同一個 themeId", async () => {
    await setTheme("theme-a-minimal");
    const persisted = await loadPersistedTheme();
    expect(persisted).toBe("theme-a-minimal");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PTS-007：unknown theme fallback to theme-a-minimal + banner UI
// ─────────────────────────────────────────────────────────────────────────────
describe("PTS-007 — unknown theme ID falls back to theme-a-minimal", () => {
  it("setTheme 傳入不存在的 id 時 fallback 到 theme-a-minimal", async () => {
    const result: ThemePersistenceResult = await setTheme("totally-unknown-theme-xyz");
    // 應該 fallback，不是丟 error
    expect(result.success).toBe(true);
    expect(result.themeId).toBe("theme-a-minimal");
    expect(result.didFallback).toBe(true);
  });

  it("fallback 時 result.originalThemeId 記錄原始傳入的 id", async () => {
    const result = await setTheme("totally-unknown-theme-xyz");
    expect(result.originalThemeId).toBe("totally-unknown-theme-xyz");
  });

  it("fallback 後 emit 的 branding-changed 事件包含 fallback=true flag", async () => {
    const events: CustomEvent[] = [];
    window.addEventListener(BRANDING_CHANGED_EVENT, (e) => events.push(e as CustomEvent));

    await setTheme("invalid-id");

    window.removeEventListener(BRANDING_CHANGED_EVENT, () => {});

    const lastEvent = events[events.length - 1];
    expect(lastEvent?.detail?.fallback).toBe(true);
  });
});
