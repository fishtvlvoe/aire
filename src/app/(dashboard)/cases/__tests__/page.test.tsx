import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("@/lib/cases-api", () => ({
  casesApi: {
    list: vi.fn(),
  },
  formatTpeDate: vi.fn(() => "2026-05-15"),
  propertyTypeLabel: vi.fn(() => "成屋"),
  statusLabel: vi.fn(() => "草稿"),
}));

vi.mock("@/lib/tauri-bridge", () => ({
  NotInTauriError: class NotInTauriError extends Error {},
}));

import CasesPage from "../page";
import { casesApi } from "@/lib/cases-api";
import { NotInTauriError } from "@/lib/tauri-bridge";

const mockList = vi.mocked(casesApi.list);

describe("Cases page fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders tauri-required message on NotInTauriError", async () => {
    mockList.mockRejectedValue(new NotInTauriError("not in tauri"));

    render(<CasesPage />);

    await waitFor(() => {
      expect(screen.getByText("此功能需在 AIRE 桌面 App 中使用")).toBeInTheDocument();
    });
  });
});
