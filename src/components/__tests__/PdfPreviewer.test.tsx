/**
 * Phase 2 紅燈測試 — pdf-live-preview
 *
 * PLP-001 ~ PLP-009：PdfPreviewer 元件完整測試
 * 所有 import 指向尚未實作的模組 → 編譯失敗 = 紅燈
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

// ❌ 這個元件還不存在 — 紅燈起點
import { PdfPreviewer } from "../PdfPreviewer";
import { BRANDING_CHANGED_EVENT } from "../../lib/pdf-themes/persistence";

// Mock pdf-engine
vi.mock("../../lib/pdf-engine/engine", () => ({
  createPdfEngine: vi.fn(),
}));
import { createPdfEngine } from "../../lib/pdf-engine/engine";
const mockCreateEngine = vi.mocked(createPdfEngine);

// Mock Tauri IPC（下載用）
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));
vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: vi.fn(),
}));
import { invoke } from "@tauri-apps/api/core";
import { save as saveDialog } from "@tauri-apps/plugin-dialog";
const mockInvoke = vi.mocked(invoke);
const mockSaveDialog = vi.mocked(saveDialog);

// Helper：建立 fake PDF Blob
function makePdfBlob(pages = 1): Blob {
  const header = `%PDF-1.4 fake-${pages}pages`;
  return new Blob([header], { type: "application/pdf" });
}

// Helper：建立 mock engine
function makeMockEngine(blobOrError: Blob | Error) {
  return {
    render: vi.fn().mockImplementation(() => {
      if (blobOrError instanceof Error) return Promise.reject(blobOrError);
      return Promise.resolve(blobOrError);
    }),
    registeredFonts: vi.fn().mockReturnValue(["NotoSansTC"]),
  };
}

// PdfPreviewer 預設 props
const defaultProps = {
  caseId: "T-001",
  content: "測試內容",
};

// ─────────────────────────────────────────────────────────────────────────────
// PLP-001：不寫 temp file
// ─────────────────────────────────────────────────────────────────────────────
describe("PLP-001 — PdfPreviewer does not write temp files", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
    mockCreateEngine.mockResolvedValue(makeMockEngine(makePdfBlob(10)) as never);
  });

  it("預覽 PDF 期間不呼叫任何 write_file IPC", async () => {
    render(<PdfPreviewer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("pdf-iframe")).toBeInTheDocument();
    });

    const writeCall = mockInvoke.mock.calls.find(([cmd]) =>
      typeof cmd === "string" && cmd.includes("write"),
    );
    expect(writeCall).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PLP-002：Object URL 在元件 unmount 時 revoke
// ─────────────────────────────────────────────────────────────────────────────
describe("PLP-002 — Object URL is revoked on unmount", () => {
  it("unmount 後 URL.revokeObjectURL 被呼叫", async () => {
    const revokedUrls: string[] = [];
    const originalRevoke = URL.revokeObjectURL;
    URL.revokeObjectURL = (url) => revokedUrls.push(url);

    mockCreateEngine.mockResolvedValue(makeMockEngine(makePdfBlob()) as never);

    const { unmount } = render(<PdfPreviewer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("pdf-iframe")).toBeInTheDocument();
    });

    unmount();

    expect(revokedUrls.length).toBeGreaterThan(0);

    URL.revokeObjectURL = originalRevoke;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PLP-003：10 頁 PDF 渲染 < 3000ms
// ─────────────────────────────────────────────────────────────────────────────
describe("PLP-003 — 10-page PDF renders in under 3000ms", () => {
  it("從 render 到顯示 iframe 不超過 3000ms", async () => {
    mockCreateEngine.mockResolvedValue(makeMockEngine(makePdfBlob(10)) as never);

    const start = performance.now();
    render(<PdfPreviewer {...defaultProps} />);

    await waitFor(
      () => {
        expect(screen.getByTestId("pdf-iframe")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(3000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PLP-004：loading spinner 顯示「PDF 產生中…」
// ─────────────────────────────────────────────────────────────────────────────
describe("PLP-004 — shows loading spinner with 'PDF 產生中…' text", () => {
  it("初始渲染時顯示 loading spinner", () => {
    // 讓 engine 永遠 pending
    mockCreateEngine.mockReturnValue(new Promise(() => {}) as never);

    render(<PdfPreviewer {...defaultProps} />);

    expect(screen.getByTestId("pdf-loading-spinner")).toBeInTheDocument();
    expect(screen.getByText("PDF 產生中…")).toBeInTheDocument();
  });

  it("PDF 產生完成後 loading spinner 消失", async () => {
    mockCreateEngine.mockResolvedValue(makeMockEngine(makePdfBlob()) as never);

    render(<PdfPreviewer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.queryByTestId("pdf-loading-spinner")).toBeNull();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PLP-005：download 寫 blob 到用戶選擇的路徑
// ─────────────────────────────────────────────────────────────────────────────
describe("PLP-005 — download writes blob to chosen path", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
    mockSaveDialog.mockResolvedValue("/tmp/test-output.pdf");
    mockInvoke.mockResolvedValue(undefined);
    mockCreateEngine.mockResolvedValue(makeMockEngine(makePdfBlob()) as never);
  });

  it("點擊下載後呼叫 save dialog 選路徑", async () => {
    render(<PdfPreviewer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("pdf-download-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("pdf-download-btn"));

    await waitFor(() => {
      expect(mockSaveDialog).toHaveBeenCalledTimes(1);
    });
  });

  it("選路徑後呼叫 write_file IPC", async () => {
    render(<PdfPreviewer {...defaultProps} />);

    await waitFor(() => screen.getByTestId("pdf-download-btn"));
    fireEvent.click(screen.getByTestId("pdf-download-btn"));

    await waitFor(() => {
      const writeCall = mockInvoke.mock.calls.find(([cmd]) =>
        typeof cmd === "string" && cmd.includes("write"),
      );
      expect(writeCall).toBeDefined();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PLP-006：download 取消後不寫檔
// ─────────────────────────────────────────────────────────────────────────────
describe("PLP-006 — cancelled download does not write file", () => {
  it("save dialog 回傳 null（取消）後不呼叫 write IPC", async () => {
    mockInvoke.mockReset();
    mockSaveDialog.mockResolvedValue(null); // 用戶取消
    mockCreateEngine.mockResolvedValue(makeMockEngine(makePdfBlob()) as never);

    render(<PdfPreviewer {...defaultProps} />);

    await waitFor(() => screen.getByTestId("pdf-download-btn"));
    fireEvent.click(screen.getByTestId("pdf-download-btn"));

    await waitFor(() => {
      expect(mockSaveDialog).toHaveBeenCalled();
    });

    const writeCall = mockInvoke.mock.calls.find(([cmd]) =>
      typeof cmd === "string" && cmd.includes("write"),
    );
    expect(writeCall).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PLP-007：branding-changed event 觸發 re-render（防 stale closure）
// ─────────────────────────────────────────────────────────────────────────────
describe("PLP-007 — branding-changed event triggers re-render without stale closure", () => {
  it("dispatch branding-changed 後 engine.render 以新 themeId 重新呼叫", async () => {
    const engine = makeMockEngine(makePdfBlob());
    mockCreateEngine.mockResolvedValue(engine as never);

    render(<PdfPreviewer {...defaultProps} />);

    // 等第一次渲染完成
    await waitFor(() => screen.getByTestId("pdf-iframe"));

    const firstCallCount = engine.render.mock.calls.length;

    // 觸發 branding-changed
    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(BRANDING_CHANGED_EVENT, {
          detail: { themeId: "theme-b-professional" },
        }),
      );
    });

    await waitFor(() => {
      expect(engine.render.mock.calls.length).toBeGreaterThan(firstCallCount);
    });

    // 最新呼叫應包含新的 themeId（不是 stale 的舊值）
    const lastCall = engine.render.mock.calls[engine.render.mock.calls.length - 1][0];
    expect(lastCall).toMatchObject({ themeId: "theme-b-professional" });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PLP-008：engine failure 顯示 retry UI + console.error
// ─────────────────────────────────────────────────────────────────────────────
describe("PLP-008 — engine failure shows retry UI and logs console.error", () => {
  it("engine render 失敗時顯示 retry UI", async () => {
    const error = new Error("engine crashed");
    mockCreateEngine.mockResolvedValue(makeMockEngine(error) as never);

    render(<PdfPreviewer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("pdf-error-retry")).toBeInTheDocument();
    });
  });

  it("engine render 失敗時呼叫 console.error", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("engine crashed");
    mockCreateEngine.mockResolvedValue(makeMockEngine(error) as never);

    render(<PdfPreviewer {...defaultProps} />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PLP-009：retry 按鈕用相同 args 重新呼叫 engine.render
// ─────────────────────────────────────────────────────────────────────────────
describe("PLP-009 — retry button reinvokes engine.render with same args", () => {
  it("點擊 retry 後 engine.render 以相同 caseId + content 再次呼叫", async () => {
    const error = new Error("transient error");
    const engine = makeMockEngine(error);
    mockCreateEngine.mockResolvedValue(engine as never);

    // suppress console.error noise
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<PdfPreviewer {...defaultProps} />);

    await waitFor(() => screen.getByTestId("pdf-error-retry"));

    const callsBefore = engine.render.mock.calls.length;

    fireEvent.click(screen.getByTestId("pdf-error-retry"));

    await waitFor(() => {
      expect(engine.render.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    // 所有呼叫的 args 相同
    const allCalls = engine.render.mock.calls;
    const firstArgs = allCalls[0][0];
    const lastArgs = allCalls[allCalls.length - 1][0];
    expect(lastArgs).toMatchObject(firstArgs);
  });
});
