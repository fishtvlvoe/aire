import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { ActivationPage } from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

vi.mock("@/lib/tauri-bridge", () => ({
  isTauriEnv: vi.fn(),
  safeInvoke: vi.fn(),
  NotInTauriError: class NotInTauriError extends Error {},
}));

import { isTauriEnv } from "@/lib/tauri-bridge";

const mockIsTauriEnv = vi.mocked(isTauriEnv);

describe("ActivationPage async tauri detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders serial key form when isTauriEnv resolves true", async () => {
    mockIsTauriEnv.mockResolvedValue(true);

    render(<ActivationPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("授權序號")).toBeInTheDocument();
    });
  });

  it("renders desktop-app hint when isTauriEnv resolves false", async () => {
    mockIsTauriEnv.mockResolvedValue(false);

    render(<ActivationPage />);

    await waitFor(() => {
      expect(screen.getByText("請在 AIRE 桌面 App 中開啟")).toBeInTheDocument();
    });
  });
});
