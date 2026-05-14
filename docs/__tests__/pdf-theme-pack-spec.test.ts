/**
 * Phase 2 紅燈測試 — PTS-008
 *
 * docs/pdf-theme-pack-spec.md 必須包含 5 個必要 headings
 * 檔案還不存在 → 測試失敗 = 紅燈
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const SPEC_FILE = resolve(__dirname, "../../pdf-theme-pack-spec.md");

const REQUIRED_HEADINGS = [
  "Theme Pack 結構",
  "必要元件",
  "Token 規格",
  "發布格式",
  "版本管理",
];

// ─────────────────────────────────────────────────────────────────────────────
// PTS-008：docs/pdf-theme-pack-spec.md 5 個必要 headings
// ─────────────────────────────────────────────────────────────────────────────
describe("PTS-008 — docs/pdf-theme-pack-spec.md has 5 required headings", () => {
  it("docs/pdf-theme-pack-spec.md 檔案存在", () => {
    expect(existsSync(SPEC_FILE)).toBe(true);
  });

  REQUIRED_HEADINGS.forEach((heading) => {
    it(`包含 heading: "${heading}"`, () => {
      if (!existsSync(SPEC_FILE)) {
        throw new Error(`docs/pdf-theme-pack-spec.md 不存在 — Phase 3 才需建立`);
      }

      const content = readFileSync(SPEC_FILE, "utf-8");
      // 支援 # / ## / ### heading 格式
      expect(content).toMatch(new RegExp(`#+\\s*${heading}`, "m"));
    });
  });

  it("共有至少 5 個 heading", () => {
    if (!existsSync(SPEC_FILE)) {
      throw new Error(`docs/pdf-theme-pack-spec.md 不存在 — Phase 3 才需建立`);
    }

    const content = readFileSync(SPEC_FILE, "utf-8");
    const headings = content.match(/^#{1,6}\s+.+/gm);
    expect(headings?.length).toBeGreaterThanOrEqual(5);
  });
});
