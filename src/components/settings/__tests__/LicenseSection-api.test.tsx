/**
 * TDD: Bug#6 授權序號啟用改呼叫 API
 * 啟用按鈕 → fetch('/api/v1/licenses/activate') POST 被呼叫
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

vi.mock("@/lib/mock-backend", () => ({
  mockInvoke: vi.fn((cmd: string) => {
    if (cmd === "get_license_status") return Promise.resolve({ status: "none", serial_key: null });
    return Promise.resolve({ success: true });
  }),
}));

import { LicenseSection } from "../LicenseSection";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true }),
  });
});

describe("LicenseSection — Bug#6 API 啟用", () => {
  it("點啟用授權 → 呼叫 fetch('/api/v1/licenses/activate') POST", async () => {
    render(<LicenseSection />);
    await waitFor(() => screen.getByPlaceholderText(/序號/));
    await userEvent.type(screen.getByPlaceholderText(/序號/), "AIRE-TEST-2026-ADMIN");
    await userEvent.click(screen.getByRole("button", { name: "啟用授權" }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/licenses/activate",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("API 回 200 → toast.success 含「啟用成功」", async () => {
    render(<LicenseSection />);
    await waitFor(() => screen.getByPlaceholderText(/序號/));
    await userEvent.type(screen.getByPlaceholderText(/序號/), "AIRE-TEST-2026-ADMIN");
    await userEvent.click(screen.getByRole("button", { name: "啟用授權" }));
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("API 回 4xx → toast.error 含「序號無效」", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ error: "INVALID_KEY" }),
    });
    render(<LicenseSection />);
    await waitFor(() => screen.getByPlaceholderText(/序號/));
    await userEvent.type(screen.getByPlaceholderText(/序號/), "INVALID-KEY");
    await userEvent.click(screen.getByRole("button", { name: "啟用授權" }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
      const msg = vi.mocked(toast.error).mock.calls[0][0] as string;
      expect(msg).toMatch(/序號無效/);
    });
  });
});
