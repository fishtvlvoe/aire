import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("@/lib/tauri-bridge", () => ({
  isTauriEnv: vi.fn(),
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
});
