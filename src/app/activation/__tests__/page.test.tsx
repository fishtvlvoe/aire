import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, waitFor, screen } from "@testing-library/react";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

import ActivationPage from "../page";

describe("Activation redirect page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /settings and does not render old activation form", async () => {
    render(<ActivationPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/settings");
    });

    expect(screen.queryByText("啟動授權")).not.toBeInTheDocument();
    expect(screen.queryByText("啟動後可離線使用 30 天")).not.toBeInTheDocument();
  });
});
