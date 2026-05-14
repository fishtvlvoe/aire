/**
 * Phase 2 紅燈測試 — RPE-002 no-tofu sample
 *
 * 產生一個含中文的 sample PDF，驗證字型嵌入正確（無 tofu 字）
 * import 指向尚未實作的 engine 模組 → 編譯失敗 = 紅燈
 */

import { describe, it, expect } from "vitest";

// ❌ 這個模組還不存在 — 紅燈起點
import { createPdfEngine, type RenderOptions } from "../../src/lib/pdf-engine/engine";

// 常見繁體中文字（涵蓋多個 Unicode 區段）
const CHINESE_SAMPLE_TEXT = [
  "不動產說明書",
  "土地登記謄本",
  "建物測量成果圖",
  "使用執照存根",
  "台北市信義區忠孝東路五段一號",
  "繳款金額：新台幣壹百萬元整",
  "簽約日期：民國一百一十五年五月十四日",
  "土地面積：一百二十三點四五平方公尺",
  "權利範圍：全部",
  "管理費：每月新台幣三千元",
].join("\n");

// ─────────────────────────────────────────────────────────────────────────────
// RPE-002（補充）：no-tofu sample 文件
// ─────────────────────────────────────────────────────────────────────────────
describe("RPE-002 — no-tofu sample: Chinese text renders without replacement characters", () => {
  it("含繁體中文的 PDF Blob 不含 U+FFFD tofu char", async () => {
    const engine = await createPdfEngine();

    const blob = await engine.render({
      caseId: "SAMPLE-ZH",
      content: CHINESE_SAMPLE_TEXT,
    } satisfies RenderOptions);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(1000);

    // PDF 文字層不應有 replacement char
    const text = await blob.text();
    expect(text).not.toContain("�");
    expect(text).not.toContain("&#xFFFD;");
  });

  it("blob size > 1000 表示字型已嵌入（空 PDF 通常 < 500 bytes）", async () => {
    const engine = await createPdfEngine();

    const blob = await engine.render({
      caseId: "SAMPLE-ZH-SIZE",
      content: "測試字型嵌入",
    } satisfies RenderOptions);

    // 有嵌入字型的 PDF 明顯比純空 PDF 大
    expect(blob.size).toBeGreaterThan(1000);
  });

  it("NotoSansTC 字型在 engine init 後已 register", async () => {
    const engine = await createPdfEngine();
    const fonts = engine.registeredFonts();
    expect(fonts).toContain("NotoSansTC");
  });
});
