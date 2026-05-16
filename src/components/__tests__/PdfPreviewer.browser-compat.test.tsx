import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

describe("PdfPreviewer browser compatibility", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("renders in browser mode even when Tauri modules are unavailable at import time", async () => {
    vi.doMock("@tauri-apps/api/core", () => {
      throw new Error("Tauri core unavailable");
    });
    vi.doMock("@tauri-apps/plugin-dialog", () => {
      throw new Error("Tauri dialog unavailable");
    });
    vi.doMock("@/lib/pdf-engine/engine", () => ({
      createPdfEngine: vi.fn().mockResolvedValue({
        render: vi
          .fn()
          .mockResolvedValue(new Blob(["%PDF-1.4 browser"], { type: "application/pdf" })),
      }),
    }));

    const { PdfPreviewer } = await import("../PdfPreviewer");

    render(<PdfPreviewer caseId="CASE-001" content="測試內容" />);

    await waitFor(() => {
      expect(screen.getByTestId("pdf-iframe")).toBeInTheDocument();
    });
  });
});
