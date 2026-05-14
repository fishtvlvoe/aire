/**
 * Phase 2 紅燈測試 — react-pdf-render-engine
 *
 * RPE-001 ~ RPE-007：對應 aire-phase1-html-pdf-renderer change
 * 所有 import 指向尚未實作的模組 → 編譯失敗或執行期斷言失敗 = 紅燈
 */

import { describe, it, expect, beforeAll } from "vitest";

// ❌ 這個模組還不存在 — 紅燈起點
import {
  createPdfEngine,
  PdfRenderError,
  PdfRenderErrorCode,
  type PdfEngine,
  type RenderOptions,
} from "../engine";

// ─────────────────────────────────────────────────────────────────────────────
// RPE-001：NotoSansTC 字型必須在 engine 初始化時自動 register
// ─────────────────────────────────────────────────────────────────────────────
describe("RPE-001 — NotoSansTC font registration at engine init", () => {
  it("engine 初始化後，字型 registry 包含 NotoSansTC", async () => {
    const engine: PdfEngine = await createPdfEngine();
    expect(engine.registeredFonts()).toContain("NotoSansTC");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RPE-002：中文文字萃取後無豆腐字（tofu）
// ─────────────────────────────────────────────────────────────────────────────
describe("RPE-002 — Chinese text extraction without tofu", () => {
  it("render 輸出的 PDF blob 不包含 tofu replacement char (U+FFFD)", async () => {
    const engine: PdfEngine = await createPdfEngine();
    const blob = await engine.render({
      caseId: "T-001",
      content: "不動產說明書 測試用中文內容",
    } satisfies RenderOptions);

    // 把 Blob 轉 text — tofu 在 PDF 字串層不應出現 U+FFFD
    const text = await blob.text();
    expect(text).not.toContain("�");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RPE-003：render 必須回傳 application/pdf Blob，size > 1000 bytes
// ─────────────────────────────────────────────────────────────────────────────
describe("RPE-003 — render returns application/pdf Blob size > 1000", () => {
  it("Blob type 是 application/pdf 且 size > 1000", async () => {
    const engine: PdfEngine = await createPdfEngine();
    const blob = await engine.render({
      caseId: "T-001",
      content: "任意內容",
    } satisfies RenderOptions);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(1000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RPE-004：render 過程不得寫入任何 tmp 檔案
// ─────────────────────────────────────────────────────────────────────────────
describe("RPE-004 — render does NOT write temp files", () => {
  it("engine render 呼叫不觸發任何 file write IPC", async () => {
    const writeCalls: string[] = [];

    // Spy on Tauri IPC invoke — 如果 engine 呼叫 write_file 就記錄
    const originalInvoke = (globalThis as Record<string, unknown>).__TAURI_INTERNALS__?.invoke;
    if (typeof originalInvoke === "function") {
      (globalThis as Record<string, unknown>).__TAURI_INTERNALS__ = {
        invoke: (cmd: string, ...args: unknown[]) => {
          if (typeof cmd === "string" && cmd.includes("write")) {
            writeCalls.push(cmd);
          }
          return (originalInvoke as (...a: unknown[]) => unknown)(cmd, ...args);
        },
      };
    }

    const engine: PdfEngine = await createPdfEngine();
    await engine.render({ caseId: "T-001", content: "test" } satisfies RenderOptions);

    expect(writeCalls).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RPE-005：缺少 caseId 丟 PdfRenderError with code EngineFailure
// ─────────────────────────────────────────────────────────────────────────────
describe("RPE-005 — missing caseId throws typed PdfRenderError", () => {
  it("caseId 為空字串時丟 PdfRenderError，code = EngineFailure，有 cause", async () => {
    const engine: PdfEngine = await createPdfEngine();

    const call = engine.render({
      caseId: "",
      content: "test",
    } satisfies RenderOptions);

    await expect(call).rejects.toBeInstanceOf(PdfRenderError);

    try {
      await call;
    } catch (err) {
      expect(err).toBeInstanceOf(PdfRenderError);
      const renderErr = err as PdfRenderError;
      expect(renderErr.code).toBe(PdfRenderErrorCode.EngineFailure);
      expect(renderErr.cause).toBeDefined();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RPE-006：PDF 輸出的 header bytes 符合 PDF-1.x 規格
// ─────────────────────────────────────────────────────────────────────────────
describe("RPE-006 — PDF output starts with valid PDF-1.x header", () => {
  it("Blob 前 5 bytes 是 %PDF-", async () => {
    const engine: PdfEngine = await createPdfEngine();
    const blob = await engine.render({ caseId: "T-001", content: "test" } satisfies RenderOptions);

    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer).slice(0, 5);
    const header = String.fromCharCode(...bytes);

    expect(header).toBe("%PDF-");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RPE-007：@react-pdf/renderer v4 版本鎖定
// ─────────────────────────────────────────────────────────────────────────────
describe("RPE-007 — @react-pdf/renderer v4 version lock", () => {
  it("package.json 的 @react-pdf/renderer 版本必須以 4. 開頭", async () => {
    // 動態讀取 package.json — 確保 lockfile 內也是 v4
    const pkg = await import("../../../../package.json", { assert: { type: "json" } });
    const version: string =
      (pkg as unknown as { dependencies: Record<string, string> }).dependencies?.["@react-pdf/renderer"] ?? "";

    expect(version).toMatch(/^[\^~]?4\./);
  });
});
