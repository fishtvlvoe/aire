import "@testing-library/jest-dom/vitest";

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LicenseSection } from "../LicenseSection";

vi.mock("@/lib/mock-backend", () => ({
  mockInvoke: vi.fn(),
}));

import { mockInvoke } from "@/lib/mock-backend";

const mockInvokeFn = vi.mocked(mockInvoke);

describe("LicenseSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未啟用狀態顯示序號輸入框和啟用按鈕", async () => {
    mockInvokeFn.mockResolvedValueOnce({ status: "none", serial_key: null });

    render(<LicenseSection />);

    await waitFor(() => {
      expect(screen.getByText("尚未啟用授權")).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/序號/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "啟用授權" })).toBeInTheDocument();
  });

  it("啟用成功後顯示已啟用", async () => {
    mockInvokeFn
      .mockResolvedValueOnce({ status: "none", serial_key: null })
      .mockResolvedValueOnce({ success: true });

    render(<LicenseSection />);

    await waitFor(() => screen.getByPlaceholderText(/序號/));

    fireEvent.change(screen.getByPlaceholderText(/序號/), {
      target: { value: "AIRE-TEST-VALID-001" },
    });
    fireEvent.click(screen.getByRole("button", { name: "啟用授權" }));

    await waitFor(() => {
      expect(screen.getByText("已啟用")).toBeInTheDocument();
    });

    expect(mockInvokeFn).toHaveBeenCalledWith("activate_license", {
      serial_key: "AIRE-TEST-VALID-001",
    });
  });

  it("啟用失敗顯示序號無效", async () => {
    mockInvokeFn
      .mockResolvedValueOnce({ status: "none", serial_key: null })
      .mockRejectedValueOnce(new Error("INVALID_KEY"));

    render(<LicenseSection />);

    await waitFor(() => screen.getByPlaceholderText(/序號/));

    fireEvent.change(screen.getByPlaceholderText(/序號/), {
      target: { value: "INVALID" },
    });
    fireEvent.click(screen.getByRole("button", { name: "啟用授權" }));

    await waitFor(() => {
      expect(screen.getByText("序號無效")).toBeInTheDocument();
    });
  });

  it("停用確認後回到未啟用", async () => {
    mockInvokeFn
      .mockResolvedValueOnce({ status: "valid", serial_key: "AIRE-TEST-VALID-001" })
      .mockResolvedValueOnce({ success: true });

    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<LicenseSection />);

    await waitFor(() => screen.getByText("已啟用"));

    fireEvent.click(screen.getByRole("button", { name: "停用授權" }));

    await waitFor(() => {
      expect(screen.getByText("尚未啟用授權")).toBeInTheDocument();
    });

    expect(mockInvokeFn).toHaveBeenCalledWith("deactivate_license");
  });

  it("停用取消後維持已啟用", async () => {
    mockInvokeFn.mockResolvedValueOnce({ status: "valid", serial_key: "AIRE-TEST-VALID-001" });

    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<LicenseSection />);

    await waitFor(() => screen.getByText("已啟用"));

    fireEvent.click(screen.getByRole("button", { name: "停用授權" }));

    expect(screen.getByText("已啟用")).toBeInTheDocument();
    expect(mockInvokeFn).not.toHaveBeenCalledWith("deactivate_license");
  });
});
