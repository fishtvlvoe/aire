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

vi.mock("@/lib/land-registry-api", () => ({
  setApiKey: vi.fn(async () => undefined),
  testConnection: vi.fn(async () => ({ success: false, message: "認證失敗" })),
}));

import { LandApiSection } from "../LandApiSection";
import { mockInvoke } from "@/lib/mock-backend";
import { testConnection } from "@/lib/land-registry-api";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(mockInvoke).mockImplementation((cmd: string) => {
    if (cmd === "get_land_api_settings") return Promise.resolve({ clientId: "", secret: "" });
    return Promise.resolve({ success: true });
  });
  vi.mocked(testConnection).mockResolvedValue({ success: false, message: "認證失敗" });
});

async function fillAndWaitReady() {
  render(<LandApiSection />);
  await waitFor(() => screen.getByLabelText("帳號識別碼"));
  await userEvent.type(screen.getByLabelText("帳號識別碼"), "QA-CLIENT");
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

describe("LandApiSection — Bug NEW-4 測試連線", () => {
  it("點測試連線 → 呼叫地政 bridge 測試連線，不走 Next API timeout 路徑", async () => {
    await fillAndWaitReady();
    await userEvent.click(screen.getByRole("button", { name: /測試連線/ }));
    await waitFor(() => {
      expect(testConnection).toHaveBeenCalled();
    });
  });
});
