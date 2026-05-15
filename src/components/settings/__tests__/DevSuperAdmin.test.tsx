import "@testing-library/jest-dom/vitest";

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DevSuperAdmin } from "../DevSuperAdmin";

vi.mock("@/lib/mock-backend", () => ({
  mockInvoke: vi.fn(),
}));

import { mockInvoke } from "@/lib/mock-backend";

const mockInvokeFn = vi.mocked(mockInvoke);

const MOCK_FLAGS = [
  { id: "premium-unlock", name: "進階功能解鎖", enabled: false },
  { id: "mcp-hub", name: "MCP Hub", enabled: false },
  { id: "land-registry-api", name: "地政 API", enabled: true },
];

describe("DevSuperAdmin", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: originalEnv,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  });

  it("development 環境渲染 Super Admin section", async () => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "development",
      writable: true,
      configurable: true,
      enumerable: true,
    });

    mockInvokeFn.mockResolvedValueOnce(MOCK_FLAGS);

    render(<DevSuperAdmin />);

    await waitFor(() => {
      expect(screen.getByText("Super Admin")).toBeInTheDocument();
    });

    expect(screen.getByText("進階功能解鎖")).toBeInTheDocument();
    expect(screen.getByText("MCP Hub")).toBeInTheDocument();
    expect(screen.getByText("地政 API")).toBeInTheDocument();
  });

  it("toggle flag 呼叫 toggle_feature_flag", async () => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "development",
      writable: true,
      configurable: true,
      enumerable: true,
    });

    mockInvokeFn
      .mockResolvedValueOnce(MOCK_FLAGS)
      .mockResolvedValueOnce({ success: true, enabled: true });

    render(<DevSuperAdmin />);

    await waitFor(() => screen.getByText("進階功能解鎖"));

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    await waitFor(() => {
      expect(mockInvokeFn).toHaveBeenCalledWith("toggle_feature_flag", {
        id: "premium-unlock",
      });
    });
  });

  it("production 環境不渲染", () => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "production",
      writable: true,
      configurable: true,
      enumerable: true,
    });

    const { container } = render(<DevSuperAdmin />);

    expect(container.firstChild).toBeNull();
  });
});
