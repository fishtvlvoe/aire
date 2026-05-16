import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/settings/logs",
}));

vi.mock("@/lib/tauri-bridge", () => ({
  isTauriEnv: vi.fn(),
}));

vi.mock("@/lib/mock-backend", () => ({
  mockInvoke: vi.fn(),
}));

import LogsPage from "../page";
import { isTauriEnv } from "@/lib/tauri-bridge";
import { mockInvoke } from "@/lib/mock-backend";

const mockIsTauriEnv = vi.mocked(isTauriEnv);
const mockInvokeFn = vi.mocked(mockInvoke);

describe("Logs page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsTauriEnv.mockResolvedValue(true);
  });

  it("shows empty state when no operation logs exist", async () => {
    mockInvokeFn.mockResolvedValue([]);

    render(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByText("尚無操作紀錄")).toBeInTheDocument();
    });
  });

  it("renders log table sorted by timestamp desc", async () => {
    mockInvokeFn.mockResolvedValue([
      {
        id: "old-log",
        timestamp: "2026-05-16T08:00:00.000Z",
        action: "更新案件",
        detail: "更新案件：old",
        user_email: "old@test.aire",
      },
      {
        id: "new-log",
        timestamp: "2026-05-16T10:00:00.000Z",
        action: "建立案件",
        detail: "建立案件：new",
        user_email: "new@test.aire",
      },
    ]);

    render(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("建立案件")).toBeInTheDocument();
    expect(within(rows[1]).getByText("建立案件：new")).toBeInTheDocument();
    expect(within(rows[2]).getByText("更新案件")).toBeInTheDocument();
  });
});
