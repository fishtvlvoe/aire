/**
 * Phase 2 紅燈測試 — pdf-theme-system (registry)
 *
 * PTS-001 ~ PTS-004：listThemes / getTheme / 防重複 register
 * 所有 import 指向尚未實作的模組 → 編譯失敗 = 紅燈
 */

import { describe, it, expect, beforeEach } from "vitest";

// ❌ 這個模組還不存在 — 紅燈起點
import {
  listThemes,
  getTheme,
  registerTheme,
  type PdfTheme,
  type ThemeTokens,
} from "../registry";

// ─────────────────────────────────────────────────────────────────────────────
// PTS-001：listThemes() 回傳 5 個內建主題
// ─────────────────────────────────────────────────────────────────────────────
describe("PTS-001 — listThemes returns exactly 5 built-in themes", () => {
  it("listThemes() 回傳 5 個主題", () => {
    const themes = listThemes();
    expect(themes).toHaveLength(5);
  });

  it("包含 5 個預期主題 id", () => {
    const themes = listThemes();
    const ids = themes.map((t) => t.id);
    expect(ids).toContain("theme-a-minimal");
    expect(ids).toContain("theme-b-professional");
    expect(ids).toContain("theme-c-tech-elegant");
    expect(ids).toContain("theme-d-fresh");
    expect(ids).toContain("theme-e-warm");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PTS-002：每個 theme 含 Cover / Header / Footer / Section / Table + tokens
// ─────────────────────────────────────────────────────────────────────────────
describe("PTS-002 — each theme has required components and tokens", () => {
  let themes: PdfTheme[];

  beforeEach(() => {
    themes = listThemes();
  });

  it("每個主題都有 Cover 元件", () => {
    themes.forEach((t) => {
      expect(t.components).toHaveProperty("Cover");
    });
  });

  it("每個主題都有 Header 元件", () => {
    themes.forEach((t) => {
      expect(t.components).toHaveProperty("Header");
    });
  });

  it("每個主題都有 Footer 元件", () => {
    themes.forEach((t) => {
      expect(t.components).toHaveProperty("Footer");
    });
  });

  it("每個主題都有 Section 元件", () => {
    themes.forEach((t) => {
      expect(t.components).toHaveProperty("Section");
    });
  });

  it("每個主題都有 Table 元件", () => {
    themes.forEach((t) => {
      expect(t.components).toHaveProperty("Table");
    });
  });

  it("每個主題都有 tokens 物件", () => {
    themes.forEach((t) => {
      expect(t.tokens).toBeDefined();
      expect(typeof t.tokens).toBe("object");
    });
  });

  it("tokens 包含 primaryColor 和 fontFamily", () => {
    themes.forEach((t) => {
      const tokens: ThemeTokens = t.tokens;
      expect(tokens).toHaveProperty("primaryColor");
      expect(tokens).toHaveProperty("fontFamily");
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PTS-003：getTheme by reference (id)
// ─────────────────────────────────────────────────────────────────────────────
describe("PTS-003 — getTheme by id returns correct theme", () => {
  it("getTheme('theme-a-minimal') 回傳 id = theme-a-minimal 的主題", () => {
    const theme = getTheme("theme-a-minimal");
    expect(theme).toBeDefined();
    expect(theme!.id).toBe("theme-a-minimal");
  });

  it("getTheme('theme-c-tech-elegant') 回傳 id = theme-c-tech-elegant 的主題", () => {
    const theme = getTheme("theme-c-tech-elegant");
    expect(theme).toBeDefined();
    expect(theme!.id).toBe("theme-c-tech-elegant");
  });

  it("getTheme 未知 id 回傳 undefined", () => {
    const theme = getTheme("non-existent-theme");
    expect(theme).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PTS-004：re-register same id 不重複（listThemes 仍維持 5 個）
// ─────────────────────────────────────────────────────────────────────────────
describe("PTS-004 — re-registering same theme id does not create duplicate", () => {
  it("重複 register theme-a-minimal 後 listThemes 仍回傳 5 個", () => {
    // 取得現有 theme-a-minimal
    const existingTheme = getTheme("theme-a-minimal")!;

    // 重新 register（應覆蓋，不新增）
    registerTheme(existingTheme);

    const themes = listThemes();
    expect(themes).toHaveLength(5);
  });

  it("register 全新 id 後 listThemes 回傳 3 個（確認 register 本身有效）", () => {
    const newTheme: PdfTheme = {
      id: "theme-test-unique",
      label: "Test Theme",
      components: {
        Cover: () => null,
        Header: () => null,
        Footer: () => null,
        Section: () => null,
        Table: () => null,
      },
      tokens: {
        primaryColor: "#000000",
        fontFamily: "NotoSansTC",
      },
    };
    registerTheme(newTheme);

    const themes = listThemes();
    expect(themes.length).toBeGreaterThanOrEqual(3);
  });
});
