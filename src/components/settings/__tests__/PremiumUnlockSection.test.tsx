import "@testing-library/jest-dom/vitest";

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PremiumUnlockSection } from "../PremiumUnlockSection";

vi.mock("@/lib/mock-backend", () => ({
  mockInvoke: vi.fn(),
}));

import { mockInvoke } from "@/lib/mock-backend";

const mockInvokeFn = vi.mocked(mockInvoke);

describe("PremiumUnlockSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未訂閱時顯示說明和前往訂閱按鈕", async () => {
    mockInvokeFn.mockResolvedValueOnce({
      subscribed: false,
      plan: null,
      expires_at: null,
    });

    render(<PremiumUnlockSection />);

    await waitFor(() => {
      expect(screen.getByText("實價登錄 MCP Hub")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "前往訂閱" })).toBeInTheDocument();
  });

  it("點擊前往訂閱呼叫 subscribe_premium", async () => {
    mockInvokeFn
      .mockResolvedValueOnce({ subscribed: false, plan: null, expires_at: null })
      .mockResolvedValueOnce({ redirect_url: "https://opcos.tw/checkout/mcp-hub" });

    const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(<PremiumUnlockSection />);

    await waitFor(() => screen.getByRole("button", { name: "前往訂閱" }));

    fireEvent.click(screen.getByRole("button", { name: "前往訂閱" }));

    await waitFor(() => {
      expect(mockInvokeFn).toHaveBeenCalledWith("subscribe_premium");
      expect(windowOpenSpy).toHaveBeenCalledWith(
        "https://opcos.tw/checkout/mcp-hub",
        "_blank",
        "noopener,noreferrer",
      );
    });

    windowOpenSpy.mockRestore();
  });

  it("已訂閱時顯示訂閱中 Badge 和管理訂閱連結", async () => {
    mockInvokeFn.mockResolvedValueOnce({
      subscribed: true,
      plan: "MCP Hub 年繳",
      expires_at: "2027-05-15",
    });

    render(<PremiumUnlockSection />);

    await waitFor(() => {
      expect(screen.getByText("訂閱中")).toBeInTheDocument();
    });

    expect(screen.getByText("MCP Hub 年繳")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "管理訂閱" })).toBeInTheDocument();
  });
});
