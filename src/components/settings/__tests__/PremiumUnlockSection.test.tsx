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

  it("未訂閱時顯示說明和前往升級按鈕", async () => {
    mockInvokeFn.mockResolvedValueOnce({
      subscribed: false,
      plan: null,
      expires_at: null,
    }).mockResolvedValueOnce({ authenticated: false });

    render(<PremiumUnlockSection />);

    await waitFor(() => {
      expect(screen.getByText("實價登錄 MCP Hub")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "前往升級" })).toBeInTheDocument();
  });

  it("點擊前往升級呼叫 subscribe_premium 並開啟 OPCOS AIRE 申請入口", async () => {
    mockInvokeFn
      .mockResolvedValueOnce({ subscribed: false, plan: null, expires_at: null })
      .mockResolvedValueOnce({ authenticated: false })
      .mockResolvedValueOnce({ redirect_url: "https://opcos.me/products/aire?intent=request-access" });

    const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(<PremiumUnlockSection />);

    await waitFor(() => screen.getByRole("button", { name: "前往升級" }));

    fireEvent.click(screen.getByRole("button", { name: "前往升級" }));

    await waitFor(() => {
      expect(mockInvokeFn).toHaveBeenCalledWith("subscribe_premium");
      expect(windowOpenSpy).toHaveBeenCalledWith(
        "https://opcos.me/products/aire?intent=request-access",
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
    }).mockResolvedValueOnce({ authenticated: false });

    render(<PremiumUnlockSection />);

    await waitFor(() => {
      expect(screen.getByText("訂閱中")).toBeInTheDocument();
    });

    expect(screen.getByText("MCP Hub 年繳")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "管理訂閱" })).toBeInTheDocument();
  });

  it("admin 顯示已啟用（管理員）且不顯示前往訂閱按鈕", async () => {
    mockInvokeFn
      .mockResolvedValueOnce({ subscribed: false, plan: null, expires_at: null })
      .mockResolvedValueOnce({
        authenticated: true,
        user: { email: "admin@test.aire", role: "admin" },
      });

    render(<PremiumUnlockSection />);

    await waitFor(() => {
      expect(screen.getByText("已啟用（管理員）")).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: "前往升級" })).toBeNull();
    expect(mockInvokeFn).not.toHaveBeenCalledWith("subscribe_premium");
  });
});
