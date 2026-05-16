import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/settings/logs",
}));

vi.mock("@/lib/log", () => ({
  listRecentLogs: vi.fn(),
  formatLogTime: vi.fn((v: number) => String(v)),
  labelForAction: vi.fn((v: string) => v),
}));

vi.mock("@/lib/tauri-bridge", () => ({
  isTauriEnv: vi.fn(),
}));

import LogsPage from "../page";
import { isTauriEnv } from "@/lib/tauri-bridge";

const mockIsTauriEnv = vi.mocked(isTauriEnv);

describe("Logs page fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders tauri-required message outside tauri", async () => {
    mockIsTauriEnv.mockResolvedValue(false);

    render(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByText("此功能需在 AIRE 桌面 App 中使用")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: "一般設定" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "品牌設定" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "操作日誌" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
