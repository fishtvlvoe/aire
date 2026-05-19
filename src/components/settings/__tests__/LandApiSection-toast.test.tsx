/**
 * TDD: Bug#7 地政 API 儲存 toast + Bug NEW-4 測試連線真實 HTTP
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
    if (cmd === "get_land_api_settings") return Promise.resolve({ clientId: "", secret: "" });
    return Promise.resolve({ success: true });
  }),
}));

import { LandApiSection } from "../LandApiSection";
import { mockInvoke } from "@/lib/mock-backend";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(mockInvoke).mockImplementation((cmd: string) => {
    if (cmd === "get_land_api_settings") return Promise.resolve({ clientId: "", secret: "" });
    return Promise.resolve({ success: true });
  });
  fetchMock.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: false, latency_ms: 100, error: "認證失敗" }),
  });
});

async function fillAndWaitReady() {
  render(<LandApiSection />);
  await waitFor(() => screen.getByLabelText("Client ID"));
  await userEvent.type(screen.getByLabelText("Client ID"), "QA-CLIENT");
  await userEvent.type(screen.getByLabelText("安全碼"), "QA-SECRET");
}

describe("LandApiSection — Bug#7 儲存 toast", () => {
  it("填值後點儲存 → toast.success 含「儲存」", async () => {
    await fillAndWaitReady();
    await userEvent.click(screen.getByRole("button", { name: /^儲存$/ }));
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
      const msg = vi.mocked(toast.success).mock.calls[0][0] as string;
      expect(msg).toMatch(/儲存/);
    });
  });
});

describe("LandApiSection — Bug NEW-4 測試連線真實 HTTP", () => {
  it("點測試連線 → 呼叫 fetch('/api/land-api/test-connection')", async () => {
    await fillAndWaitReady();
    await userEvent.click(screen.getByRole("button", { name: /測試連線/ }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/land-api/test-connection",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });
});
