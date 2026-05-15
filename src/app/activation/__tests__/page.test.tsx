import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ActivationPage } from "../page";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

vi.mock("@/lib/tauri-bridge", () => ({
  isTauriEnv: vi.fn(),
  safeInvoke: vi.fn(),
  NotInTauriError: class NotInTauriError extends Error {},
}));

import { isTauriEnv, safeInvoke } from "@/lib/tauri-bridge";

const mockIsTauriEnv = vi.mocked(isTauriEnv);
const mockSafeInvoke = vi.mocked(safeInvoke);

describe("ActivationPage async tauri detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders serial key form when isTauriEnv resolves true", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mockIsTauriEnv.mockResolvedValue(true);

    render(<ActivationPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("授權序號")).toBeInTheDocument();
    });
  });

  it("renders desktop-app hint when isTauriEnv resolves false", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mockIsTauriEnv.mockResolvedValue(false);

    render(<ActivationPage />);

    await waitFor(() => {
      expect(screen.getByText("請在 AIRE 桌面 App 中開啟")).toBeInTheDocument();
    });
  });

  it("runs activation flow in development browser env", async () => {
    vi.stubEnv("NODE_ENV", "development");
    mockIsTauriEnv.mockResolvedValue(false);
    mockSafeInvoke.mockResolvedValue({ success: true });

    render(<ActivationPage />);

    const input = await screen.findByLabelText("授權序號");
    fireEvent.change(input, { target: { value: "TEST-KEY-123" } });
    fireEvent.click(screen.getByRole("button", { name: "啟動授權" }));

    await waitFor(() => {
      expect(mockSafeInvoke).toHaveBeenCalledWith("activate_license", {
        key: "TEST-KEY-123",
      });
      expect(mockReplace).toHaveBeenCalledWith("/cases");
    });
  });
});
