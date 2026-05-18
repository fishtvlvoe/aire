import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("@/lib/tauri-bridge", () => ({
  isTauriEnv: vi.fn(),
  safeInvoke: vi.fn().mockResolvedValue({}),
}));

import BrandingContent from "../branding-content";
import { isTauriEnv } from "@/lib/tauri-bridge";

const mockIsTauriEnv = vi.mocked(isTauriEnv);

describe("Branding content fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows tauri-required message in browser env", async () => {
    mockIsTauriEnv.mockResolvedValue(false);

    render(<BrandingContent />);

    await waitFor(() => {
      expect(screen.getByText("此功能需在 AIRE 桌面 App 中使用")).toBeInTheDocument();
    });
  });

  it("renders five theme cards in tauri env", async () => {
    mockIsTauriEnv.mockResolvedValue(true);

    render(<BrandingContent />);

    await waitFor(() => {
      expect(screen.getByTestId("theme-item-theme-a-minimal")).toBeInTheDocument();
    });

    const cards = screen.getAllByTestId(/theme-item-/);
    expect(cards).toHaveLength(5);
    expect(screen.getByTestId("theme-item-theme-b-professional")).toBeInTheDocument();
    expect(screen.getByTestId("theme-item-theme-d-fresh")).toBeInTheDocument();
    expect(screen.getByTestId("theme-item-theme-e-warm")).toBeInTheDocument();
  });
});
